import { CardData, CardParser } from '../types';

export class CardParserImpl implements CardParser {
  parseCard(type: string, content: string): CardData | null {
    const parseField = (field: string): string | undefined => {
      // 按行分割内容，然后逐行查找匹配的字段
      const lines = content.split("\n");
      for (const line of lines) {
        const match = line.match(new RegExp(`^${field}:\\s*(.*)$`));
        if (match) {
          const value = match[1].trim();
          return value.length > 0 ? value : undefined;
        }
      }
      return undefined;
    };

    const parseNumber = (field: string): number | undefined => {
      const value = parseField(field);
      return value ? parseFloat(value) : undefined;
    };

    const title = parseField("title");
    // 允许空的 title，只要有 type 就可以渲染卡片
    
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
      poster: parseField("poster"),
      author: parseField("author"),
      album: parseField("album"),
      duration: parseNumber("duration"),
      url: parseField("url"),
      source: parseField("source"),
      external_url: parseField("external_url"),
    };
  }
}

export const cardParser = new CardParserImpl();