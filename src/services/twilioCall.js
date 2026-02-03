import twilio from "twilio";
import Candidate from "../models/candidate.js";

const startScreeningCall = async (phone, candidateId) => {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_NUMBER,
    PUBLIC_BASE_URL,
  } = process.env;

  if (
    !TWILIO_ACCOUNT_SID ||
    !TWILIO_AUTH_TOKEN ||
    !TWILIO_NUMBER ||
    !PUBLIC_BASE_URL
  ) {
    throw new Error("Twilio environment variables missing");
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  const call = await client.calls.create({
    to: phone,
    from: TWILIO_NUMBER,
    url: `${PUBLIC_BASE_URL}/twilio/voice?cid=${candidateId}&q=0`,
    statusCallback: `${PUBLIC_BASE_URL}/twilio/status`,
    statusCallbackEvent: ["completed"],
    method: "POST",
  });

  await Candidate.findByIdAndUpdate(candidateId, {
    callSid: call.sid,
    answers: [], // ✅ reset answers
    callStatus: "pending",
  });

  return call.sid;
};

export default startScreeningCall;
