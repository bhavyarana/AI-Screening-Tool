import Candidate from "../models/candidate.js";
import evaluateTranscript from "../services/aiEvaluation.js";
import startScreeningCall from "../services/twilioCall.js";
const BASE_URL = process.env.PUBLIC_BASE_URL;

/* =========================
   Helpers (CRITICAL)
========================= */

function sendTwiML(res, xml) {
  res.type("text/xml");
  res.send(xml);
}

const sendTwiMLError = (res, message) => {
  sendTwiML(res, `<Say voice="alice">${message}</Say><Hangup/>`);
};

const sanitizeForTwilio = (text = "") =>
  text
    .replace(/[^\x00-\x7F]/g, "") // remove smart quotes & unicode
    .replace(/[*_`]/g, "") // remove markdown
    .replace(/\s+/g, " ") // normalize spaces
    .trim();

/* =========================
   Initiate Call
========================= */

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
   Twilio Voice Webhook
========================= */

export const handleVoice = async (req, res) => {
  try {
    const index = Number(req.query.q || 0);
    const candidateId = req.query.cid;
    const BASE_URL = process.env.PUBLIC_BASE_URL;

    const candidate = await Candidate.findById(candidateId).populate(
      "job",
      "screeningQuestions",
    );

    if (!candidate || !candidate.job) {
      return sendTwiML(
        res,
        `
        <Response>
          <Say voice="alice">Interview details not found.</Say>
          <Hangup/>
        </Response>
      `,
      );
    }

    const questions = candidate.job.screeningQuestions || [];

    if (index >= questions.length) {
      return sendTwiML(
        res,
        `
        <Response>
          <Say voice="alice">Thank you. The screening is complete.</Say>
          <Hangup/>
        </Response>
      `,
      );
    }

    const question = sanitizeForTwilio(questions[index]);

    const actionUrl = `${BASE_URL}/twilio/voice?q=${index + 1}&amp;cid=${candidateId}`;

    const recordingCallback = `${BASE_URL}/twilio/recording?q=${index}&amp;cid=${candidateId}`;

    return sendTwiML(
      res,
      `
<Response>
  <Say voice="alice">${question}</Say>
  <Pause length="1"/>
  <Record
    maxLength="5"
    timeout="2"
    playBeep="true"
    method="POST"
    action="${actionUrl}"
    recordingStatusCallback="${recordingCallback}"
    recordingStatusCallbackMethod="POST"
  />
</Response>
`,
    );
  } catch (err) {
    console.error("VOICE ERROR:", err);
    return sendTwiML(
      res,
      `
      <Response>
        <Say voice="alice">An internal error occurred.</Say>
        <Hangup/>
      </Response>
    `,
    );
  }
};

/* =========================
   Recording Callback
========================= */

export const handleRecording = async (req, res) => {
  try {
    const { CallSid } = req.body;
    const candidateId = req.query.cid;

    if (candidateId && CallSid) {
      await Candidate.findByIdAndUpdate(candidateId, {
        callSid: CallSid,
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("RECORDING ERROR:", err);
    res.sendStatus(200);
  }
};

/* =========================
   Transcription Callback
========================= */

export const handleTranscription = async (req, res) => {
  try {
    const text = req.body.TranscriptionText;
    const candidateId = req.query.cid;
    const questionIndex = Number(req.query.q);

    if (!text || !candidateId) return res.sendStatus(200);

    await Candidate.findByIdAndUpdate(candidateId, {
      $push: {
        transcripts: { questionIndex, text },
      },
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("TRANSCRIPTION ERROR:", err);
    res.sendStatus(200);
  }
};

/* =========================
   Call Completed
========================= */

export const handleStatus = async (req, res) => {
  try {
    const { CallSid, CallStatus } = req.body;
    if (CallStatus !== "completed") return res.sendStatus(200);

    const candidate = await Candidate.findOne({ callSid: CallSid }).populate(
      "job",
      "screeningQuestions",
    );

    if (!candidate || !candidate.transcripts?.length) {
      return res.sendStatus(200);
    }

    const questions = candidate.job.screeningQuestions || [];

    const transcript = candidate.transcripts
      .sort((a, b) => a.questionIndex - b.questionIndex)
      .map((t) => {
        const q = questions[t.questionIndex] || "Question";
        return `Q: ${q}\nA: ${t.text}`;
      })
      .join("\n\n");

    const evaluation = await evaluateTranscript(transcript);

    candidate.evaluation = evaluation;
    candidate.callStatus = "completed";
    await candidate.save();

    res.sendStatus(200);
  } catch (err) {
    console.error("STATUS ERROR:", err);
    res.sendStatus(200);
  }
};
