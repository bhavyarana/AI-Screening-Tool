import axios from "axios";

const scoreResume = async (candidateJson, jobDescription) => {
  const response = await axios.post(
    "https://api.mistral.ai/v1/chat/completions",
    {
      model: "mistral-large-latest",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are an ATS scoring engine.

Compare a candidate profile with a job description.

Return ONLY a valid JSON object.
No markdown. No explanation. No extra text.

Schema:
{ "score": 0 }

Rules:
- score must be an integer between 0 and 100
- Base the score mainly on skill match and role relevance
`,
        },
        {
          role: "user",
          content: `
JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE (JSON):
${JSON.stringify(candidateJson, null, 2)}
`,
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

  // ---- Parse safely ----
  const raw = response.data.choices[0].message.content;
  let content = raw.trim();

  // Remove ```json fences if present
  if (content.startsWith("```")) {
    content = content.replace(/```json|```/g, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.error("SCORING AI OUTPUT:\n", raw);
    throw new Error("Invalid JSON from scoring AI");
  }

  // ---- Validate and return only number ----
  let score = Number(parsed.score);

  if (Number.isNaN(score)) {
    throw new Error("AI did not return a valid numeric score");
  }

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return score;
};

export default scoreResume;
