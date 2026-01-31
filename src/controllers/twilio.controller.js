import { questions } from "../data/questions.js";
import Candidate from "../models/candidate.js";
import evaluateTranscript from "../services/aiEvaluation.js";

// ==================== 1. ASK QUESTION ====================

export const handleVoice = async (req, res) => {
  const index = Number(req.query.q || 0);
  const candidateId = req.query.cid;

  // If all questions done → end call
  if (index >= questions.length) {
    const response = `
      <Response>
        <Say voice="alice">Thank you. The screening is complete.</Say>
        <Hangup/>
      </Response>
    `;
    res.type("text/xml");
    return res.send(response);
  }

  const response = `
    <Response>
      <Say voice="alice">${questions[index]}</Say>
      <Record 
        maxLength="30"
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

  const candidate = await Candidate.findOne({ callSid });

  if (!candidate || !candidate.transcripts?.length) {
    return res.sendStatus(200);
  }

  // Sort answers by question order
  const orderedAnswers = candidate.transcripts
    .sort((a, b) => a.questionIndex - b.questionIndex)
    .map((t, i) => {
      const q = questions[i] || `Question ${i + 1}`;
      return `Q${i + 1}: ${q}\nA${i + 1}: ${t.text}`;
    })
    .join("\n\n");

  try {
    const evaluation = await evaluateTranscript(orderedAnswers);

    candidate.evaluation = evaluation;
    candidate.status = "completed";
    await candidate.save();

    console.log("Screening completed for candidate:", candidate._id);
  } catch (err) {
    console.error("Evaluation failed:", err);
  }

  res.sendStatus(200);
};
