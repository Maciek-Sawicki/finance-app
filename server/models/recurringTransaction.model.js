import mongoose from "mongoose";

const recurringTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account", 
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0, 
  },
  currency: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'],
    required: true,
  },
  customInterval: {
    everyXDays: {
      type: Number,
      min: 1,
    },
    everyXWeeks: {
      type: Number,
      min: 1,
    },
    everyXMonths: {
      type: Number,
      min: 1,
    },
    dayofMonth: {
      type: Number,
      min: 1,
      max: 31,
    },
    dayofWeek: {
      type: String,
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    weekOfMonth: {
      type: String,
      enum: ['First', 'Second', 'Third', 'Fourth', 'Last'],
    },
  },
  nextDueDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true, 
  },
}, {
  timestamps: true, 
});
const RecurringTransaction = mongoose.model("RecurringTransaction", recurringTransactionSchema);
export default RecurringTransaction;