import express from "express";
import morgan from "morgan";
import cors from "cors";

// Routes
import jobRoutes from "./routes/job.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import twilioRoutes from "./routes/twilio.routes.js";
import preScreenRoute from "./routes/preScreening.routes.js";
import call from "./services/makeCall.js";

const app = express();

/**
 * MIDDLEWARES
 */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/**
 * HEALTH CHECK
 */
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Screening Automation API running",
  });
});

/**
 * API ROUTES
 */
app.use("/api/job", jobRoutes);
app.use("/api/prescreen", preScreenRoute);
app.use("/api/resume", resumeRoutes);
app.use("/twilio", twilioRoutes);

/**
 * GLOBAL ERROR HANDLER (SAFE MINIMUM)
 */
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

app.get("/call", async (req, res) => {
  res.send("Making a call...");
  await call();
});

export default app;
