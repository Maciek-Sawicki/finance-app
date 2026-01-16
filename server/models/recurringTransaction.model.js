import mongoose from "mongoose";

const recurringTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  amount: { type: Number, required: true, min: 0 },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'],
    required: true,
  },
  customInterval: {
    everyXDays: { type: Number, min: 1 },
    everyXWeeks: { type: Number, min: 1 },
    everyXMonths: { type: Number, min: 1 },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    dayOfWeek: {
      type: String,
      enum: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    },
    weekOfMonth: {
      type: String,
      enum: ['First','Second','Third','Fourth','Last'],
    },
  },
  nextDueDate: { type: Date, required: true },
  // endDate: { type: Date },
  // repeatCount: { type: Number, default: 0 },
  // maxRepeats: { type: Number },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  settled: { type: Boolean, default: false },
}, { timestamps: true });

recurringTransactionSchema.pre('validate', function(next) {
  if (this.frequency === 'custom') {
    const c = this.customInterval;
    const count = [
      c.everyXDays ? 1 : 0,
      c.everyXWeeks ? 1 : 0,
      c.everyXMonths ? 1 : 0,
      c.dayOfMonth ? 1 : 0,
      (c.dayOfWeek && c.weekOfMonth) ? 1 : 0
    ].reduce((a,b)=>a+b,0);

    if (count === 0) return next(new Error("Custom frequency requires at least one interval to be set."));
    if (count > 1) return next(new Error("Custom frequency can only have one interval type set."));
    if ((c.dayOfWeek && !c.weekOfMonth) || (!c.dayOfWeek && c.weekOfMonth)) {
      return next(new Error("Both dayOfWeek and weekOfMonth must be set together."));
    }
  }
  next();
});

const RecurringTransaction = mongoose.model("RecurringTransaction", recurringTransactionSchema);
export default RecurringTransaction;
