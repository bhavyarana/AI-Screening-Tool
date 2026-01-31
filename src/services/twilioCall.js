import client from "../config/twilio.js";
import Candidate from "../models/candidate.js";

const startScreeningCall = async (phone, candidateId) => {
  const call = await client.calls.create({
    to: phone,
    from: process.env.TWILIO_NUMBER,
    url: `${process.env.PUBLIC_BASE_URL}/twilio/voice?cid=${candidateId}&q=0`,
    statusCallback: `${process.env.PUBLIC_BASE_URL}/twilio/status`,
    statusCallbackEvent: ["completed"],
  });

  // Save callSid and reset transcripts
  await Candidate.findByIdAndUpdate(candidateId, {
    callSid: call.sid,
    transcripts: [],
    status: "in_progress",
  });

  return call.sid;
};

export default startScreeningCall;
