import { Router } from "express";
import {
  handleVoice,
  handleRecording,
  handleStatus,
  initiateScreeningCall,
} from "../controllers/twilio.controller.js";

const router = Router();

/**
 * Twilio Webhooks (POST only)
 */
router.get("/voice", handleVoice);
router.get("/recording", handleRecording);
router.get("/status", handleStatus);
router.post("/voice", handleVoice);
router.post("/recording", handleRecording);
router.post("/status", handleStatus);

/**
 * Frontend-triggered API
 */
router.post("/call/:candidateId", initiateScreeningCall);

export default router;
