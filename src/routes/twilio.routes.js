import { Router } from "express";
import {
  handleVoice,
  handleRecording,
  handleTranscription,
  handleStatus,
  initiateScreeningCall, // 👈 ADD
} from "../controllers/twilio.controller.js";

const router = Router();

// Webhooks (already there)
router.post("/voice", handleVoice);
router.post("/recording", handleRecording);
router.post("/transcription", handleTranscription);
router.post("/status", handleStatus);

// 👉 Frontend-triggered API
router.post("/call/:candidateId", initiateScreeningCall);

export default router;
