import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense", "transfer", "exclude"],
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

export type CategoryAttrs = InferSchemaType<typeof categorySchema>;
export type CategoryDocument = HydratedDocument<CategoryAttrs>;

const Category = mongoose.model("Category", categorySchema);
export default Category;
