import Import from "../models/import.model.js";
import Transaction from "../models/transaction.model.js";
import Papa from "papaparse";
import { v4 as uuid } from "uuid";

export const createImport = async (req, res) => {
  try {
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ message: "Missing accountId" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const importRecord = await Import.create({
      userId: req.user._id,
      accountId,
      fileName: req.file.originalname,
      importIdToken: uuid(),
      status: "pending",
      rowCount: 0,
      importedCount: 0,
      skippedCount: 0,
      errors: [],
    });

    const csvText = req.file.buffer.toString("utf-8");
    const firstLine = csvText.split(/\r?\n/)[0];
    const delimiter = firstLine.includes(";") ? ";" : ",";

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter,
      transformHeader: (h) => h.trim().replace(/"/g, "").toLowerCase(),
      transform: (value) => value?.trim().replace(/"/g, "") || "",
    });

    const rows = parsed.data;
    let imported = 0;
    let skipped = 0;
    const txToInsert = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row || Object.values(row).every(v => v === "")) {
        continue;
      }

      // Keys name normalization
      const dateStr = row["date"] || row["data"];
      let amountStr = row["amount"] || row["kwota"];
      const description = row["description"] || row["opis"] || "";

      if (!dateStr || !amountStr) {
        importRecord.errors.push({
          rowNumber: i + 1,
          message: "Missing date or amount"
        });
        skipped++;
        continue;
      }

      // Normalize amount string
      amountStr = amountStr.replace(",", ".");
      const amountNum = Number(amountStr);

      const date = new Date(dateStr);

      if (!date.getTime() || isNaN(amountNum)) {
        importRecord.errors.push({
          rowNumber: i + 1,
          message: "Invalid date or amount format"
        });
        skipped++;
        continue;
      }

      const type = amountNum < 0 ? "expense" : "income";

      txToInsert.push({
        userId: req.user._id,
        accountId,
        importId: importRecord._id,
        date,
        amount: Math.abs(amountNum),
        type,
        description,
        categoryId: null,
      });

      imported++;
    }

    if (txToInsert.length > 0) {
      await Transaction.insertMany(txToInsert);
    }

    importRecord.status = "completed";
    importRecord.rowCount = rows.length;
    importRecord.importedCount = imported;
    importRecord.skippedCount = skipped;

    await importRecord.save();

    res.json({ message: "Import completed", import: importRecord });
  } catch (error) {
    console.error("Error during import:", error);
    res.status(500).json({ message: "Server error during import" });
  }
};

export const getUserImports = async (req, res) => {
  try {
    const imports = await Import.find({
      userId: req.user._id,
    })
      .sort({ createdAt: -1 }) 
      .select(
        "_id accountId fileName status rowCount importedCount skippedCount createdAt uploadDate"
      );

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
    const { id } = req.params;

    const tx = await Transaction.find({ importId: id }).sort({ date: -1 });

    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: "Error fetching import transactions" });
  }
};

export const updateTransactionCategory = async (req, res) => {
  const { transactionId } = req.params;
  const { categoryId } = req.body;

  if (!categoryId) {
    return res.status(400).json({ message: "No categoryId" });
  }

  const tx = await Transaction.findOneAndUpdate(
    { _id: transactionId, userId: req.user._id },
    { $set: { categoryId } },
    { new: true }
  );

  if (!tx) {
    return res.status(404).json({ message: "No transactions found" });
  }

  res.json(tx);
};


export const batchUpdateTransactionCategories = async (req, res) => {
  try {
    const { id: importId } = req.params;
    const { updates } = req.body; 

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No data to update" });
    }

    const bulkOps = updates.map(u => ({
      updateOne: {
        filter: { _id: u.transactionId, importId, userId: req.user._id },
        update: { $set: { categoryId: u.categoryId } }
      }
    }));

    const result = await Transaction.bulkWrite(bulkOps);

    res.json({
      message: "Categories updated",
      modifiedCount: result.modifiedCount,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating categories" });
  }
};

export const deleteImport = async (req, res) => {
  try {
    const { id } = req.params;

    await Transaction.deleteMany({ importId: id });
    await Import.findByIdAndDelete(id);

    res.json({ message: "Import and associated transactions deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting import" });
  }
};

