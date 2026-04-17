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
    details.push(`发现 Schema.org 标记: ${types}`);

    // Bonus for AEO-relevant schemas
    const aeoRelevant = page.schemaTypes.filter((t) =>
      ["FAQPage", "Article", "HowTo", "QAPage"].includes(t)
    );
    if (aeoRelevant.length > 0) {
      score += 40;
      details.push(`包含 AEO 相关 Schema: ${aeoRelevant.join(", ")}`);
    }
  } else {
    details.push("未发现 Schema.org 结构化数据标记");
  }

  return {
    name: "结构化数据",
    weight: 20,
    score: Math.min(100, score),
    status: statusFromScore(score),
    details: details.join("。"),
    recommendation: page.hasSchema
      ? null
      : "添加 Schema.org 标记，推荐 FAQPage 或 Article Schema，可使用 Google 结构化数据测试工具验证",
  };
}

function analyzeQaFormat(page: ParsedPage): DimensionResult {
  const qaPairs = page.questionHeadings.length;
  let score = 0;

  if (qaPairs === 0) {
    return {
      name: "问答格式",
      weight: 15,
      score: 0,
      status: "error",
      details: "未检测到 Q&A 结构",
      recommendation:
        '添加问答式内容：使用疑问句作为小标题（如"什么是XX？"），并在下方给出直接回答',
    };
  }

  // Each Q&A pair adds ~20 points, up to 100
  score = Math.min(100, qaPairs * 20);

  return {
    name: "问答格式",
    weight: 15,
    score,
    status: statusFromScore(score),
    details: `检测到 ${qaPairs} 个问答式标题`,
    recommendation:
      qaPairs < 3
        ? "建议至少添加 3-5 个问答式标题，覆盖用户常见问题"
        : null,
  };
}

function analyzeAnswerConciseness(page: ParsedPage): DimensionResult {
  // Look for paragraphs that are 40-60 characters (Chinese) or words (English)
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
      name: "答案简洁度",
      weight: 15,
      score: 0,
      status: "error",
      details: "页面缺乏段落内容",
      recommendation: "添加包含直接答案的段落，每段 40-200 字，简洁明确",
    };
  }

  let score = 0;
  if (idealCount > 0) score += 60;
  if (idealCount >= 3) score += 40;

  return {
    name: "答案简洁度",
    weight: 15,
    score,
    status: statusFromScore(score),
    details: `${idealCount} 个简洁段落，${tooLongCount} 个过长段落`,
    recommendation:
      idealCount === 0
        ? "将关键答案精简为 40-200 字的独立段落，放在对应标题下方"
        : "保持简洁回答风格，避免单段超过 200 字",
  };
}

function analyzeHeadings(page: ParsedPage): DimensionResult {
  let score = 0;
  const details: string[] = [];

  // H1 check
  const h1s = page.headings.filter((h) => h.level === 1);
  if (h1s.length === 0) {
    details.push("缺少 H1 标题");
  } else if (h1s.length === 1) {
    score += 30;
    details.push(`H1: ${h1s[0].text}`);
  } else {
    score += 10;
    details.push(`多个 H1 标题 (${h1s.length}个)，建议只保留一个`);
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
    details.push("标题层级清晰");
  } else if (levels.length > 0) {
    score += 10;
    details.push("标题层级存在跳跃");
  }

  // Question words in headings
  if (page.questionHeadings.length > 0) {
    score += 40;
    details.push(
      `${page.questionHeadings.length} 个标题包含疑问词或问号`
    );
  }

  return {
    name: "标题层级",
    weight: 10,
    score,
    status: statusFromScore(score),
    details: details.join("。"),
    recommendation:
      h1s.length === 0
        ? "添加唯一的 H1 标题，清晰描述页面主题"
        : hasGaps
          ? "完善标题层级：H1 → H2 → H3，避免跳过层级"
          : page.questionHeadings.length === 0
            ? "在标题中使用疑问词（如何、什么、为什么）提升 AEO 友好度"
            : null,
  };
}

