import axios from "axios";

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

/* =========================
   Helpers
========================= */

// Remove markdown safely
const stripMarkdown = (text = "") => {
  if (typeof text !== "string") return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/#+\s?/g, "")
    .trim();
};

// Normalize AI output to strict backend shape
const normalizeHiringContent = (raw = {}) => {
  return {
    jobRole: stripMarkdown(raw.jobRole || ""),
    skills: Array.isArray(raw.skills)
      ? raw.skills.map((s) => stripMarkdown(String(s)))
      : [],
    experience: Number(raw.experience) || 0,
    jobDescription: stripMarkdown(raw.jobDescription || ""),
    screeningQuestions: Array.isArray(raw.screeningQuestions)
      ? raw.screeningQuestions.map(stripMarkdown)
      : [],
    linkedinPost:
      stripMarkdown(raw.linkedinPost) || stripMarkdown(raw.linkedInPost) || "",
  };
};

// Validate final structure (after normalization)
const validateHiringContent = (data) => {
  if (!data.jobRole) {
    throw new Error("AI output missing jobRole");
  }

  if (!Array.isArray(data.skills) || data.skills.length === 0) {
    throw new Error("AI output missing skills");
  }

  if (typeof data.experience !== "number" || data.experience <= 0) {
    throw new Error("AI output has invalid experience");
  }

  if (!data.jobDescription) {
    throw new Error("AI output missing jobDescription");
  }

  if (
    !Array.isArray(data.screeningQuestions) ||
    data.screeningQuestions.length < 5
  ) {
    throw new Error("AI output has insufficient screeningQuestions");
  }

  if (!data.linkedinPost) {
    throw new Error("AI output missing linkedinPost");
  }
};

/* =========================
   Main Function
========================= */

export const generateHiringContent = async (requirement) => {
  if (!requirement || typeof requirement !== "string") {
    throw new Error("Client requirement must be a string");
  }

  const prompt = `
You are an HR expert.

Based on the following client requirement:
"${requirement}"

Generate:
1. A professional structured Job Description. write important key points in bullet points. not just a summary.
2. 7-8 screening interview questions
3. A LinkedIn hiring post (friendly & engaging) with related hashtags at the end.

Respond ONLY in valid JSON with EXACT keys:
jobRole, skills, experience, jobDescription, screeningQuestions, linkedinPost

Rules:
- skills MUST be an array of strings
- experience MUST be a single NUMBER (no ranges, no text)
- screeningQuestions MUST be an array of strings (7–8 questions)
- jobRole, jobDescription, linkedinPost MUST be plain strings
- Do NOT use markdown
- Do NOT add explanations
- Do NOT add extra key
- check for spelling mistakes
Return ONLY valid JSON
{
  "jobRole": "",
  "skills": [],
  "experience": "",
  "jobDescription": "",
  "screeningQuestions": [],
  "linkedinPost": ""
}
`;

  const response = await axios.post(
    MISTRAL_URL,
    {
      model: "mistral-large-latest",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    },
  );

  const rawText = response?.data?.choices?.[0]?.message?.content;

  if (!rawText) {
    throw new Error("Empty response from AI");
  }

  console.log("RAW AI TEXT:", rawText);

  // Remove code fences if any
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("JSON PARSE FAILED:", cleaned);
    throw new Error("Invalid JSON returned by AI");
  }

  // Normalize first (CRITICAL)
  const normalized = normalizeHiringContent(parsed);

  // Validate normalized structure
  validateHiringContent(normalized);

  return normalized;
};
