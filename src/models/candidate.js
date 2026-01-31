// import mongoose from "mongoose";

// const candidateSchema = new mongoose.Schema({
//   name: String,
//   email: String,
//   phone: String,
//   experience: Number,
//   skills: [String],
//   matchScore: Number,
//   status: String,
//  job: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Job",
//     required: true,
//   },

//   // callSid: String,
//   // transcript: {
//   //   type: String,
//   //   default: "",
//   // },
//   // evaluation: {
//   //   summary: String,
//   //   strengths: [String],
//   //   risks: [String],
//   //   communicationScore: Number,
//   //   technicalScore: Number,
//   //   hireRecommendation: String,
//   //   reasoning: String,
//   // },

// });

// export default mongoose.model("Candidate", candidateSchema);

import mongoose from "mongoose";

const transcriptSchema = new mongoose.Schema({
  questionIndex: Number,
  text: String,
});

const candidateSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  experience: Number,
  skills: [String],
  matchScore: Number,
  screeningStatus: String,
  callSid: String,

  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Requirement",
    required: true,
  },

  transcripts: [transcriptSchema],

  evaluation: Object,

  callStatus: {
    type: String,
    enum: ["pending", "in_progress", "completed"],
    default: "pending",
  },
});

export default mongoose.model("Candidate", candidateSchema);
