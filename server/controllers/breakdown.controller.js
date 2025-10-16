import Transaction from "@/models/Transaction";
import Account from "@/models/Account";

export const getSummaryDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const transactions = await Transaction.aggregate([
      { $match: { userId },
      exclude: { $ne: true },
      settled: true },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(tx => {
      if (tx._id === 'income') totalIncome = tx.totalAmount;
      if (tx._id === 'expense') totalExpense = tx.totalAmount;
    });

    // Account balances
    const accounts = await Account.find({ userId });
    const accountBalances = accounts.map(acc => ({
      id: acc._id,
      name: acc.name,
      balance: acc.startingBalance 
    }));

    res.status(200).json({
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      accountBalances
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}

