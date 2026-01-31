import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: String,
    skills: [String],
    experience: Number,
  },
  { timestamps: true }
);
export default mongoose.model("Job", jobSchema);
