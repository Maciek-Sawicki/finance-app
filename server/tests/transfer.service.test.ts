import { createTransferService } from '../services/transfer.service.js';
import * as accountRepository from '../repositories/account.repository.js';
import * as categoryRepository from '../repositories/category.repository.js';
import * as transactionRepository from '../repositories/transaction.repository.js';
import * as transferRepository from '../repositories/transfer.repository.js';
import type { CurrencyService } from '../services/exchangeRate.service.js';
import type { MongooseSessionFactory } from '../types/common.js';

type AccountRepository = jest.Mocked<typeof accountRepository>;
type CategoryRepository = jest.Mocked<typeof categoryRepository>;
type TransactionRepository = jest.Mocked<typeof transactionRepository>;
type TransferRepository = jest.Mocked<typeof transferRepository>;
type LeanAccount = NonNullable<Awaited<ReturnType<typeof accountRepository.findById>>>;
type CategoryDoc = Awaited<ReturnType<typeof categoryRepository.findByNameAndType>>;
type CreatedTransactions = Awaited<ReturnType<typeof transactionRepository.createMany>>;
type CreatedTransfer = Awaited<ReturnType<typeof transferRepository.create>>;

const createFakeAccountRepository = (): AccountRepository => ({ findById: jest.fn() } as unknown as AccountRepository);
const createFakeCategoryRepository = (): CategoryRepository =>
  ({ findByNameAndType: jest.fn(), create: jest.fn() } as unknown as CategoryRepository);
const createFakeTransactionRepository = (): TransactionRepository =>
  ({ createMany: jest.fn() } as unknown as TransactionRepository);
const createFakeTransferRepository = (): TransferRepository => ({ create: jest.fn() } as unknown as TransferRepository);
const createFakeCurrencyService = (): jest.Mocked<CurrencyService> =>
  ({ convertCurrency: jest.fn() } as unknown as jest.Mocked<CurrencyService>);

// A fake session whose withTransaction just invokes the callback directly -
// enough to unit-test the service's own logic (currency branching, category
// reuse, error status codes) without touching a real MongoDB session.
const createFakeMongoose = () => {
  const session = { withTransaction: jest.fn((fn: () => unknown) => fn()), endSession: jest.fn() };
  const mongooseInstance = { startSession: jest.fn().mockResolvedValue(session) } as unknown as MongooseSessionFactory;
  return { mongooseInstance, session };
};

const account = (overrides: Partial<Omit<LeanAccount, '_id'> & { _id: string }> = {}): LeanAccount =>
  ({ _id: 'acc', name: 'Account', currency: 'USD', ...overrides } as unknown as LeanAccount);

