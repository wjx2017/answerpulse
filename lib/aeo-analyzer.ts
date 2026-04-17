import { ParsedPage } from "./cheerio-parser";
import { calcFleschReadingEase, interpretFlesch } from "./readability";

export interface DimensionResult {
  name: string;
  weight: number;
  score: number; // 0-100
  status: "good" | "warning" | "error";
  details: string;
  recommendation: string | null;
}

export interface AeoReport {
  url: string;
  totalScore: number;
  status: "good" | "warning" | "error";
  isSpa: boolean;
  spaNote: string | null;
  fetchTime: string;
  dimensions: DimensionResult[];
}

function statusFromScore(score: number): "good" | "warning" | "error" {
  if (score >= 70) return "good";
  if (score >= 40) return "warning";
  return "error";
}

function analyzeStructuredData(page: ParsedPage): DimensionResult {
  let score = 0;
  const details: string[] = [];

  if (page.hasSchema) {
    const types = page.schemaTypes.join(", ");
    score += 60;
    details.push(`Found Schema.org markup: ${types}`);

    // Bonus for AEO-relevant schemas
    const aeoRelevant = page.schemaTypes.filter((t) =>
      ["FAQPage", "Article", "HowTo", "QAPage"].includes(t)
    );
    if (aeoRelevant.length > 0) {
      score += 40;
      details.push(`AEO-relevant Schema detected: ${aeoRelevant.join(", ")}`);
    }
  } else {
    details.push("No Schema.org structured data markup found");
  }

  return {
    name: "Structured Data",
    weight: 20,
    score: Math.min(100, score),
    status: statusFromScore(score),
    details: details.join(". "),
    recommendation: page.hasSchema
      ? null
      : "Add Schema.org markup. Recommended: FAQPage or Article Schema. Verify with Google Structured Data Testing Tool.",
  };
}

function analyzeQaFormat(page: ParsedPage): DimensionResult {
  const qaPairs = page.questionHeadings.length;
  let score = 0;

  if (qaPairs === 0) {
    return {
      name: "Q&A Format",
      weight: 15,
      score: 0,
      status: "error",
      details: "No Q&A structure detected",
      recommendation:
        'Add Q&A-style content: use interrogative sentences as subheadings (e.g., "What is XX?") and provide direct answers below.',
    };
  }

  // Each Q&A pair adds ~20 points, up to 100
  score = Math.min(100, qaPairs * 20);

  return {
    name: "Q&A Format",
    weight: 15,
    score,
    status: statusFromScore(score),
    details: `Detected ${qaPairs} Q&A-style headings`,
    recommendation:
      qaPairs < 3
        ? "Consider adding at least 3-5 Q&A-style headings to cover common user questions."
        : null,
  };
}

function analyzeAnswerConciseness(page: ParsedPage): DimensionResult {
  // Look for paragraphs that are 40-200 characters — concise, direct answers
  let idealCount = 0;
  let tooLongCount = 0;
  let tooShortCount = 0;

  for (const p of page.paragraphs) {
    const len = p.length;
    if (len >= 40 && len <= 200) {
      idealCount++;
    } else if (len > 200) {
      tooLongCount++;
    } else {
      tooShortCount++;
    }
  }

  if (idealCount === 0 && tooShortCount === 0 && tooLongCount === 0) {
    return {
      name: "Answer Conciseness",
      weight: 15,
      score: 0,
      status: "error",
      details: "Page lacks paragraph content",
      recommendation: "Add paragraphs with direct answers, each 40-200 characters, concise and clear.",
    };
  }

  let score = 0;
  if (idealCount > 0) score += 60;
  if (idealCount >= 3) score += 40;

  return {
    name: "Answer Conciseness",
    weight: 15,
    score,
    status: statusFromScore(score),
    details: `${idealCount} concise paragraph(s), ${tooLongCount} overly long paragraph(s)`,
    recommendation:
      idealCount === 0
        ? "Distill key answers into standalone paragraphs of 40-200 characters, placed under relevant headings."
        : "Keep answers concise; avoid single paragraphs exceeding 200 characters.",
  };
}

