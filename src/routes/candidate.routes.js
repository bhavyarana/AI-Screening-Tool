import { Router } from "express";
import { getCandidateById } from "../controllers/candidate.controller.js";

const router = Router();

router.get("/:candidateId", getCandidateById);

export default router;
