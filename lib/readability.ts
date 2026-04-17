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
  if (score >= 80) return { label: "很容易", color: "green", desc: "六年级可理解，非常适合 AI 提取" };
  if (score >= 70) return { label: "容易", color: "green", desc: "适合广泛阅读" };
  if (score >= 60) return { label: "标准", color: "green", desc: "13-15 岁可理解，AEO 友好" };
  if (score >= 50) return { label: "一般", color: "yellow", desc: "稍微复杂，建议简化" };
  if (score >= 30) return { label: "困难", color: "orange", desc: "大学水平，需要简化" };
  return { label: "非常困难", color: "red", desc: "建议重写为更简洁的语言" };
}
