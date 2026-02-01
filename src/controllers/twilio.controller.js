// import { questions } from "../data/questions.js";
import Candidate from "../models/candidate.js";
import evaluateTranscript from "../services/aiEvaluation.js";
import startScreeningCall from "../services/twilioCall.js";

// ====================  Initiate Call ====================

export const initiateScreeningCall = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    if (!candidate.phone) {
      return res.status(400).json({ error: "Candidate phone missing" });
    }

    if (candidate.callStatus !== "pending") {
      return res
        .status(400)
        .json({ error: "Call already in progress or completed" });
    }

    // 🔔 THIS is the key line
    await startScreeningCall(candidate.phone, candidate._id);

    res.json({
      success: true,
      message: "Screening call initiated",
    });
  } catch (err) {
    console.error("CALL INIT ERROR:", err);
    res.status(500).json({ error: "Failed to initiate call" });
  }
};

// ==================== 1. ASK QUESTION ====================

export const handleVoice = async (req, res) => {
  const index = Number(req.query.q || 0);
  const candidateId = req.query.cid;

  // 1️⃣ Fetch candidate + job
  const candidate = await Candidate.findById(candidateId).populate(
    "job",
    "screeningQuestions",
  );

  if (!candidate || !candidate.job) {
    return res.sendStatus(404);
  }

  const questions = candidate.job.screeningQuestions || [];

  // 2️⃣ End call if questions finished
  if (index >= questions.length) {
    const response = `
      <Response>
        <Pause length="1"/>
        <Say voice="alice">Thank you. The screening is complete.</Say>
        <Hangup/>
      </Response>
    `;
    res.type("text/xml");
    return res.send(response);
  }

  // 3️⃣ Ask next question
  const response = `
    <Response>
      <Say voice="alice">${questions[index]}</Say>
      <Record 
        maxLength="30"
        timeOut="5"
        action="/twilio/voice?q=${index + 1}&cid=${candidateId}"
        recordingStatusCallback="/twilio/recording?q=${index}&cid=${candidateId}"
        transcribe="true"
        transcribeCallback="/twilio/transcription?q=${index}&cid=${candidateId}"
      />
    </Response>
  `;

  res.type("text/xml");
  res.send(response);
};

// ==================== 2. RECORDING FINISHED ====================

export const handleRecording = async (req, res) => {
  const recordingUrl = req.body.RecordingUrl;
  const callSid = req.body.CallSid;
  const candidateId = req.query.cid;
  const questionIndex = Number(req.query.q);

  console.log("Recording URL:", recordingUrl);

  // Ensure candidate has callSid stored
  await Candidate.findByIdAndUpdate(candidateId, {
    callSid,
  });

  res.sendStatus(200);
};

// ==================== 3. TRANSCRIPTION RECEIVED ====================

export const handleTranscription = async (req, res) => {
  const transcriptText = req.body.TranscriptionText;
  const callSid = req.body.CallSid;
  const candidateId = req.query.cid;
  const questionIndex = Number(req.query.q);

  if (!transcriptText) return res.sendStatus(200);

  await Candidate.findByIdAndUpdate(candidateId, {
    $push: {
      transcripts: {
        questionIndex,
        text: transcriptText,
      },
    },
  });

  res.sendStatus(200);
};

// ==================== 4. CALL STATUS CALLBACK ====================

export const handleStatus = async (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;

  if (callStatus !== "completed") {
    return res.sendStatus(200);
  }

  const candidate = await Candidate.findOne({ callSid }).populate(
    "job",
    "screeningQuestions",
  );

  if (!candidate || !candidate.transcripts?.length) {
    return res.sendStatus(200);
  }

  const questions = candidate.job.screeningQuestions || [];

  const orderedAnswers = candidate.transcripts
    .sort((a, b) => a.questionIndex - b.questionIndex)
    .map((t) => {
      const q = questions[t.questionIndex] || `Question ${t.questionIndex + 1}`;
      return `Q: ${q}\nA: ${t.text}`;
    })
    .join("\n\n");

  try {
    const evaluation = await evaluateTranscript(orderedAnswers);

    candidate.evaluation = evaluation;
    candidate.callStatus = "completed";
    await candidate.save();

    console.log("Screening completed for candidate:", candidate._id);
  } catch (err) {
    console.error("Evaluation failed:", err);
  }

  res.sendStatus(200);
};
