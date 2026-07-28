import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Settings from "../models/settings.model.js";
import { initDefaultCategoriesForUser } from "../libs/utils/createCategories.js";
import type { MongooseSessionFactory } from "../types/common.js";

interface SignUpInput {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  country?: string;
}

export const createAuthService = (mongooseInstance: MongooseSessionFactory = mongoose) => {
  // Sign-up used to be three independent writes (User, default Categories,
  // Settings) with no session - a failure partway through (e.g. the
  // category insert) left a real, working account with no categories and
  // no Settings doc, and nothing told the caller anything had gone wrong.
  const signUp = async (data: SignUpInput) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const session = await mongooseInstance.startSession();
    let newUser!: Awaited<ReturnType<typeof User.create<{
      username: string; email: string; firstName: string; lastName: string; password: string;
    }>>>[number];

    try {
      await session.withTransaction(async () => {
        [newUser] = await User.create(
          [{
            username: data.username,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            password: hashedPassword,
          }],
          { session }
        );

        await initDefaultCategoriesForUser(newUser._id, { session });

        await Settings.create(
          [{
            userId: newUser._id,
            country: data.country || "US",
            locale: "en-US",
            defaultCurrency: "USD",
            favoriteCurrencies: [],
            theme: "system",
          }],
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return newUser;
  };

  return { signUp };
};

const defaultService = createAuthService();

export const { signUp } = defaultService;