function analyzeHeadings(page: ParsedPage): DimensionResult {
  let score = 0;
  const details: string[] = [];

  // H1 check
  const h1s = page.headings.filter((h) => h.level === 1);
  if (h1s.length === 0) {
    details.push("Missing H1 heading");
  } else if (h1s.length === 1) {
    score += 30;
    details.push(`H1: ${h1s[0].text}`);
  } else {
    score += 10;
    details.push(`Multiple H1 headings (${h1s.length}), recommend keeping only one`);
  }

  // Hierarchy
  const levels = page.headings.map((h) => h.level);
  let hasGaps = false;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      hasGaps = true;
      break;
    }
  }
  if (!hasGaps && levels.length > 0) {
    score += 30;
    details.push("Heading hierarchy is clear");
  } else if (levels.length > 0) {
    score += 10;
    details.push("Heading hierarchy has gaps");
  }

  // Question words in headings
  if (page.questionHeadings.length > 0) {
    score += 40;
    details.push(
      `${page.questionHeadings.length} heading(s) contain question words or question marks`
    );
  }

  return {
    name: "Heading Structure",
    weight: 10,
    score,
    status: statusFromScore(score),
    details: details.join(". "),
    recommendation:
      h1s.length === 0
        ? "Add a single H1 heading that clearly describes the page topic."
        : hasGaps
          ? "Fix heading hierarchy: H1 → H2 → H3, avoid skipping levels."
          : page.questionHeadings.length === 0
            ? "Use question words in headings (how, what, why) to improve AEO friendliness."
            : null,
  };
}

function analyzeSemanticRichness(page: ParsedPage): DimensionResult {
  let score = 0;
  const features: string[] = [];

  if (page.lists.length > 0) {
    score += 25;
    features.push(`${page.lists.length} list(s)`);
  }
  if (page.tables > 0) {
    score += 30;
    features.push(`${page.tables} table(s)`);
  }
  if (page.images > 0) {
    score += 10;
    features.push(`${page.images} image(s)`);
  }
  // Definition-like patterns (e.g., "XX is..." or "XX refers to...")
  const defPattern = page.paragraphs.some(
    (p) => /^.{1,30}(是|指|称为|refers to|is defined as|means|is a|are)/.test(p)
  );
  if (defPattern) {
    score += 20;
    features.push("Contains definitional content");
  }
  if (page.paragraphs.length >= 3) {
    score += 15;
    features.push(`${page.paragraphs.length} paragraph(s)`);
  }

  return {
    name: "Semantic Richness",
    weight: 10,
    score: Math.min(100, score),
    status: statusFromScore(score),
    details: features.length > 0 ? features.join(", ") : "Page structure is relatively uniform",
    recommendation:
      features.length < 2
        ? "Add structured content like lists, tables, and definitions — AI finds these formats easier to extract."
        : null,
  };
}

function analyzeAuthority(page: ParsedPage): DimensionResult {
  let score = 0;
  const signals: string[] = [];

  if (page.author) {
    score += 35;
    signals.push(`Author: ${page.author}`);
  } else {
    signals.push("No author information");
  }

  if (page.publishDate) {
    score += 30;
    signals.push(`Published: ${page.publishDate.substring(0, 10)}`);
  } else {
    signals.push("No publish date");
  }

  if (page.references >= 2) {
    score += 20;
    signals.push(`${page.references} reference link(s)`);
  } else if (page.references === 1) {
    score += 10;
    signals.push("Only 1 reference link");
  } else {
    signals.push("No reference sources");
  }

  if (page.canonicalUrl) {
    score += 15;
    signals.push("Has canonical URL");
  }

  return {
    name: "Authority Signals",
    weight: 10,
    score,
    status: statusFromScore(score),
    details: signals.join(". "),
    recommendation: [
      !page.author && "Add author information (meta author or schema)",
      !page.publishDate && "Add a publish date",
      page.references < 2 && "Add reference source links to boost credibility",
    ]
      .filter(Boolean)
      .join("; ") || null,
  };
}

