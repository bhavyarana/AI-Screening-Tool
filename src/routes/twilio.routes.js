import { Router } from "express";
import {
  handleVoice,
  handleRecording,
  handleTranscription,
  handleStatus,
} from "../controllers/twilio.controller.js";

const router = Router();

router.post("/voice", handleVoice);
router.post("/recording", handleRecording);
router.post("/transcription", handleTranscription);
router.post("/status", handleStatus);

export default router;
