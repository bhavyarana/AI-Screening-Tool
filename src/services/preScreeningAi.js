import axios from "axios";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

export const generateHiringContent = async (requirement) => {
  const prompt = `
You are an HR expert.

Based on the following client requirement:
"${requirement}"

Generate:
1. A professional Job Description
2. 7-8 screening interview questions
3. A LinkedIn hiring post (friendly & engaging)

Respond ONLY in valid JSON:
{
  "jobRole": "",
  "skills": [],
  "experience": "",
  "jobDescription": "",
  "screeningQuestions": [],
  "linkedinPost": ""
}
  -give required skills as an array of strings in "Skills" and give only number in "experience" and "jobDescription", "linkedinPost", "jobRole" in single string. and "screeningQuestions" as an array of strings, and nothing else.
`;

  const response = await axios.post(
    MISTRAL_URL,
    {
      model: "mistral-large-latest",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    },
  );

  const rawText = response.data.choices[0].message.content;
  console.log("RAW AI TEXT:", rawText);

  // Clean markdown
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error("Invalid JSON returned by AI");
  }

  // Validate structure
  if (
    !parsed.jobDescription ||
    !Array.isArray(parsed.screeningQuestions) ||
    !parsed.linkedinPost
  ) {
    throw new Error("AI JSON structure invalid");
  }

  return parsed;
};
