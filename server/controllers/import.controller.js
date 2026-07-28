import * as importService from "../services/import.service.js";

export const createImport = async (req, res) => {
  try {
    const importRecord = await importService.create(req.user._id, {
      accountId: req.body.accountId,
      file: req.file,
    });
    res.json({ message: "Import completed", import: importRecord });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Error during import:", error);
    res.status(500).json({ message: "Server error during import" });
  }
};

export const getUserImports = async (req, res) => {
  try {
    const imports = await importService.listForUser(req.user._id);
    res.json(imports);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching user imports",
    });
  }
};

export const getImportTransactions = async (req, res) => {
  try {
    const tx = await importService.getTransactions(req.user._id, req.params.id);
    res.json(tx);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: "Error fetching import transactions" });
  }
};

export const updateTransactionCategory = async (req, res) => {
  try {
    const tx = await importService.updateTransactionCategory(req.user._id, req.params.transactionId, req.body.categoryId);
    res.json(tx);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: "Error updating transaction category" });
  }
};

export const batchUpdateTransactionCategories = async (req, res) => {
  try {
    const result = await importService.batchUpdateTransactionCategories(req.user._id, req.params.id, req.body.updates);
    res.json({
      message: "Categories updated",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Error updating categories" });
  }
};

export const deleteImport = async (req, res) => {
  try {
    await importService.remove(req.user._id, req.params.id);
    res.json({ message: "Import and associated transactions deleted" });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Error deleting import" });
  }
};
