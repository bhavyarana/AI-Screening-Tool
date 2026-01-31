import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      unique: true,
      required: true,
    },
    clientRequirement: String,
    jobRole: String,
    skills: [String],
    experience: String,
    jobDescription: String,
    screeningQuestions: [String],
    linkedinPost: String,
    candidates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Candidate",
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Requirement", requirementSchema);
