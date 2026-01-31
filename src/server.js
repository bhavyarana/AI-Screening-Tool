import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

/**
 * DATABASE CONNECTION
 */
await connectDB();

/**
 * CREATE SERVER
 */
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

/**
 * START SERVER
 */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

/**
 * GRACEFUL SHUTDOWN (IMPORTANT)
 */
// process.on("SIGINT", async () => {
//   console.log("Shutting down server...");
//   process.exit(0);
// });
