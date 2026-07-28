import mongoose from "mongoose";
import Papa from "papaparse";
import { randomUUID } from "node:crypto";
import * as importRepository from "../repositories/import.repository.js";
import * as transactionRepository from "../repositories/transaction.repository.js";

const domainError = (message, status) => Object.assign(new Error(message), { status });

// Pure - no I/O - so it's testable without a database. Kept as a named
// export for that reason even though createImportService is the only caller.
export const parseCsv = (csvText) => {
  const firstLine = csvText.split(/\r?\n/)[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";

  const { data: rows } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter,
    transformHeader: (h) => h.trim().replace(/"/g, "").toLowerCase(),
    transform: (value) => value?.trim().replace(/"/g, "") || "",
  });

  const transactions = [];
  const errors = [];

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

export const createImportService = (importRepository, transactionRepository, mongooseInstance = mongoose) => {
  const create = async (userId, { accountId, file }) => {
    if (!accountId) throw domainError("Missing accountId", 400);
    if (!file) throw domainError("No file uploaded", 400);

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

  const listForUser = (userId) => importRepository.findByUser(userId);

  const getTransactions = async (userId, importId) => {
    const importRecord = await importRepository.findById(userId, importId);
    if (!importRecord) throw domainError("Import not found.", 404);
    return transactionRepository.findByImport(userId, importId);
  };

  const updateTransactionCategory = async (userId, transactionId, categoryId) => {
    if (!categoryId) throw domainError("No categoryId", 400);

    const updated = await transactionRepository.updateById(userId, transactionId, { categoryId });
    if (!updated) throw domainError("No transactions found", 404);
    return updated;
  };

  const batchUpdateTransactionCategories = async (userId, importId, updates) => {
    if (!Array.isArray(updates) || updates.length === 0) throw domainError("No data to update", 400);
    return transactionRepository.bulkUpdateCategories(userId, importId, updates);
  };

  const remove = async (userId, importId) => {
    const importRecord = await importRepository.findById(userId, importId);
    if (!importRecord) throw domainError("Import not found.", 404);

    await transactionRepository.deleteByImport(userId, importId);
    await importRepository.deleteById(userId, importId);
  };

  return { create, listForUser, getTransactions, updateTransactionCategory, batchUpdateTransactionCategories, remove };
};

const defaultService = createImportService(importRepository, transactionRepository);

export const {
  create,
  listForUser,
  getTransactions,
  updateTransactionCategory,
  batchUpdateTransactionCategories,
  remove,
} = defaultService;
