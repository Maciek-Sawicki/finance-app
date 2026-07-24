import Transfer from "../models/transfer.model.js";

export const create = async (data, { session } = {}) => {
  const [doc] = await Transfer.create([data], { session, ordered: true });
  return doc;
};
