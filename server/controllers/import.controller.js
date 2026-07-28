import * as importService from "../services/import.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const createImport = asyncHandler(async (req, res) => {
  const importRecord = await importService.create(req.user._id, {
    accountId: req.body.accountId,
    file: req.file,
  });
  res.json({ message: "Import completed", import: importRecord });
});

export const getUserImports = asyncHandler(async (req, res) => {
  const imports = await importService.listForUser(req.user._id);
  res.json(imports);
});

export const getImportTransactions = asyncHandler(async (req, res) => {
  const tx = await importService.getTransactions(req.user._id, req.params.id);
  res.json(tx);
});

export const updateTransactionCategory = asyncHandler(async (req, res) => {
  const tx = await importService.updateTransactionCategory(req.user._id, req.params.transactionId, req.body.categoryId);
  res.json(tx);
});

export const batchUpdateTransactionCategories = asyncHandler(async (req, res) => {
  const result = await importService.batchUpdateTransactionCategories(req.user._id, req.params.id, req.body.updates);
  res.json({
    message: "Categories updated",
    modifiedCount: result.modifiedCount,
  });
});

export const deleteImport = asyncHandler(async (req, res) => {
  await importService.remove(req.user._id, req.params.id);
  res.json({ message: "Import and associated transactions deleted" });
});
