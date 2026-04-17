import * as cheerio from "cheerio";

export interface ParsedPage {
  title: string;
  metaDescription: string;
  headings: { level: number; text: string }[];
  paragraphs: string[];
  lists: string[][];
  tables: number;
  images: number;
  links: number;
  hasViewport: boolean;
  hasSchema: boolean;
  schemaTypes: string[];
  author: string | null;
  publishDate: string | null;
  references: number;
  questionHeadings: string[];
  hasLang: boolean;
  lang: string;
  bodyText: string;
  htmlLength: number;
  hasFavicon: boolean;
  canonicalUrl: string | null;
  // SPA detection signals
  scriptCount: number;
  hasSpaRootMarker: boolean;
}

export function parseHtml(html: string): ParsedPage {
  const $ = cheerio.load(html);

  // Count script tags BEFORE removal (for SPA detection)
  const scriptCount = $("script").length;

  // Detect SPA framework root markers BEFORE removal
  const hasSpaRootMarker =
    $('#__next').length > 0 ||
    $('#root').length > 0 ||
    $('#app').length > 0 ||
    $('div[id^="__nuxt"]').length > 0 ||
    $('[data-reactroot]').length > 0;

  // Remove scripts and styles for text analysis
  $("script, style, noscript").remove();

  // Title
  const title = $("title").text().trim();

  // Meta description
  const metaDescription = $('meta[name="description"]').attr("content") || "";

  // Headings
  const headings: ParsedPage["headings"] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tag = ($(el).prop("tagName") || "").toLowerCase();
    const level = parseInt(tag[1], 10);
    const text = $(el).text().trim();
    if (text) headings.push({ level, text });
  });

  // Paragraphs
  const paragraphs: string[] = [];
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 20) paragraphs.push(text);
  });

  // Lists
  const lists: string[][] = [];
  $("ul, ol").each((_, el) => {
    const items: string[] = [];
    $(el).find("li").each((_, li) => {
      const text = $(li).text().trim();
      if (text) items.push(text);
    });
    if (items.length > 0) lists.push(items);
  });

  // Tables
  const tables = $("table").length;

  // Images
  const images = $("img").length;

  // Links
  const links = $("a[href]").length;

  // Viewport
  const hasViewport = $('meta[name="viewport"]').length > 0;

  // Schema.org
  const schemaTypes: string[] = [];
  $('[itemtype]').each((_, el) => {
    const type = $(el).attr("itemtype") || "";
    const match = type.match(/schema\.org\/(.+)/);
    if (match && !schemaTypes.includes(match[1])) {
      schemaTypes.push(match[1]);
    }
  });
  // Also check JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      const types = Array.isArray(data) ? data : [data];
      types.forEach((t: any) => {
        const tp = t["@type"] || "";
        if (tp && !schemaTypes.includes(tp)) schemaTypes.push(tp);
      });
    } catch {}
  });
  const hasSchema = schemaTypes.length > 0;

  // Author
  let author: string | null = null;
  $('meta[name="author"]').each((_, el) => {
    author = $(el).attr("content") || null;
  });
  if (!author) {
    author = $('[rel="author"]').text().trim() || null;
  }
  if (!author) {
    author = $('[itemprop="author"]').text().trim() || null;
  }

  // Publish date
  let publishDate: string | null = null;
  $('meta[property="article:published_time"]').each((_, el) => {
    publishDate = $(el).attr("content") || null;
  });
  if (!publishDate) {
    publishDate = $('time[datetime]').attr("datetime") || null;
  }
  if (!publishDate) {
    publishDate = $('[itemprop="datePublished"]').attr("content") || null;
  }

  // References (outbound links, citations)
  const references = $('a[href^="http"]').length;

  // Question headings
  const questionWords = ["what", "how", "why", "when", "where", "who", "which", "is", "are", "do", "does", "can", "should", "如何", "什么", "为什么", "怎么", "是否", "哪些", "怎样", "谁", "哪里", "何时"];
  const questionHeadings: string[] = [];
  headings.forEach((h) => {
    const lower = h.text.toLowerCase();
    if (/\?/.test(h.text)) {
      questionHeadings.push(h.text);
    } else {
      const words = lower.split(/\s+/);
      if (words.length <= 6 && questionWords.some((qw) => words[0] === qw || words.includes(qw))) {
        questionHeadings.push(h.text);
      }
    }
  });

  // Language
  const lang = $("html").attr("lang") || "";
  const hasLang = !!lang;

  // Body text (for readability)
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"]').length > 0;

  // Canonical
  const canonicalUrl = $('link[rel="canonical"]').attr("href") || null;

  return {
    title,
    metaDescription,
    headings,
    paragraphs,
    lists,
    tables,
    images,
    links,
    hasViewport,
    hasSchema,
    schemaTypes,
    author,
    publishDate,
    references,
    questionHeadings,
    hasLang,
    lang,
    bodyText,
    htmlLength: html.length,
    hasFavicon,
    canonicalUrl,
    scriptCount,
    hasSpaRootMarker,
  };
}
