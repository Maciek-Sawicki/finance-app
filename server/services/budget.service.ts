import mongoose from "mongoose";
import * as budgetRepository from "../repositories/budget.repository.js";
import * as categoryRepository from "../repositories/category.repository.js";
import * as transactionRepository from "../repositories/transaction.repository.js";
import * as exchangeRateService from "./exchangeRate.service.js";
import type { CurrencyService } from "./exchangeRate.service.js";
import type { BudgetAttrs } from "../models/budget.model.js";
import type { Id } from "../types/common.js";

type BudgetRepository = typeof budgetRepository;
type CategoryRepository = typeof categoryRepository;
type TransactionRepository = typeof transactionRepository;

type LeanBudget = NonNullable<Awaited<ReturnType<BudgetRepository["findById"]>>>;

const domainError = (message: string, status: number): Error => Object.assign(new Error(message), { status });

interface BudgetInput {
  categoryId?: Id;
  amount?: number;
  currency?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  type?: string;
  recurrencePeriod?: string;
  carryOver?: boolean;
  status?: string;
}

export const createBudgetService = (
  budgetRepository: BudgetRepository,
  categoryRepository: CategoryRepository,
  transactionRepository: TransactionRepository,
  currencyService: CurrencyService
) => {
  const categoryIdOf = (budget: LeanBudget) => budget.categoryId._id ?? budget.categoryId;

  const withProgress = async (budget: LeanBudget, targetCurrency: string) => {
    const byCurrency = await transactionRepository.aggregateCategorySpendByCurrency(
      budget.userId, categoryIdOf(budget), budget.startDate, budget.endDate
    );

    const spentTotal = (
      await Promise.all(
        byCurrency.map(({ _id: currency, total }) =>
          currency === targetCurrency ? total : currencyService.convertCurrency(total, currency as string, targetCurrency)
        )
      )
    ).reduce((sum, amount) => sum + amount, 0);

    const convertedBudgetAmount =
      budget.currency === targetCurrency
        ? budget.amount
        : await currencyService.convertCurrency(budget.amount, budget.currency, targetCurrency);

    return {
      ...budget,
      originalAmount: budget.amount,
      originalCurrency: budget.currency,
      convertedAmount: Number(convertedBudgetAmount.toFixed(2)),
      spent: Number(spentTotal.toFixed(2)),
      progress: (spentTotal / convertedBudgetAmount) * 100,
      targetCurrency,
    };
  };

  const create = async (userId: Id, data: BudgetInput) => {
    const { categoryId, amount, currency, startDate, endDate, type, recurrencePeriod } = data;
    if (!categoryId || !amount || !currency || !startDate || !endDate) {
      throw domainError("Missing required fields.", 400);
    }

    const category = await categoryRepository.findById(userId, categoryId);
    if (!category) throw domainError("Category not found.", 404);
    if (category.type !== "expense") {
      throw domainError("Budget can only be assigned to an expense category.", 400);
    }
    if (type === "fixed" && recurrencePeriod) {
      throw domainError("Fixed budgets cannot have recurrencePeriod.", 400);
    }

    return budgetRepository.create({ userId, categoryId, amount, currency, startDate, endDate, type, recurrencePeriod } as mongoose.AnyKeys<BudgetAttrs>);
  };

  const list = async (userId: Id, filter: Parameters<BudgetRepository["findByUser"]>[1], targetCurrency: string) => {
    if (!targetCurrency) throw domainError("targetCurrency is required.", 400);

    const budgets = await budgetRepository.findByUser(userId, filter);
    return Promise.all(budgets.map((b) => withProgress(b, targetCurrency)));
  };

  const getById = async (userId: Id, budgetId: Id, targetCurrency: string) => {
    if (!targetCurrency) throw domainError("targetCurrency is required.", 400);

    const budget = await budgetRepository.findById(userId, budgetId);
    if (!budget) throw domainError("Budget not found.", 404);
    return withProgress(budget, targetCurrency);
  };

  const update = async (userId: Id, budgetId: Id, data: BudgetInput) => {
    const updateData: BudgetInput = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.recurrencePeriod !== undefined) updateData.recurrencePeriod = data.recurrencePeriod;
    if (data.carryOver !== undefined) updateData.carryOver = data.carryOver;
    if (data.status !== undefined) updateData.status = data.status;

    if (updateData.endDate && new Date(updateData.endDate) < new Date()) {
      updateData.status = "completed";
    }

    const updated = await budgetRepository.updateById(userId, budgetId, updateData as mongoose.UpdateQuery<BudgetAttrs>);
    if (!updated) throw domainError("Budget not found.", 404);
    return updated;
  };

  const remove = async (userId: Id, budgetId: Id) => {
    const deleted = await budgetRepository.deleteById(userId, budgetId);
    if (!deleted) throw domainError("Budget not found.", 404);
  };

  const getByType = async (userId: Id, status: string, targetCurrency: string) => {
    if (!targetCurrency) throw domainError("targetCurrency is required.", 400);
    if (!["completed", "active"].includes(status)) throw domainError("Invalid status parameter.", 400);

    const budgets = await budgetRepository.findByUser(userId, { status });
    return Promise.all(budgets.map((b) => withProgress(b, targetCurrency)));
  };

  const getHistory = async (userId: Id, categoryId: Id, targetCurrency: string) => {
    if (!targetCurrency) throw domainError("targetCurrency is required.", 400);

    const budgets = await budgetRepository.findByCategory(userId, categoryId);
    return Promise.all(
      budgets.map(async (b) => {
        const full = await withProgress(b, targetCurrency);
        const status = new Date() > b.endDate || full.spent >= b.amount ? "completed" : "active";
        return { ...full, status };
      })
    );
  };

  return { create, list, getById, update, remove, getByType, getHistory };
};

const defaultService = createBudgetService(budgetRepository, categoryRepository, transactionRepository, exchangeRateService);

export const { create, list, getById, update, remove, getByType, getHistory } = defaultService;
