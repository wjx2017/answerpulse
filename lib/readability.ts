/**
 * Flesch Reading Ease calculator
 * Formula: 206.835 - 1.015 × (words/sentences) - 84.6 × (syllables/words)
 */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  // Remove silent e
  let text = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  // Count vowel groups
  const matches = text.match(/[aeiouy]{1,2}/g);
  const count = matches ? matches.length : 1;
  return Math.max(1, count);
}

export function calcFleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text
    .split(/\s+/)
    .filter((w) => /[a-zA-Z]/.test(w));
  const syllables = words.reduce(
    (sum, w) => sum + countSyllables(w),
    0
  );

  if (sentences.length === 0 || words.length === 0) return 0;

  const score =
    206.835 -
    1.015 * (words.length / sentences.length) -
    84.6 * (syllables / words.length);

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function interpretFlesch(score: number): {
  label: string;
  color: string;
  desc: string;
} {
  if (score >= 80) return { label: "Very Easy", color: "green", desc: "Understandable by 6th graders, ideal for AI extraction" };
  if (score >= 70) return { label: "Easy", color: "green", desc: "Suitable for general reading" };
  if (score >= 60) return { label: "Standard", color: "green", desc: "Understandable by ages 13-15, AEO-friendly" };
  if (score >= 50) return { label: "Fairly Difficult", color: "yellow", desc: "Somewhat complex, consider simplifying" };
  if (score >= 30) return { label: "Difficult", color: "orange", desc: "College level, needs simplification" };
  return { label: "Very Difficult", color: "red", desc: "Recommend rewriting in simpler language" };
}
