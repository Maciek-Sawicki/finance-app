import type { UserDocument } from "../models/user.model.js";

declare global {
  namespace Express {
    // Every route that reads req.user is gated by the authenticate
    // middleware, which populates it before the controller runs - declaring
    // it as required (rather than optional) avoids non-null assertions
    // throughout every controller.
    interface Request {
      user: UserDocument;
    }
  }
}

export {};
