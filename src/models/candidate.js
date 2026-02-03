import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionIndex: {
      type: Number,
      required: true,
    },

    question: {
      type: String,
      required: true,
    },

    recordingSid: {
      type: String,
      required: true,
    },

    recordingUrl: {
      type: String,
      required: true,
    },

    /**
     * Transcribed text from Deepgram
     * Can be null if STT fails
     */
    answerText: {
      type: String,
      default: null,
    },

    /**
     * Recording duration in seconds
     */
    duration: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      index: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    experience: {
      type: Number,
      default: 0,
    },

    skills: {
      type: [String],
      default: [],
    },

    matchScore: {
      type: Number,
      default: 0,
    },

    screeningStatus: {
      type: String,
      enum: ["REJECT", "REVIEW", "AUTO_PASS"],
      default: "REVIEW",
    },

    callSid: {
      type: String,
      index: true,
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
      required: true,
      index: true,
    },

    callStatus: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
      index: true,
    },

    /**
     * One entry per question (Twilio creates multiple recordings)
     */
    answers: {
      type: [answerSchema],
      default: [],
    },

    /**
     * Final AI evaluation result
     * Stored as structured JSON from OpenAI
     */
    evaluation: {
      summary: String,
      strengths: [String],
      weaknesses: [String],
      communicationScore: Number,
      technicalScore: Number,
      hireRecommendation: {
        type: String,
        enum: ["YES", "NO", "MAYBE"],
      },
      reasoning: String,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

/**
 * Prevent duplicate answers for same question
 */
candidateSchema.index(
  { _id: 1, "answers.questionIndex": 1 },
  { unique: false },
);

export default mongoose.model("Candidate", candidateSchema);
