import Requirement from "../models/requirement.js";
import Candidate from "../models/candidate.js";

// GET /api/job
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Requirement.find()
      //   .select("jobRole experience skills createdAt")
      .sort({ createdAt: -1 });

    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

// GET /api/job/:jobId
export const getSingleJob = async (req, res) => {
  try {
    const job = await Requirement.findById(req.params.jobId).populate(
      "candidates",
    );

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch job" });
  }
};

// Info page
export const getJobInfo = async (req, res) => {
  const job = await Requirement.findById(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  res.json({ success: true, job });
};

// Update job
export const updateJobInfo = async (req, res) => {
  const allowedFields = [
    "clientRequirement",
    "jobDescription",
    "screeningQuestions",
    "linkedinPost",
  ];

  const update = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });

  const job = await Requirement.findByIdAndUpdate(req.params.jobId, update, {
    new: true,
  });

  res.json({ success: true, job });
};

// DELETE /api/job/:jobId
export const deleteJob = async (req, res) => {
  const { jobId } = req.params;

  const job = await Requirement.findById(jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  // 🔥 Delete all candidates linked to this job
  await Candidate.deleteMany({ job: jobId });

  // 🔥 Delete the job itself
  await Requirement.findByIdAndDelete(jobId);

  res.json({
    success: true,
    message: "Job and related candidates deleted",
  });
};

// POST /api/job/:jobId/question
export const addScreeningQuestion = async (req, res) => {
  const { jobId } = req.params;
  const { question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: "Question is required" });
  }

  const job = await Requirement.findById(jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  job.screeningQuestions.push(question.trim());
  await job.save();

  res.json({
    success: true,
    screeningQuestions: job.screeningQuestions,
  });
};

// DELETE /api/job/:jobId/question/:index
export const removeScreeningQuestion = async (req, res) => {
  const { jobId, index } = req.params;

  const job = await Requirement.findById(jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const idx = Number(index);

  if (Number.isNaN(idx) || idx < 0 || idx >= job.screeningQuestions.length) {
    return res.status(400).json({ error: "Invalid question index" });
  }

  job.screeningQuestions.splice(idx, 1);
  await job.save();

  res.json({
    success: true,
    screeningQuestions: job.screeningQuestions,
  });
};
