export interface CardData {
  type: string;
  title: string;
  id?: string | number;
  release_date?: string;
  region?: string;
  rating?: number;
  runtime?: number;
  genres?: string;
  overview?: string;
  poster?: string;
  author?: string;
  album?: string;
  duration?: number;
  url?: string;
  source?: string;
  external_url?: string;
}

export interface ImageData {
  alt: string;
  src: string;
  title: string;
}

export interface RenderContext {
  el: HTMLElement;
  ctx: any;
}

export type CardType = 'movie' | 'tv' | 'book' | 'music';

export interface ErrorHandler {
  (error: Error, context?: string): void;
}

export interface CardParser {
  parseCard(type: string, content: string): CardData | null;
}

export interface CardRenderer {
  renderCard(type: string, source: string, el: HTMLElement, ctx: any): Promise<void>;
}

export interface ImgsRenderer {
  renderImgsGrid(source: string, el: HTMLElement, ctx: any): Promise<void>;
}