import Candidate from "../models/candidate.js";

export const getCandidatesByJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const candidates = await Candidate.find({ job: jobId })
      .select("name phone email screeningStatus callStatus")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      candidates,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
};

export const getCandidateById = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findById(candidateId).populate("job");

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.json({
      success: true,
      candidate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch candidate" });
  }
};

export const getCandidateTranscript = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate =
      await Candidate.findById(candidateId).select("answers name");

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const transcript = candidate.answers
      .sort((a, b) => a.questionIndex - b.questionIndex)
      .map((a, idx) => ({
        index: idx + 1,
        question: a.question,
        answer: a.answerText || "No response",
        duration: a.duration,
      }));

    res.json({
      candidateName: candidate.name,
      transcript,
    });
  } catch (err) {
    console.error("TRANSCRIPT FETCH ERROR:", err);
    res.status(500).json({ error: "Failed to fetch transcript" });
  }
};