function analyzeReadability(page: ParsedPage): DimensionResult {
  if (!page.bodyText || page.bodyText.length < 50) {
    return {
      name: "Readability",
      weight: 10,
      score: 50,
      status: "warning",
      details: "Insufficient page content to accurately calculate readability",
      recommendation: "Add more text content (at least 200 words) for analysis.",
    };
  }

  const flesch = calcFleschReadingEase(page.bodyText);
  const interpretation = interpretFlesch(flesch);

  // Score based on proximity to ideal range (60-80)
  let score = 0;
  if (flesch >= 60 && flesch <= 80) {
    score = 100;
  } else if (flesch >= 50 && flesch < 60) {
    score = 70;
  } else if (flesch >= 30 && flesch < 50) {
    score = 40;
  } else if (flesch >= 80) {
    score = 80;
  } else {
    score = 20;
  }

  return {
    name: "Readability",
    weight: 10,
    score,
    status: statusFromScore(score),
    details: `Flesch Reading Ease: ${flesch} (${interpretation.label})`,
    recommendation:
      flesch < 60
        ? "Simplify language: use shorter sentences and common words. Target Flesch score 60-80."
        : flesch > 80
          ? "Content is very simple; consider adding more depth."
          : null,
  };
}

function analyzeMobile(page: ParsedPage): DimensionResult {
  let score = 0;
  const details: string[] = [];

  if (page.hasViewport) {
    score += 60;
    details.push("Has viewport meta tag");
  } else {
    details.push("Missing viewport meta tag");
  }

  // Check for responsive indicators in HTML
  if (page.htmlLength > 0) {
    const html = page.bodyText; // We already have body text
    // Check for common responsive CSS patterns in the raw HTML (simplified)
    if (
      /max-width|media query|responsive|flexbox|grid/i.test(
        page.bodyText.substring(0, 5000)
      )
    ) {
      score += 20;
      details.push("Detected responsive CSS patterns");
    }
  }

  if (page.hasLang) {
    score += 20;
    details.push(`Language declaration: ${page.lang}`);
  } else {
    details.push("Missing lang attribute");
  }

  return {
    name: "Mobile Readiness",
    weight: 10,
    score,
    status: statusFromScore(score),
    details: details.join(". "),
    recommendation: [
      !page.hasViewport && 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
      !page.hasLang && 'Add a lang attribute to the <html> tag',
    ]
      .filter(Boolean)
      .join("; ") || null,
  };
}

export function analyzeAeo(page: ParsedPage, url: string): AeoReport {
  const dimensions: DimensionResult[] = [
    analyzeStructuredData(page),
    analyzeQaFormat(page),
    analyzeAnswerConciseness(page),
    analyzeHeadings(page),
    analyzeSemanticRichness(page),
    analyzeAuthority(page),
    analyzeReadability(page),
    analyzeMobile(page),
  ];

  // Calculate weighted total
  let totalScore = 0;
  let totalWeight = 0;
  for (const d of dimensions) {
    totalScore += (d.score / 100) * d.weight;
    totalWeight += d.weight;
  }
  const finalScore = Math.round((totalScore / totalWeight) * 100);

  // Enhanced SPA detection:
  // 1. Body text is very short (< 500 chars) despite large HTML
  // 2. Many script tags (>= 5) with little actual content
  // 3. SPA framework root markers present
  const isShortBody = page.bodyText.length < 500 && page.htmlLength > 5000;
  const isScriptHeavy = page.scriptCount >= 5 && page.bodyText.length < 1000;
  const hasFrameworkMarker = page.hasSpaRootMarker;
  const isSpa = isShortBody || isScriptHeavy || hasFrameworkMarker;

  return {
    url,
    totalScore: finalScore,
    status: statusFromScore(finalScore),
    isSpa,
    spaNote: isSpa
      ? "This page may require JavaScript rendering. Detection is based on static HTML. Manual review of dynamic content is recommended."
      : null,
    fetchTime: new Date().toISOString(),
    dimensions,
  };
}
