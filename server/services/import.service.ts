import mongoose from "mongoose";
// Type-only side-effect import: pulls in @types/multer's `declare global
// { namespace Express { namespace Multer { interface File } } }`
// augmentation, which otherwise only loads once something imports the
// multer package itself.
import type {} from "multer";
import Papa from "papaparse";
import { randomUUID } from "node:crypto";
import * as importRepository from "../repositories/import.repository.js";
import * as transactionRepository from "../repositories/transaction.repository.js";
import * as accountRepository from "../repositories/account.repository.js";
import * as categoryRepository from "../repositories/category.repository.js";
import type { Id, MongooseSessionFactory } from "../types/common.js";

type ImportRepository = typeof importRepository;
type TransactionRepository = typeof transactionRepository;
type AccountRepository = typeof accountRepository;
type CategoryRepository = typeof categoryRepository;

const domainError = (message: string, status: number): Error => Object.assign(new Error(message), { status });

interface ParsedTransaction {
  date: Date;
  amount: number;
  type: "income" | "expense";
  description: string;
  categoryId: null;
}

interface ParseRowError {
  rowNumber: number;
  message: string;
}

interface ParseCsvResult {
  rowCount: number;
  transactions: ParsedTransaction[];
  errors: ParseRowError[];
}

// Pure - no I/O - so it's testable without a database. Kept as a named
// export for that reason even though createImportService is the only caller.
export const parseCsv = (csvText: string): ParseCsvResult => {
  const firstLine = csvText.split(/\r?\n/)[0] ?? "";
  const delimiter = firstLine.includes(";") ? ";" : ",";

  const { data: rows } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter,
    transformHeader: (h: string) => h.trim().replace(/"/g, "").toLowerCase(),
    transform: (value: string) => value?.trim().replace(/"/g, "") || "",
  });

  const transactions: ParsedTransaction[] = [];
  const errors: ParseRowError[] = [];

  rows.forEach((row, index) => {
    if (!row || Object.values(row).every((v) => v === "")) return;

    const dateStr = row["date"] || row["data"];
    let amountStr = row["amount"] || row["kwota"];
    const description = row["description"] || row["opis"] || "";

    if (!dateStr || !amountStr) {
      errors.push({ rowNumber: index + 1, message: "Missing date or amount" });
      return;
    }

    amountStr = amountStr.replace(",", ".");
    const amountNum = Number(amountStr);
    const date = new Date(dateStr);

    if (!date.getTime() || isNaN(amountNum)) {
      errors.push({ rowNumber: index + 1, message: "Invalid date or amount format" });
      return;
    }

    transactions.push({
      date,
      amount: Math.abs(amountNum),
      type: amountNum < 0 ? "expense" : "income",
      description,
      categoryId: null,
    });
  });

  return { rowCount: rows.length, transactions, errors };
};

interface CreateImportInput {
  accountId?: Id;
  file?: Express.Multer.File;
}

export const createImportService = (
  importRepository: ImportRepository,
  transactionRepository: TransactionRepository,
  accountRepository: AccountRepository,
  categoryRepository: CategoryRepository,
  mongooseInstance: MongooseSessionFactory = mongoose
) => {
  const create = async (userId: Id, { accountId, file }: CreateImportInput) => {
    if (!accountId) throw domainError("Missing accountId", 400);
    if (!file) throw domainError("No file uploaded", 400);

    const account = await accountRepository.findById(userId, accountId);
    if (!account) throw domainError("Account not found.", 404);

    const { rowCount, transactions, errors } = parseCsv(file.buffer.toString("utf-8"));
    const importId = new mongoose.Types.ObjectId();

    const session = await mongooseInstance.startSession();
    try {
      await session.withTransaction(async () => {
        await importRepository.create(
          {
            _id: importId,
            userId,
            accountId,
            fileName: file.originalname,
            importIdToken: randomUUID(),
            status: "completed",
            rowCount,
            importedCount: transactions.length,
            skippedCount: errors.length,
            importErrors: errors,
          },
          { session }
        );

        if (transactions.length > 0) {
          await transactionRepository.createMany(
            transactions.map((t) => ({ ...t, userId, accountId, importId })),
            { session }
          );
        }
      });
    } finally {
      await session.endSession();
    }

    return importRepository.findById(userId, importId);
  };

  const listForUser = (userId: Id) => importRepository.findByUser(userId);

  const getTransactions = async (userId: Id, importId: Id) => {
    const importRecord = await importRepository.findById(userId, importId);
    if (!importRecord) throw domainError("Import not found.", 404);
    return transactionRepository.findByImport(userId, importId);
  };

  const updateTransactionCategory = async (userId: Id, transactionId: Id, categoryId: Id | undefined) => {
    if (!categoryId) throw domainError("No categoryId", 400);

    const category = await categoryRepository.findById(userId, categoryId);
    if (!category) throw domainError("Category not found.", 404);

    const updated = await transactionRepository.updateById(userId, transactionId, { categoryId });
    if (!updated) throw domainError("No transactions found", 404);
    return updated;
  };

  const batchUpdateTransactionCategories = async (userId: Id, importId: Id, updates: Array<{ transactionId: Id; categoryId: Id }>) => {
    if (!Array.isArray(updates) || updates.length === 0) throw domainError("No data to update", 400);

    const uniqueCategoryIds = [...new Set(updates.map((u) => u.categoryId.toString()))];
    const categories = await Promise.all(uniqueCategoryIds.map((id) => categoryRepository.findById(userId, id)));
    if (categories.some((category) => !category)) throw domainError("Category not found.", 404);

    return transactionRepository.bulkUpdateCategories(userId, importId, updates);
  };

  const remove = async (userId: Id, importId: Id) => {
    const importRecord = await importRepository.findById(userId, importId);
    if (!importRecord) throw domainError("Import not found.", 404);

    await transactionRepository.deleteByImport(userId, importId);
    await importRepository.deleteById(userId, importId);
  };

  return { create, listForUser, getTransactions, updateTransactionCategory, batchUpdateTransactionCategories, remove };
};

const defaultService = createImportService(importRepository, transactionRepository, accountRepository, categoryRepository);

export const {
  create,
  listForUser,
  getTransactions,
  updateTransactionCategory,
  batchUpdateTransactionCategories,
  remove,
} = defaultService;
