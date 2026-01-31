// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio"; // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
async function createCall() {
  const accountSid = process.env.TWILIO_SID;
  const authToken = process.env.TWILIO_AUTH;
  const client = twilio(accountSid, authToken);
  const demoQuestion =
    "Hello. This is an automated screening call. Please tell me about your web development experience.";
  const call = await client.calls.create({
    from: process.env.TWILIO_NUMBER,
    to: "+918287435370",
    twiml: `
    <Response>
      <Pause length="2"/>
      <Say voice="alice">
        Hello i am alex. 
        <Pause length="1"/>
        This is an automated screening call from agitss.
        Please tell me about your web development experience.
      </Say>
      <Pause length="2"/>
      <Say voice="alice">Thank you. Goodbye.</Say>
    </Response>
  `,
  });

  console.log(call.sid);
}

// createCall();
export default createCall;
