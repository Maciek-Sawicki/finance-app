import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"], 
      required: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);
export default Category;
