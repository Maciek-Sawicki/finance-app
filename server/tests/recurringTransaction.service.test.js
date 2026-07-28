import { createRecurringTransactionService } from '../services/recurringTransaction.service.js';

const createFakeRepository = () => ({
  findByUser: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  toggleActive: jest.fn(),
});

const recurring = (overrides = {}) => ({
  _id: 'rec1',
  userId: 'user1',
  name: 'Rent',
  categoryId: 'cat1',
  accountId: 'acc1',
  amount: 1000,
  frequency: 'monthly',
  nextDueDate: new Date('2026-02-01'),
  isActive: true,
  ...overrides,
});

describe('recurringTransaction.service', () => {
  describe('getById', () => {
    it('rejects with 404 when the transaction does not belong to the user', async () => {
      const repository = createFakeRepository();
      repository.findById.mockResolvedValue(null);
      const service = createRecurringTransactionService(repository);

      await expect(service.getById('user1', 'missing')).rejects.toMatchObject({ status: 404 });
    });

    it('returns the transaction when found', async () => {
      const repository = createFakeRepository();
      repository.findById.mockResolvedValue(recurring());
      const service = createRecurringTransactionService(repository);

      expect(await service.getById('user1', 'rec1')).toEqual(recurring());
    });
  });

  describe('create', () => {
    it('whitelists fields and injects the userId, ignoring any userId in the payload', async () => {
      const repository = createFakeRepository();
      repository.create.mockResolvedValue(recurring());
      const service = createRecurringTransactionService(repository);

      await service.create('user1', {
        name: 'Rent', categoryId: 'cat1', accountId: 'acc1', amount: 1000, frequency: 'monthly',
        nextDueDate: '2026-02-01', userId: 'attacker', _id: 'forged',
      });

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Rent', categoryId: 'cat1', accountId: 'acc1', amount: 1000, frequency: 'monthly',
        nextDueDate: '2026-02-01', userId: 'user1',
      });
    });
  });

  describe('update', () => {
    it('whitelists fields instead of trusting the raw request body', async () => {
      const repository = createFakeRepository();
      repository.updateById.mockResolvedValue(recurring({ amount: 1200 }));
      const service = createRecurringTransactionService(repository);

      await service.update('user1', 'rec1', { amount: 1200, userId: 'attacker', _id: 'forged' });

      expect(repository.updateById).toHaveBeenCalledWith('user1', 'rec1', { amount: 1200 });
    });

    it('rejects with 404 when the transaction does not belong to the user', async () => {
      const repository = createFakeRepository();
      repository.updateById.mockResolvedValue(null);
      const service = createRecurringTransactionService(repository);

      await expect(service.update('user1', 'missing', { amount: 1 })).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('remove', () => {
    it('rejects with 404 when the transaction does not belong to the user', async () => {
      const repository = createFakeRepository();
      repository.deleteById.mockResolvedValue(null);
      const service = createRecurringTransactionService(repository);

      await expect(service.remove('user1', 'missing')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('toggleActive', () => {
    it('rejects with 404 when the transaction does not belong to the user', async () => {
      const repository = createFakeRepository();
      repository.toggleActive.mockResolvedValue(null);
      const service = createRecurringTransactionService(repository);

      await expect(service.toggleActive('user1', 'missing')).rejects.toMatchObject({ status: 404 });
    });

    it('returns the toggled transaction', async () => {
      const repository = createFakeRepository();
      repository.toggleActive.mockResolvedValue(recurring({ isActive: false }));
      const service = createRecurringTransactionService(repository);

      const result = await service.toggleActive('user1', 'rec1');
      expect(result.isActive).toBe(false);
    });
  });
});