describe('transfer.service', () => {
  it('rejects a transfer between the same account before touching the database', async () => {
    const accountRepository = createFakeAccountRepository();
    const { mongooseInstance } = createFakeMongoose();
    const service = createTransferService(
      accountRepository, createFakeCategoryRepository(), createFakeTransactionRepository(),
      createFakeTransferRepository(), createFakeCurrencyService(), mongooseInstance
    );

    await expect(service.create('user1', { fromAccountId: 'acc1', toAccountId: 'acc1', amount: 10 }))
      .rejects.toMatchObject({ status: 400 });
    expect(accountRepository.findById).not.toHaveBeenCalled();
  });

  it('rejects when either account does not belong to the user', async () => {
    const accountRepository = createFakeAccountRepository();
    accountRepository.findById.mockResolvedValueOnce(account()).mockResolvedValueOnce(null);
    const { mongooseInstance } = createFakeMongoose();
    const service = createTransferService(
      accountRepository, createFakeCategoryRepository(), createFakeTransactionRepository(),
      createFakeTransferRepository(), createFakeCurrencyService(), mongooseInstance
    );

    await expect(service.create('user1', { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 10 }))
      .rejects.toMatchObject({ status: 404 });
  });

  it('uses a 1:1 rate and skips conversion when both accounts share a currency', async () => {
    const accountRepository = createFakeAccountRepository();
    accountRepository.findById.mockResolvedValueOnce(account({ _id: 'acc1' })).mockResolvedValueOnce(account({ _id: 'acc2' }));
    const categoryRepository = createFakeCategoryRepository();
    categoryRepository.findByNameAndType.mockResolvedValue({ _id: 'cat1' } as unknown as CategoryDoc);
    const transactionRepository = createFakeTransactionRepository();
    transactionRepository.createMany.mockResolvedValue([{ _id: 'exp' }, { _id: 'inc' }] as unknown as CreatedTransactions);
    const transferRepository = createFakeTransferRepository();
    transferRepository.create.mockResolvedValue({ _id: 'transfer1' } as unknown as CreatedTransfer);
    const currencyService = createFakeCurrencyService();
    const { mongooseInstance } = createFakeMongoose();

    const service = createTransferService(
      accountRepository, categoryRepository, transactionRepository, transferRepository, currencyService, mongooseInstance
    );

    await service.create('user1', { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 100 });

    expect(currencyService.convertCurrency).not.toHaveBeenCalled();
    expect(transferRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ fromAmount: 100, toAmount: 100, exchangeRate: 1 }),
      expect.any(Object)
    );
  });

  it('converts the amount when accounts use different currencies', async () => {
    const accountRepository = createFakeAccountRepository();
    accountRepository.findById
      .mockResolvedValueOnce(account({ _id: 'acc1', currency: 'USD' }))
      .mockResolvedValueOnce(account({ _id: 'acc2', currency: 'EUR' }));
    const categoryRepository = createFakeCategoryRepository();
    categoryRepository.findByNameAndType.mockResolvedValue({ _id: 'cat1' } as unknown as CategoryDoc);
    const transactionRepository = createFakeTransactionRepository();
    transactionRepository.createMany.mockResolvedValue([{ _id: 'exp' }, { _id: 'inc' }] as unknown as CreatedTransactions);
    const transferRepository = createFakeTransferRepository();
    transferRepository.create.mockResolvedValue({ _id: 'transfer1' } as unknown as CreatedTransfer);
    const currencyService = createFakeCurrencyService();
    currencyService.convertCurrency.mockResolvedValue(90);
    const { mongooseInstance } = createFakeMongoose();

    const service = createTransferService(
      accountRepository, categoryRepository, transactionRepository, transferRepository, currencyService, mongooseInstance
    );

    await service.create('user1', { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 100 });

    expect(currencyService.convertCurrency).toHaveBeenCalledWith(100, 'USD', 'EUR');
    expect(transferRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ fromAmount: 100, toAmount: 90, exchangeRate: 0.9 }),
      expect.any(Object)
    );
  });

  it('honors a caller-supplied toAmount instead of calling the currency service', async () => {
    const accountRepository = createFakeAccountRepository();
    accountRepository.findById
      .mockResolvedValueOnce(account({ _id: 'acc1', currency: 'USD' }))
      .mockResolvedValueOnce(account({ _id: 'acc2', currency: 'EUR' }));
    const categoryRepository = createFakeCategoryRepository();
    categoryRepository.findByNameAndType.mockResolvedValue({ _id: 'cat1' } as unknown as CategoryDoc);
    const transactionRepository = createFakeTransactionRepository();
    transactionRepository.createMany.mockResolvedValue([{ _id: 'exp' }, { _id: 'inc' }] as unknown as CreatedTransactions);
    const transferRepository = createFakeTransferRepository();
    transferRepository.create.mockResolvedValue({ _id: 'transfer1' } as unknown as CreatedTransfer);
    const currencyService = createFakeCurrencyService();
    const { mongooseInstance } = createFakeMongoose();

    const service = createTransferService(
      accountRepository, categoryRepository, transactionRepository, transferRepository, currencyService, mongooseInstance
    );

    await service.create('user1', { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 100, toAmount: 92 });

    expect(currencyService.convertCurrency).not.toHaveBeenCalled();
    expect(transferRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ toAmount: 92, exchangeRate: 0.92 }),
      expect.any(Object)
    );
  });

  it('reuses an existing "Transfer" category instead of creating a duplicate', async () => {
    const accountRepository = createFakeAccountRepository();
    accountRepository.findById.mockResolvedValueOnce(account({ _id: 'acc1' })).mockResolvedValueOnce(account({ _id: 'acc2' }));
    const categoryRepository = createFakeCategoryRepository();
    categoryRepository.findByNameAndType.mockResolvedValue({ _id: 'existing-cat' } as unknown as CategoryDoc);
    const transactionRepository = createFakeTransactionRepository();
    transactionRepository.createMany.mockResolvedValue([{ _id: 'exp' }, { _id: 'inc' }] as unknown as CreatedTransactions);
    const transferRepository = createFakeTransferRepository();
    transferRepository.create.mockResolvedValue({ _id: 'transfer1' } as unknown as CreatedTransfer);
    const { mongooseInstance } = createFakeMongoose();

    const service = createTransferService(
      accountRepository, categoryRepository, transactionRepository, transferRepository, createFakeCurrencyService(), mongooseInstance
    );

    await service.create('user1', { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 10 });

    expect(categoryRepository.create).not.toHaveBeenCalled();
  });

  it('tags an unsupported-currency conversion failure as a 400, not a 500', async () => {
    const accountRepository = createFakeAccountRepository();
    accountRepository.findById
      .mockResolvedValueOnce(account({ _id: 'acc1', currency: 'USD' }))
      .mockResolvedValueOnce(account({ _id: 'acc2', currency: 'XYZ' }));
    const currencyService = createFakeCurrencyService();
    currencyService.convertCurrency.mockRejectedValue(new Error('Unsupported currency: USD or XYZ'));
    const { mongooseInstance } = createFakeMongoose();

    const service = createTransferService(
      accountRepository, createFakeCategoryRepository(), createFakeTransactionRepository(),
      createFakeTransferRepository(), currencyService, mongooseInstance
    );

    await expect(service.create('user1', { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 10 }))
      .rejects.toMatchObject({ status: 400 });
  });

  it('always ends the session, even when the transaction fails', async () => {
    const accountRepository = createFakeAccountRepository();
    accountRepository.findById.mockResolvedValueOnce(account({ _id: 'acc1' })).mockResolvedValueOnce(account({ _id: 'acc2' }));
    const categoryRepository = createFakeCategoryRepository();
    categoryRepository.findByNameAndType.mockResolvedValue({ _id: 'cat1' } as unknown as CategoryDoc);
    const transferRepository = createFakeTransferRepository();
    transferRepository.create.mockRejectedValue(new Error('boom'));
    const { mongooseInstance, session } = createFakeMongoose();

    const service = createTransferService(
      accountRepository, categoryRepository, createFakeTransactionRepository(),
      transferRepository, createFakeCurrencyService(), mongooseInstance
    );

    await expect(service.create('user1', { fromAccountId: 'acc1', toAccountId: 'acc2', amount: 10 })).rejects.toThrow('boom');
    expect(session.endSession).toHaveBeenCalled();
  });
});