function analyzeSemanticRichness(page: ParsedPage): DimensionResult {
  let score = 0;
  const features: string[] = [];

  if (page.lists.length > 0) {
    score += 25;
    features.push(`${page.lists.length} 个列表`);
  }
  if (page.tables > 0) {
    score += 30;
    features.push(`${page.tables} 个表格`);
  }
  if (page.images > 0) {
    score += 10;
    features.push(`${page.images} 张图片`);
  }
  // Definition-like patterns (e.g., "XX是..." or "XX refers to...")
  const defPattern = page.paragraphs.some(
    (p) => /^.{1,30}(是|指|称为|refers to|is defined as|means)/.test(p)
  );
  if (defPattern) {
    score += 20;
    features.push("包含定义性内容");
  }
  if (page.paragraphs.length >= 3) {
    score += 15;
    features.push(`${page.paragraphs.length} 个段落`);
  }

  return {
    name: "语义丰富度",
    weight: 10,
    score: Math.min(100, score),
    status: statusFromScore(score),
    details: features.length > 0 ? features.join("，") : "页面结构较单一",
    recommendation:
      features.length < 2
        ? "添加列表、表格、定义等结构化内容，AI 更容易提取这些格式的信息"
        : null,
  };
}

function analyzeAuthority(page: ParsedPage): DimensionResult {
  let score = 0;
  const signals: string[] = [];

  if (page.author) {
    score += 35;
    signals.push(`作者: ${page.author}`);
  } else {
    signals.push("无作者信息");
  }

  if (page.publishDate) {
    score += 30;
    signals.push(`发布日期: ${page.publishDate.substring(0, 10)}`);
  } else {
    signals.push("无发布日期");
  }

  if (page.references >= 2) {
    score += 20;
    signals.push(`${page.references} 个引用链接`);
  } else if (page.references === 1) {
    score += 10;
    signals.push("仅有 1 个引用链接");
  } else {
    signals.push("无引用来源");
  }

  if (page.canonicalUrl) {
    score += 15;
    signals.push("有 canonical URL");
  }

  return {
    name: "权威信号",
    weight: 10,
    score,
    status: statusFromScore(score),
    details: signals.join("。"),
    recommendation: [
      !page.author && "添加作者信息（meta author 或 schema）",
      !page.publishDate && "添加发布日期",
      page.references < 2 && "添加引用来源链接提升可信度",
    ]
      .filter(Boolean)
      .join("；") || null,
  };
}

function analyzeReadability(page: ParsedPage): DimensionResult {
  if (!page.bodyText || page.bodyText.length < 50) {
    return {
      name: "可读性",
      weight: 10,
      score: 50,
      status: "warning",
      details: "页面内容不足，无法准确计算可读性",
      recommendation: "增加更多文字内容（至少 200 字）以便分析",
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
    name: "可读性",
    weight: 10,
    score,
    status: statusFromScore(score),
    details: `Flesch 可读性评分: ${flesch} (${interpretation.label})`,
    recommendation:
      flesch < 60
        ? "简化语言：使用短句、常见词汇，目标 Flesch 分数 60-80"
        : flesch > 80
          ? "内容非常简单，可适当增加深度"
          : null,
  };
}

function analyzeMobile(page: ParsedPage): DimensionResult {
  let score = 0;
  const details: string[] = [];

  if (page.hasViewport) {
    score += 60;
    details.push("有 viewport meta 标签");
  } else {
    details.push("缺少 viewport meta 标签");
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
      details.push("检测到响应式 CSS 模式");
    }
  }

  if (page.hasLang) {
    score += 20;
    details.push(`语言声明: ${page.lang}`);
  } else {
    details.push("缺少 lang 属性");
  }

  return {
    name: "移动端适配",
    weight: 10,
    score,
    status: statusFromScore(score),
    details: details.join("。"),
    recommendation: [
      !page.hasViewport && "添加 <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
      !page.hasLang && "在 <html> 标签中添加 lang 属性",
    ]
      .filter(Boolean)
      .join("；") || null,
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

  // Detect potential SPA (very short body text but long HTML)
  const isSpa = page.bodyText.length < 100 && page.htmlLength > 10000;

  return {
    url,
    totalScore: finalScore,
    status: statusFromScore(finalScore),
    isSpa,
    spaNote: isSpa
      ? "该页面可能需要 JavaScript 渲染，检测基于静态 HTML。建议手动检查动态内容。"
      : null,
    fetchTime: new Date().toISOString(),
    dimensions,
  };
}
