import { Router } from "express";
import { preScreener } from "../controllers/preScreening.controller.js";

const router = Router();

router.post("/prescreen", preScreener);

export default router;
