import fs from "fs";
import parseResume from "../services/resumeParser.js";
import scoreResume from "../services/resumeScoring.js";
import Candidate from "../models/candidate.js";
import jd from "../data/JD.js";
import extractResume from "../services/resumeExtract.js";

export const uploadResume = async (req, res, next) => {
  try {
    const text = await parseResume(req.file.path);
    const match = await extractResume(text);
    const resumeScore = await scoreResume(match, jd);

    if (!match) {
      throw new Error("AI did not return any data");
    }

    const score = Number(resumeScore) || 0;

    const getStatus = (score) => {
      if (score < 50) return "REJECT";
      if (score <= 80) return "REVIEW";
      return "AUTO_PASS";
    };

    const candidate = await Candidate.create({
      name: match.name || "",
      email: match.email || "",
      phone: match.phone || "",
      experience: match.experience || 0,
      skills: Array.isArray(match.skills) ? match.skills : [],
      matchScore: score,
      status: getStatus(score),
    });

    fs.unlinkSync(req.file.path);
    res.json(candidate);
  } catch (err) {
    console.error("UPLOAD ERROR:", err.message);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    next(err);
  }
};
