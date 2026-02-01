import fs from "fs";
import parseResume from "../services/resumeParser.js";
import scoreResume from "../services/resumeScoring.js";
import extractResume from "../services/resumeExtract.js";
import Candidate from "../models/candidate.js";
import Requirement from "../models/requirement.js";
import { normalizeIndianPhone } from "../utils/phoneNormalizer.js";

export const uploadResume = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // 1️⃣ Fetch job
    const job = await Requirement.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // 2️⃣ JD = jobDescription ONLY
    const jd = job.jobDescription;

    // 2️⃣ Parse resume
    const text = await parseResume(req.file.path);
    const match = await extractResume(text);
    const resumeScore = await scoreResume(match, jd);

    // Handle no match case
    if (!match) throw new Error("AI did not return any data");

    // Extract score
    const score = Number(resumeScore) || 0;

    // Determine screening status
    const getStatus = (score) => {
      if (score < 50) return "REJECT";
      if (score <= 80) return "REVIEW";
      return "AUTO_PASS";
    };
    const screeningStatus = getStatus(score);

    // Normalize phone
    const normalizedPhone = normalizeIndianPhone(match.phone);

    // 3️⃣ Create candidate (schema-aligned)
    const candidate = await Candidate.create({
      name: match.name || "",
      phone: normalizedPhone || "",
      email: match.email || "",
      experience: match.experience || 0,
      skills: match.skills || [],
      matchScore: score,
      screeningStatus: screeningStatus,
      job: jobId, // ✅ REQUIRED
      callStatus: "pending", // call status
    });

    // 4️⃣ Link candidate to job
    job.candidates.push(candidate._id);
    await job.save();

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      candidate,
      score,
      screeningStatus: getStatus(score),
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err.message);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    next(err);
  }
};
