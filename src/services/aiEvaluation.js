import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Build a clean transcript from answers[]
 */
function buildTranscript(answers = []) {
  return answers
    .sort((a, b) => a.questionIndex - b.questionIndex)
    .map((a, i) => {
      const answer = a.answerText?.trim() ? a.answerText.trim() : "No response";
      return `Q${i + 1}: ${a.question}\nA${i + 1}: ${answer}`;
    })
    .join("\n\n");
}

/**
 * Validate AI JSON strictly
 */
function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Main evaluation function
 * @param {Array} answers - candidate.answers[]
 */
export default async function evaluateTranscript(answers) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing");
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    throw new Error("No answers provided for evaluation");
  }

  const transcript = buildTranscript(answers);

  const prompt = `
You are a senior technical interviewer.

Evaluate the following phone screening transcript.

Return ONLY valid JSON in this exact structure:

{
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "communicationScore": 0,
  "technicalScore": 0,
  "hireRecommendation": "YES | NO | MAYBE",
  "reasoning": ""
}

Transcript:
"""
${transcript}
"""
`;

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Be strict and realistic." },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    const raw = res.data?.choices?.[0]?.message?.content;
    const parsed = safeParseJSON(raw);

    if (!parsed) {
      throw new Error("Invalid JSON returned by AI");
    }

    return parsed;
  } catch (err) {
    /**
     * HARD FAIL-SAFE
     * Never break the pipeline because AI failed
     */
    console.error("AI EVALUATION FAILED:", err.message);

    return {
      summary: "Evaluation failed due to AI service error.",
      strengths: [],
      weaknesses: ["Evaluation could not be completed"],
      communicationScore: 0,
      technicalScore: 0,
      hireRecommendation: "MAYBE",
      reasoning: "AI evaluation service was unavailable or rate-limited.",
    };
  }
}
