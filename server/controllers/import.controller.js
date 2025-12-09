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
      status: "processing",
      rowCount: 0,
      importedCount: 0,
      skippedCount: 0,
      errors: [],
    });

    const csvText = req.file.buffer.toString("utf-8");

    const delimiter = csvText.includes(";") ? ";" : ",";

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter,
    });

    const rows = parsed.data;
    let imported = 0;
    let skipped = 0;
    const txToInsert = [];

    rows.forEach((row, index) => {
      const cleanRow = {};
      Object.keys(row).forEach(k => {
        cleanRow[k.trim()] = row[k] ? row[k].trim() : "";
      });

      const dateStr = cleanRow["Data"] || cleanRow["Date"];
      let amountStr = cleanRow["Kwota"] || cleanRow["Amount"];
      const description = cleanRow["Opis"] || cleanRow["Description"] || "";

      if (!dateStr || !amountStr) {
        importRecord.errors.push({ rowNumber: index + 1, message: "No date or amount" });
        skipped++;
        return;
      }

      amountStr = amountStr.replace(",", "."); 
      const amountNum = Number(amountStr);

      const date = new Date(dateStr);

      if (!date.getTime() || isNaN(amountNum)) {
        importRecord.errors.push({
          rowNumber: index + 1,
          message: "Invalid date or amount format",
        });
        skipped++;
        return;
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
    });

    if (txToInsert.length > 0) await Transaction.insertMany(txToInsert);

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

export const getImportTransactions = async (req, res) => {
  try {
    const { id } = req.params;

    const tx = await Transaction.find({ importId: id }).sort({ date: -1 });

    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: "Błąd przy pobieraniu transakcji importu" });
  }
};

export const updateTransactionCategory = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: "Brak categoryId" });
    }

    const tx = await Transaction.findOneAndUpdate(
      { _id: transactionId, userId: req.user._id },
      { $set: { categoryId } },
      { new: true }
    );

    if (!tx) {
      return res.status(404).json({ message: "Nie znaleziono transakcji" });
    }

    res.json({
      message: "Kategoria zaktualizowana",
      transaction: tx,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd podczas aktualizacji kategorii" });
  }
};

export const batchUpdateTransactionCategories = async (req, res) => {
  try {
    const { id: importId } = req.params;
    const { updates } = req.body; 

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "Brak danych do aktualizacji" });
    }

    const bulkOps = updates.map(u => ({
      updateOne: {
        filter: { _id: u.transactionId, importId, userId: req.user._id },
        update: { $set: { categoryId: u.categoryId } }
      }
    }));

    const result = await Transaction.bulkWrite(bulkOps);

    res.json({
      message: "Kategorie zaktualizowane",
      modifiedCount: result.modifiedCount,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd podczas aktualizacji kategorii" });
  }
};

export const deleteImport = async (req, res) => {
  try {
    const { id } = req.params;

    await Transaction.deleteMany({ importId: id });
    await Import.findByIdAndDelete(id);

    res.json({ message: "Import i związane transakcje usunięte" });
  } catch (err) {
    res.status(500).json({ message: "Błąd podczas usuwania importu" });
  }
};

