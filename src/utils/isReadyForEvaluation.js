export const isReadyForEvaluation = (candidate) => {
  if (!candidate.answers || !candidate.answers.length) return false;

  return candidate.answers.every(
    (a) => typeof a.answerText === "string" && a.answerText.trim().length > 0,
  );
};
