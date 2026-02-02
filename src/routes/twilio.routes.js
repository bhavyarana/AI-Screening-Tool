import { Router } from "express";
import {
  handleVoice,
  handleRecording,
  handleTranscription,
  handleStatus,
  initiateScreeningCall,
} from "../controllers/twilio.controller.js";

const router = Router();

// Twilio webhooks
router.post("/voice", handleVoice);
router.get("/voice", handleVoice);

router.post("/recording", handleRecording);
router.get("/recording", handleRecording);

router.post("/transcription", handleTranscription);
router.get("/transcription", handleTranscription);

router.post("/status", handleStatus);
router.get("/status", handleStatus);

// Frontend-triggered call
router.post("/call/:candidateId", initiateScreeningCall);

export default router;
