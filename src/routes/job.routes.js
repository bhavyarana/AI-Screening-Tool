// import { Router } from "express";
// import Job from "../models/job.js";

// const router = Router();

// /**
//  * CREATE JOB
//  * POST /api/job
//  */
// router.post("/", async (req, res) => {
//   try {
//     const { title, skills, experience } = req.body;

//     if (!title || !skills?.length) {
//       return res.status(400).json({ message: "Title and skills are required" });
//     }

//     const job = await Job.create({
//       title,
//       skills,
//       experience,
//     });

//     res.status(201).json(job);
//   } catch (err) {
//     console.error("Create job error:", err.message);
//     res.status(500).json({ message: "Failed to create job" });
//   }
// });

// /**
//  * GET ALL JOBS
//  * GET /api/job
//  */
// router.get("/", async (req, res) => {
//   try {
//     const jobs = await Job.find().sort({ createdAt: -1 });
//     res.json(jobs);
//   } catch (err) {
//     console.error("Fetch jobs error:", err.message);
//     res.status(500).json({ message: "Failed to fetch jobs" });
//   }
// });

// /**
//  * GET SINGLE JOB
//  * GET /api/job/:id
//  */
// router.get("/:id", async (req, res) => {
//   try {
//     const job = await Job.findById(req.params.id);

//     if (!job) {
//       return res.status(404).json({ message: "Job not found" });
//     }

//     res.json(job);
//   } catch (err) {
//     console.error("Fetch job error:", err.message);
//     res.status(500).json({ message: "Failed to fetch job" });
//   }
// });

// /**
//  * UPDATE JOB
//  * PUT /api/job/:id
//  */
// router.put("/:id", async (req, res) => {
//   try {
//     const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });

//     if (!job) {
//       return res.status(404).json({ message: "Job not found" });
//     }

//     res.json(job);
//   } catch (err) {
//     console.error("Update job error:", err.message);
//     res.status(500).json({ message: "Failed to update job" });
//   }
// });

// /**
//  * DELETE JOB
//  * DELETE /api/job/:id
//  */
// router.delete("/:id", async (req, res) => {
//   try {
//     const job = await Job.findByIdAndDelete(req.params.id);

//     if (!job) {
//       return res.status(404).json({ message: "Job not found" });
//     }

//     res.json({ message: "Job deleted successfully" });
//   } catch (err) {
//     console.error("Delete job error:", err.message);
//     res.status(500).json({ message: "Failed to delete job" });
//   }
// });

// export default router;
import { Router } from "express";
import {
  getAllJobs,
  getSingleJob,
  getJobInfo,
  updateJobInfo,
  deleteJob,
  addScreeningQuestion,
  removeScreeningQuestion,
} from "../controllers/job.controller.js";
import { getCandidatesByJob } from "../controllers/candidate.controller.js";

const router = Router();

// Homepage / Jobs page
router.get("/", getAllJobs);

// Job details page
router.get("/:jobId", getSingleJob);

// Job info for editing
router.get("/:jobId/info", getJobInfo);

// Update job info
router.put("/:jobId", updateJobInfo);

// Job → candidates list (NEW)
router.get("/:jobId/candidates", getCandidatesByJob);

// DELETE job
router.delete("/:jobId", deleteJob);

// Add screening question
router.post("/:jobId/question", addScreeningQuestion);

// DELETE screening question
router.delete("/:jobId/question/:index", removeScreeningQuestion);

export default router;
