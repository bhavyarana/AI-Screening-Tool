import axios from "axios";

const evaluateTranscript = async (transcript) => {
  const prompt = `
You are an experienced technical recruiter.

Evaluate the following phone screening transcript.

Return ONLY valid JSON in this exact format:

{
  "summary": "",
  "strengths": [],
  "risks": [],
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

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a strict recruiter. No fluff." },
        { role: "user", content: prompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
      },
    }
  );

  return JSON.parse(response.data.choices[0].message.content);
};

export default evaluateTranscript;
