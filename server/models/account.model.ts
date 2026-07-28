import mongoose, { Schema, type InferSchemaType, type HydratedDocument } from "mongoose";

const accountSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    trim: true,
  },
  startingBalance: {
    type: Number,
    required: true,
    min: 0,
  },
  icon: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

export type AccountAttrs = InferSchemaType<typeof accountSchema>;
export type AccountDocument = HydratedDocument<AccountAttrs>;

const Account = mongoose.model("Account", accountSchema);
export default Account;
