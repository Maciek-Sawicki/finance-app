import { createAccountService } from '../services/account.service.js';

const createFakeAccountRepository = () => ({
  findByUser: jest.fn(),
  findById: jest.fn(),
  findDefault: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  unsetDefaultForUser: jest.fn(),
});

const createFakeTransactionRepository = () => ({
  aggregateAccountBalance: jest.fn(),
  aggregateBalancesByAccount: jest.fn(),
  deleteByAccount: jest.fn(),
});

const createFakeCurrencyService = () => ({
  getRates: jest.fn(),
  convertCurrency: jest.fn((amount) => Promise.resolve(amount)),
});

const account = (overrides = {}) => ({
  _id: 'acc1',
  userId: 'user1',
  name: 'Checking',
  type: 'checking',
  currency: 'USD',
  startingBalance: 100,
  isDefault: false,
  ...overrides,
});

describe('account.service', () => {
  describe('list', () => {
    it('computes balances with a single batched aggregation instead of one per account', async () => {
      const accountRepository = createFakeAccountRepository();
      const transactionRepository = createFakeTransactionRepository();
      accountRepository.findByUser.mockResolvedValue([account({ _id: 'acc1' }), account({ _id: 'acc2' })]);
      transactionRepository.aggregateBalancesByAccount.mockResolvedValue(
        new Map([
          ['acc1', { incomeSettled: 50, expenseSettled: 20, incomeAll: 50, expenseAll: 20 }],
          ['acc2', { incomeSettled: 0, expenseSettled: 0, incomeAll: 0, expenseAll: 0 }],
        ])
      );
      const service = createAccountService(accountRepository, transactionRepository, createFakeCurrencyService());

      const result = await service.list('user1');

      expect(transactionRepository.aggregateBalancesByAccount).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        expect.objectContaining({ _id: 'acc1', balance: 130, balanceAfterRP: 130 }),
        expect.objectContaining({ _id: 'acc2', balance: 100, balanceAfterRP: 100 }),
      ]);
    });

    it('returns an empty array without querying transactions when the user has no accounts', async () => {
      const accountRepository = createFakeAccountRepository();
      const transactionRepository = createFakeTransactionRepository();
      accountRepository.findByUser.mockResolvedValue([]);
      const service = createAccountService(accountRepository, transactionRepository, createFakeCurrencyService());

      const result = await service.list('user1');

      expect(result).toEqual([]);
      expect(transactionRepository.aggregateBalancesByAccount).not.toHaveBeenCalled();
    });

    it('forwards an optional filter (e.g. type/currency) to the repository', async () => {
      const accountRepository = createFakeAccountRepository();
      const transactionRepository = createFakeTransactionRepository();
      accountRepository.findByUser.mockResolvedValue([]);
      const service = createAccountService(accountRepository, transactionRepository, createFakeCurrencyService());

      await service.list('user1', { type: 'savings' });

      expect(accountRepository.findByUser).toHaveBeenCalledWith('user1', { type: 'savings' });
    });
  });

  describe('getById / getDefault', () => {
    it('returns null when the account does not exist', async () => {
      const accountRepository = createFakeAccountRepository();
      const transactionRepository = createFakeTransactionRepository();
      accountRepository.findById.mockResolvedValue(null);
      const service = createAccountService(accountRepository, transactionRepository, createFakeCurrencyService());

      expect(await service.getById('user1', 'missing')).toBeNull();
      expect(transactionRepository.aggregateAccountBalance).not.toHaveBeenCalled();
    });

    it('attaches balance and balanceAfterRP for a found account', async () => {
      const accountRepository = createFakeAccountRepository();
      const transactionRepository = createFakeTransactionRepository();
      accountRepository.findDefault.mockResolvedValue(account({ startingBalance: 1000 }));
      transactionRepository.aggregateAccountBalance.mockResolvedValue({
        incomeSettled: 100, expenseSettled: 300, incomeAll: 150, expenseAll: 300,
      });
      const service = createAccountService(accountRepository, transactionRepository, createFakeCurrencyService());

      const result = await service.getDefault('user1');

      expect(result.balance).toBe(800);
      expect(result.balanceAfterRP).toBe(850);
    });
  });

  describe('remove', () => {
    it('does not cascade-delete transactions when the account was not found', async () => {
      const accountRepository = createFakeAccountRepository();
      const transactionRepository = createFakeTransactionRepository();
      accountRepository.deleteById.mockResolvedValue(null);
      const service = createAccountService(accountRepository, transactionRepository, createFakeCurrencyService());

      const result = await service.remove('user1', 'missing');

      expect(result).toBe(false);
      expect(transactionRepository.deleteByAccount).not.toHaveBeenCalled();
    });

    it('cascade-deletes transactions after deleting the account', async () => {
      const accountRepository = createFakeAccountRepository();
      const transactionRepository = createFakeTransactionRepository();
      accountRepository.deleteById.mockResolvedValue(account());
      const service = createAccountService(accountRepository, transactionRepository, createFakeCurrencyService());

      const result = await service.remove('user1', 'acc1');

      expect(result).toBe(true);
      expect(transactionRepository.deleteByAccount).toHaveBeenCalledWith('user1', 'acc1');
    });
  });

  describe('setDefault', () => {
    it('unsets every other account before setting the new default', async () => {
      const accountRepository = createFakeAccountRepository();
      const transactionRepository = createFakeTransactionRepository();
      accountRepository.updateById.mockResolvedValue(account({ isDefault: true }));
      transactionRepository.aggregateAccountBalance.mockResolvedValue(null);
      const service = createAccountService(accountRepository, transactionRepository, createFakeCurrencyService());

      await service.setDefault('user1', 'acc1');

      expect(accountRepository.unsetDefaultForUser).toHaveBeenCalledWith('user1');
      expect(accountRepository.unsetDefaultForUser.mock.invocationCallOrder[0])
        .toBeLessThan(accountRepository.updateById.mock.invocationCallOrder[0]);
    });

    it('returns null when the target account does not exist', async () => {
      const accountRepository = createFakeAccountRepository();
      const transactionRepository = createFakeTransactionRepository();
      accountRepository.updateById.mockResolvedValue(null);
      const service = createAccountService(accountRepository, transactionRepository, createFakeCurrencyService());

      expect(await service.setDefault('user1', 'missing')).toBeNull();
    });
  });

  describe('getTotalBalance', () => {
    it('converts every account balance into the requested base currency', async () => {
      const accountRepository = createFakeAccountRepository();
      const transactionRepository = createFakeTransactionRepository();
      const currencyService = createFakeCurrencyService();

      accountRepository.findByUser.mockResolvedValue([
        account({ _id: 'acc1', currency: 'USD', startingBalance: 100 }),
        account({ _id: 'acc2', currency: 'EUR', startingBalance: 100 }),
      ]);
      transactionRepository.aggregateBalancesByAccount.mockResolvedValue(new Map());
      currencyService.getRates.mockResolvedValue({ USD: 1, EUR: 0.5 });

      const service = createAccountService(accountRepository, transactionRepository, currencyService);
      const result = await service.getTotalBalance('user1', 'EUR');

      // acc1: 100 USD -> EUR = 100 / 1 * 0.5 = 50; acc2: 100 EUR -> EUR = 100 / 0.5 * 0.5 = 100
      expect(result).toEqual({ totalBalance: 150, totalAfterRP: 150 });
    });

    it('returns null when the user has no accounts', async () => {
      const accountRepository = createFakeAccountRepository();
      const transactionRepository = createFakeTransactionRepository();
      accountRepository.findByUser.mockResolvedValue([]);
      const service = createAccountService(accountRepository, transactionRepository, createFakeCurrencyService());

      expect(await service.getTotalBalance('user1', 'USD')).toBeNull();
    });

    it('throws for an unsupported currency', async () => {
      const accountRepository = createFakeAccountRepository();
      const transactionRepository = createFakeTransactionRepository();
      const currencyService = createFakeCurrencyService();

      accountRepository.findByUser.mockResolvedValue([account({ currency: 'XYZ' })]);
      transactionRepository.aggregateBalancesByAccount.mockResolvedValue(new Map());
      currencyService.getRates.mockResolvedValue({ USD: 1 });

      const service = createAccountService(accountRepository, transactionRepository, currencyService);

      await expect(service.getTotalBalance('user1', 'USD')).rejects.toThrow('Unsupported currency');
    });
  });
});
