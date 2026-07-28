import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from "mongoose";
import { softDeletePlugin, type SoftDeleteAttrs } from "./plugins/softDelete.plugin.js";

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

categorySchema.plugin(softDeletePlugin);

// Partial so a soft-deleted category's name/type no longer counts toward
// the uniqueness check - otherwise a user could never re-create a category
// they'd previously deleted.
categorySchema.index(
  { userId: 1, name: 1, type: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export type CategoryAttrs = InferSchemaType<typeof categorySchema> & SoftDeleteAttrs;
export type CategoryDocument = HydratedDocument<CategoryAttrs>;

const Category = mongoose.model<CategoryAttrs>("Category", categorySchema);
export default Category;
