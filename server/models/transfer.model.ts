import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from "mongoose";

const transferSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fromAccountId: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  toAccountId: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  fromAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  toAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  exchangeRate: {
    type: Number,
    required: true,
    min: 0,
  },
}, {
  timestamps: true,
});

export type TransferAttrs = InferSchemaType<typeof transferSchema>;
export type TransferDocument = HydratedDocument<TransferAttrs>;

const Transfer = mongoose.model("Transfer", transferSchema);
export default Transfer;
