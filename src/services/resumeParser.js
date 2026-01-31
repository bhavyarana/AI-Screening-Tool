// import fs from "fs";
// import { createRequire } from "module";

// const require = createRequire(import.meta.url);
// const pdfParse = require("pdf-parse"); // ← now guaranteed to be a function

// const parseResume = async (filePath) => {
//   const buffer = fs.readFileSync(filePath);
//   const data = await pdfParse(buffer);
//   console.log(data.text)
//   return data.text;
// };

// export default parseResume;

import fs from "fs";
import { createRequire } from "module";

const requiree = createRequire(import.meta.url);
const pdfParse = requiree("pdf-parse");

const cleanText = (text) => {
  if (!text) return "";

  return (
    text
      // Remove non-printable / control characters
      .replace(/[\x00-\x1F\x7F]/g, " ")

      // Fix broken words split by newlines (e.g. "deve\nloper")
      .replace(/(\w)-\s*\n\s*(\w)/g, "$1$2")

      // Replace multiple newlines with a single newline
      .replace(/\n{2,}/g, "\n")

      // Replace multiple spaces/tabs with a single space
      .replace(/[ \t]{2,}/g, " ")

      // Normalize bullet characters
      .replace(/[•●▪■◆]/g, "-")

      // Keep only sane ASCII + common punctuation (optional but useful)
      .replace(/[^\x20-\x7E\n]/g, "")

      // Trim each line
      .split("\n")
      .map((line) => line.trim())
      .join("\n")

      // Final trim
      .trim()
  );
};

const parseResume = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  const cleanedText = cleanText(data.text);

  if (!cleanedText || cleanedText.length < 50) {
    throw new Error("Resume contains no readable text (likely scanned image)");
  }

  return cleanedText;
};

export default parseResume;
