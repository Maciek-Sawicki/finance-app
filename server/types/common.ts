import type mongoose from "mongoose";

// IDs flow through the app as either a real ObjectId (e.g. req.user._id) or
// a route-param string (e.g. req.params.id) - Mongoose accepts both
// interchangeably at query time, so repositories/services do too.
export type Id = mongoose.Types.ObjectId | string;

export interface SessionOption {
  session?: mongoose.ClientSession;
}

// Narrow slice of the mongoose module a service needs to open a
// multi-document transaction - lets tests inject a fake without having to
// implement the entire mongoose API surface.
export interface MongooseSessionFactory {
  startSession(): Promise<mongoose.ClientSession>;
}
