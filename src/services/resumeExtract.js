// import axios from "axios";

// const matchResume = async (resumeText) => {
//   const response = await axios.post(
//     "https://api.openai.com/v1/chat/completions",
//     {
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content:
//             "Extract name, email, skills and give match score out of 100. Respond ONLY in JSON.",
//         },
//         { role: "user", content: resumeText },
//       ],
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${process.env.OPENAI_KEY}`,
//       },
//     }
//   );

//   return JSON.parse(response.data.choices[0].message.content);
// };

// export default matchResume;
import axios from "axios";

const extractResume = async (resumeText) => {
  const response = await axios.post(
    "https://api.mistral.ai/v1/chat/completions",
    {
      model: "mistral-large-latest", // or mistral-small for cheaper extraction
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are a resume parser.

Extract the following fields and return ONLY valid JSON.
No markdown. No explanation.

Schema:
{ 
  "name": "",
  "email": "",
  "phone": "",
  "experience": Number,
  "skills": [],
  "score": Number,
}

Rules:
- match_score must be an integer between 0 and 100
- If a field is missing, use "" or []
- calculate experience in years as a number , add up multiple jobs given in the resume
`,
        },
        {
          role: "user",
          content: resumeText,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    },
  );

  // const content = response.data.choices[0].message.content;

  // try {
  //   console.log(content);

  //   return JSON.parse(content);
  // } catch (err) {
  //   throw new Error("Mistral returned invalid JSON");
  //   // console.log(content);
  // }
  const raw = response.data.choices[0].message.content;

  console.log("RAW AI OUTPUT:\n", raw);

  let content = raw.trim();

  // Remove markdown code fences if present
  if (content.startsWith("```")) {
    content = content.replace(/```json|```/g, "").trim();
  }

  // Now parse
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.error("FINAL STRING TO PARSE:\n", content);
    throw new Error("Invalid JSON from Mistral");
  }

  return parsed;
};

export default extractResume;
