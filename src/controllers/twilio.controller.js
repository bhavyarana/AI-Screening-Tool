import Candidate from "../models/candidate.js";
import startScreeningCall from "../services/twilioCall.js";
import evaluateTranscript from "../services/aiEvaluation.js";
import { transcribeRecording } from "../services/deepgramSTT.js";
import { isReadyForEvaluation } from "../utils/isReadyForEvaluation.js";

const BASE_URL = process.env.PUBLIC_BASE_URL;

/* =========================
   Helpers
========================= */

const sendTwiML = (res, xml) => {
  res.type("text/xml").send(xml);
};

const sanitizeForTwilio = (text = "") =>
  text
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/* =========================
   Initiate Call
========================= */

export const initiateScreeningCall = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate || !candidate.phone) {
      return res.status(400).json({ error: "Invalid candidate" });
    }

    if (candidate.callStatus !== "pending") {
      return res
        .status(400)
        .json({ error: "Call already started or completed" });
    }

    await startScreeningCall(candidate.phone, candidate._id);
    res.json({ success: true });
  } catch (err) {
    console.error("CALL INIT ERROR:", err);
    res.status(500).json({ error: "Failed to initiate call" });
  }
};

/* =========================
   Voice Webhook
========================= */

export const handleVoice = async (req, res) => {
  try {
    const index = Number(req.query.q || 0);
    const candidateId = req.query.cid;

    const candidate = await Candidate.findById(candidateId).populate(
      "job",
      "screeningQuestions",
    );

    if (!candidate || !candidate.job) {
      return sendTwiML(
        res,
        `<Response><Say>Interview not found.</Say><Hangup/></Response>`,
      );
    }

    const questions = candidate.job.screeningQuestions || [];

    if (index >= questions.length) {
      return sendTwiML(
        res,
        `<Response><Say>Thank you. Screening complete.</Say><Hangup/></Response>`,
      );
    }

    const intro =
      index === 0
        ? `
<Say>Hello. This is a screening call from Agitss.</Say>
<Pause length="1"/>
<Say>Please answer each question within thirty seconds after the beep.</Say>
<Pause length="1"/>
`
        : "";

    const question = sanitizeForTwilio(questions[index]);

    sendTwiML(
      res,
      `
      <Response>
      ${intro}
  <Say>${question}</Say>
  <Pause length="1"/>
  <Record
    maxLength="5"
    speechTimeout="3"
    trimSilence="true"
    playBeep="true"
    action="${BASE_URL}/twilio/voice?q=${index + 1}&amp;cid=${candidateId}"
    recordingStatusCallback="${BASE_URL}/twilio/recording?q=${index}&amp;cid=${candidateId}"
    recordingStatusCallbackMethod="POST"
  />
</Response>
`,
    );
  } catch (err) {
    console.error("VOICE ERROR:", err);
    sendTwiML(res, `<Response><Say>Internal error.</Say><Hangup/></Response>`);
  }
};

/* =========================
   Recording Callback (Deepgram STT)
========================= */

export const handleRecording = async (req, res) => {
  try {
    const { RecordingSid, RecordingUrl, RecordingDuration, CallSid } = req.body;

    const candidateId = req.query.cid;
    const questionIndex = Number(req.query.q);

    if (!RecordingSid || !RecordingUrl || !candidateId) {
      return res.sendStatus(200);
    }

    // Fetch candidate with job questions
    const candidate = await Candidate.findById(candidateId).populate(
      "job",
      "screeningQuestions",
    );

    if (!candidate || !candidate.job) {
      return res.sendStatus(200);
    }

    const question = candidate.job.screeningQuestions[questionIndex];

    // 🔹 STEP 1: Transcribe using Deepgram
    let transcript = "";
    try {
      transcript = await transcribeRecording(RecordingUrl);
    } catch (err) {
      console.error("DEEPGRAM TRANSCRIPTION FAILED:", err.message);
    }

    // 🔹 STEP 2: Save answer
    await Candidate.findByIdAndUpdate(candidateId, {
      callSid: CallSid,
      $push: {
        answers: {
          questionIndex,
          question,
          recordingSid: RecordingSid,
          recordingUrl: RecordingUrl,
          duration: Number(RecordingDuration || 0),
          answerText: transcript || "",
        },
      },
    });

    // 🔹 STEP 3: Re-fetch updated candidate
    const updatedCandidate = await Candidate.findById(candidateId);

    // 🔹 STEP 4: Evaluate ONLY when all answers exist
    if (
      updatedCandidate.callStatus !== "completed" &&
      isReadyForEvaluation(updatedCandidate)
    ) {
      try {
        const evaluation = await evaluateTranscript(updatedCandidate.answers);

        updatedCandidate.evaluation = evaluation;
        updatedCandidate.callStatus = "completed";
        await updatedCandidate.save();

        console.log(
          "Evaluation completed after final recording for:",
          candidateId,
        );
      } catch (err) {
        console.error("EVALUATION ERROR:", err.message);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("RECORDING HANDLER ERROR:", err);
    res.sendStatus(200); // NEVER fail Twilio
  }
};

/* =========================
   Call Status (WAIT FOR ALL STT)
========================= */

export const handleStatus = async (req, res) => {
  if (req.body.CallStatus !== "completed") {
    return res.sendStatus(200);
  }

  const candidate = await Candidate.findOne({
    callSid: req.body.CallSid,
  });

  if (!candidate) {
    return res.sendStatus(200);
  }

  // ❌ DO NOT evaluate yet
  if (!isReadyForEvaluation(candidate)) {
    console.log("Call ended but transcripts still processing");
    return res.sendStatus(200);
  }

  // ✅ SAFE TO EVALUATE
  try {
    const evaluation = await evaluateTranscript(candidate.answers);

    candidate.evaluation = evaluation;
    candidate.callStatus = "completed";
    await candidate.save();

    console.log("Evaluation completed for:", candidate._id);
  } catch (err) {
    console.error("EVALUATION ERROR:", err.message);
  }

  res.sendStatus(200);
};
