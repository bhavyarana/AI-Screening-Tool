import Requirement from "../models/requirement.js";

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
