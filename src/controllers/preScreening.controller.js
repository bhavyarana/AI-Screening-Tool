import Requirement from "../models/requirement.js";
import { generateHiringContent } from "../services/preScreeningAi.js";

export const preScreener = async (req, res) => {
  try {
    const { clientRequirement } = req.body;

    if (!clientRequirement) {
      return res.status(400).json({ error: "Requirement is required" });
    }

    const aiResult = await generateHiringContent(clientRequirement);

    const generateJobId = () => "JOB-" + Date.now();

    const savedData = await Requirement.create({
      jobId: generateJobId(),
      clientRequirement,
      jobRole: aiResult.jobRole,
      skills: aiResult.skills,
      experience: aiResult.experience,
      jobDescription: aiResult.jobDescription,
      screeningQuestions: aiResult.screeningQuestions,
      linkedinPost: aiResult.linkedinPost,
    });

    res.json({
      success: true,
      jobId: savedData._id,
      data: savedData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI generation failed" });
  }
};
