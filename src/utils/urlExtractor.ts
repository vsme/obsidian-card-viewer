/**
 * 提取各种 Markdown 和 Obsidian 格式链接中的 URL。
 * 支持的格式：
 * 1. [text](url) -> url
 * 2. ![alt](url) -> url
 * 3. [[url]] -> url
 * 4. [[url|text]] -> url
 * 5. ![[url]] -> url
 * 6. ![[url|alt]] -> url
 * 如果都不匹配，返回原字符串。
 */
export function extractUrlFromMarkdown(text: string): string {
  if (!text) return text;
  text = text.trim();

  // 匹配 Obsidian 嵌入链接格式: ![[url]] 或 ![[url|alt]]
  const obsidianEmbedMatch = text.match(/^!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/);
  if (obsidianEmbedMatch) {
    return obsidianEmbedMatch[1].trim();
  }

  // 匹配 Obsidian wiki 链接格式: [[url]] 或 [[url|text]]
  const obsidianLinkMatch = text.match(/^\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/);
  if (obsidianLinkMatch) {
    return obsidianLinkMatch[1].trim();
  }

  // 匹配 Markdown 图片格式: ![alt](url)
  const mdImageMatch = text.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
  if (mdImageMatch) {
    let urlPart = mdImageMatch[1].trim();
    // 移除可能包含的 title 属性，例如: url "title"
    urlPart = urlPart.replace(/\s+["'].*["']\s*$/, "");
    return urlPart.trim();
  }

  // 匹配 Markdown 链接格式: [text](url)
  const mdLinkMatch = text.match(/^\[[^\]]*\]\(([^)]+)\)$/);
  if (mdLinkMatch) {
    let urlPart = mdLinkMatch[1].trim();
    // 移除可能包含的 title 属性，例如: url "title"
    urlPart = urlPart.replace(/\s+["'].*["']\s*$/, "");
    return urlPart.trim();
  }

  // 返回原字符串（如果是普通 URL）
  return text;
}
