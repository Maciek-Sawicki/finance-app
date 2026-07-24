import fs from "fs";
import https from "https";

import app from './app.js';
import { fetchRatesJob } from "./cron/fetchRatesJob.js";
import { startRecurringTransactionJob } from "./cron/recurringTransactionsJob.js";

import connectMongoDB from './db/connectMongoDB.js';

const PORT = process.env.PORT || 5000;

const httpsOptions = {
  key: fs.readFileSync("./certs/server.key"),
  cert: fs.readFileSync("./certs/server.cert"),
};

const httpsServer = https.createServer(httpsOptions, app);

httpsServer.listen(PORT, () => {
  console.log(`HTTPS server running on port ${PORT}`);
  connectMongoDB();

  fetchRatesJob();
  startRecurringTransactionJob();
});

