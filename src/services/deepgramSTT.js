import axios from "axios";
import { createClient } from "@deepgram/sdk";
import dotenv from "dotenv";
dotenv.config();

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  throw new Error("Twilio credentials missing");
}

export const transcribeRecording = async (recordingUrl) => {
  // 1️⃣ Download recording from Twilio WITH AUTH
  const audioResponse = await axios.get(`${recordingUrl}.wav`, {
    responseType: "arraybuffer",
    auth: {
      username: TWILIO_ACCOUNT_SID,
      password: TWILIO_AUTH_TOKEN,
    },
  });

  // 2️⃣ Send audio bytes to Deepgram
  const { result } = await deepgram.listen.prerecorded.transcribeFile(
    audioResponse.data,
    {
      model: "nova-2",
      language: "en",
      punctuate: true,
      smart_format: true,
    },
  );

  return result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
};
