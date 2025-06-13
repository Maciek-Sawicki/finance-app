import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
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
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true, 
});

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
