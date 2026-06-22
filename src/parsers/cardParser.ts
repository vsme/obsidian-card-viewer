import { CardData, CardParser } from '../types';
import { extractUrlFromMarkdown } from '../utils/urlExtractor';

export class CardParserImpl implements CardParser {
  parseCard(type: string, content: string): CardData | null {
    const lines = content.split("\n");

    const parseField = (field: string): string | undefined => {
      // 逐行查找匹配的字段
      for (const line of lines) {
        const match = line.match(new RegExp(`^${field}:\\s*(.*)$`));
        if (match) {
          const value = match[1].trim();
          return value.length > 0 ? value : undefined;
        }
      }
      return undefined;
    };

    const parseUrlField = (field: string): string | undefined => {
      const value = parseField(field);
      return value ? extractUrlFromMarkdown(value) : undefined;
    };

    const parseNumber = (field: string): number | undefined => {
      const value = parseField(field);
      return value ? parseFloat(value) : undefined;
    };

    // 检查是否有直接包含的图片格式作为海报
    const findImplicitPoster = (): string | undefined => {
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.match(/^!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/) || 
            trimmed.match(/^!\[[^\]]*\]\(([^)]+)\)$/)) {
          return extractUrlFromMarkdown(trimmed);
        }
      }
      return undefined;
    };

    const title = parseField("title");
    
    // 通用卡片对象，包含所有可能的字段
    return {
      type: type || "unknown",
      title: title || "未命名", // 为空 title 提供默认值
      id: parseField("id") || parseNumber("id"),
      release_date: parseField("release_date"),
      region: parseField("region"),
      rating: parseNumber("rating"),
      runtime: parseNumber("runtime"),
      genres: parseField("genres"),
      overview: parseField("overview"),
      poster: parseUrlField("poster") || findImplicitPoster(),
      author: parseField("author"),
      album: parseField("album"),
      duration: parseNumber("duration"),
      url: parseUrlField("url"),
      source: parseField("source"),
      external_url: parseUrlField("external_url"),
    };
  }
}

export const cardParser = new CardParserImpl();