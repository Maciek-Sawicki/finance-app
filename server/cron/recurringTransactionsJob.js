import cron from "node-cron";
import RecurringTransaction from "../models/recurringTransaction.model.js";
import Transaction from "../models/transaction.model.js";
import Category from "../models/category.model.js";

const isDue = (nextDueDate) => new Date(nextDueDate) <= new Date();

const getNextCustomDate = (r) => {
  const today = new Date(r.nextDueDate);
  const c = r.customInterval;
  let nextDate = new Date(today);

  if (c.everyXDays) { nextDate.setDate(nextDate.getDate() + c.everyXDays); return nextDate; }
  if (c.everyXWeeks) { nextDate.setDate(nextDate.getDate() + 7*c.everyXWeeks); return nextDate; }
  if (c.everyXMonths) { nextDate.setMonth(nextDate.getMonth() + c.everyXMonths); return nextDate; }
  if (c.dayOfMonth) { nextDate.setMonth(nextDate.getMonth() + 1); nextDate.setDate(c.dayOfMonth); return nextDate; }

  if (c.dayOfWeek && c.weekOfMonth) {
    const dayOfWeekMap = { Sunday:0, Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6 };
    const weekOfMonthMap = { First:1, Second:2, Third:3, Fourth:4, Last:-1 };
    const targetDay = dayOfWeekMap[c.dayOfWeek];
    const targetWeek = weekOfMonthMap[c.weekOfMonth];

    const year = nextDate.getFullYear();
    const month = nextDate.getMonth() + 1; 
    nextDate = new Date(year, month, 1);

    if (targetWeek === -1) {
      const lastDay = new Date(year, month + 1, 0);
      const diff = (lastDay.getDay() - targetDay + 7) % 7;
      lastDay.setDate(lastDay.getDate() - diff);
      nextDate = lastDay;
    } else {
      const firstDay = new Date(year, month, 1);
      const diff = (targetDay - firstDay.getDay() + 7) % 7;
      nextDate = new Date(year, month, 1 + diff + 7*(targetWeek-1));
    }
    return nextDate;
  }

  return nextDate;
};

const calculateNextDate = (r) => {
  if (r.frequency === "custom") return getNextCustomDate(r);

  let nextDate = new Date(r.nextDueDate);
  switch(r.frequency){
    case "daily": nextDate.setDate(nextDate.getDate() + 1); break;
    case "weekly": nextDate.setDate(nextDate.getDate() + 7); break;
    case "biweekly": nextDate.setDate(nextDate.getDate() + 14); break;
    case "monthly": nextDate.setMonth(nextDate.getMonth() + 1); break;
    case "quarterly": nextDate.setMonth(nextDate.getMonth() + 3); break;
    case "yearly": nextDate.setFullYear(nextDate.getFullYear() + 1); break;
  }
  return nextDate;
};


export const startRecurringTransactionJob = () => {
  cron.schedule("0 1-23/6 * * *", async () => {
    console.log("Checking recurring transactions...");
    const recurringTransactions = await RecurringTransaction.find({ isActive: true });

    for (const r of recurringTransactions) {
      if (isDue(r.nextDueDate)) {
        try {
          const category = await Category.findById(r.categoryId);
          if (!category) throw new Error("Category not found");

          const type = category.type;

          await Transaction.create({
            userId: r.userId,
            categoryId: r.categoryId,
            accountId: r.accountId,
            amount: r.amount,
            type,
            description: r.description,
            settled: false,
          });

          console.log(`Transaction created for recurring '${r.name}'`);
          const nextDate = calculateNextDate(r);
          r.nextDueDate = nextDate;

          await r.save();
        } catch (err) {
          console.error(`Error creating transaction for '${r.name}':`, err);
        }
      }
    }
  });
};

