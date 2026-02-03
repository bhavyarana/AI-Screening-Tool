import { Router } from "express";
import { getCandidateById } from "../controllers/candidate.controller.js";
import { getCandidateTranscript } from "../controllers/candidate.controller.js";

const router = Router();

router.get("/:candidateId", getCandidateById);
router.get("/:candidateId/transcript", getCandidateTranscript);

export default router;
