import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from "mongoose";
import { softDeletePlugin, type SoftDeleteAttrs } from "./plugins/softDelete.plugin.js";

const importSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  fileName: {
    type: String,
    required: true,
    trim: true,
  },
  uploadDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    required: true,
    default: 'pending',
  },
  rowCount: {
    type: Number,
    required: true,
    min: 0,
  },
  importedCount: {
    type: Number,
    required: true,
    min: 0,
  },
  skippedCount: {
    type: Number,
    required: true,
    min: 0,
  },
  importErrors: [{
    rowNumber: Number,
    message: String,
  }],
  importIdToken: {
    type: String,
    required: true,
    unique: true,
  }
}, {
  timestamps: true,
});

importSchema.plugin(softDeletePlugin);

export type ImportAttrs = InferSchemaType<typeof importSchema> & SoftDeleteAttrs;
export type ImportDocument = HydratedDocument<ImportAttrs>;

const Import = mongoose.model<ImportAttrs>("Import", importSchema);
export default Import;
