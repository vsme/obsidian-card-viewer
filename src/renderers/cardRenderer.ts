import { App } from 'obsidian';
import { CardData, CardRenderer } from '../types';
import { cardParser } from '../parsers/cardParser';
import { createImagePathProcessor, ImagePathProcessor } from '../utils/imagePathProcessor';

export class CardRendererImpl implements CardRenderer {
  private imagePathProcessor: ImagePathProcessor;

  constructor(private app: App) {
    this.imagePathProcessor = createImagePathProcessor(app);
  }

  async renderCard(type: string, source: string, el: HTMLElement, ctx: any): Promise<void> {
    if (!el || typeof el.createEl !== "function") {
      return;
    }

    const card = cardParser.parseCard(type, source);
    if (!card) {
      el.createEl("div", { text: "Invalid card format" });
      return;
    }

    const cardEl = el.createEl("div", { cls: "card-viewer-card" });
    const cardContent = cardEl.createEl("div", { cls: "card-viewer-content" });
    const posterSection = cardContent.createEl("div", {
      cls: "card-viewer-poster-section",
    });
    const infoSection = cardContent.createEl("div", {
      cls: "card-viewer-info-section",
    });

    // 添加整个卡片的点击事件
    this.addCardClickHandler(cardEl, card);

    // 渲染卡片头部
    this.renderCardHeader(infoSection, card);

    // 渲染评分信息
    this.renderRating(infoSection, card);

    // 渲染详细信息
    this.renderDetails(infoSection, card);

    // 渲染海报
    this.renderPoster(posterSection, card);

    // 渲染其他信息
    this.renderAdditionalInfo(infoSection, card);
  }

  private addCardClickHandler(cardEl: HTMLElement, card: CardData): void {
    if (card.id || (card.type === "music" && card.url) || card.external_url) {
      cardEl.addClass("card-viewer-clickable");
      cardEl.addEventListener("click", (e) => {
        e.preventDefault();
        
        // 优先使用 external_url
        if (card.external_url) {
          window.open(card.external_url, "_blank");
          return;
        }
        
        if (card.type === "music" && card.url) {
          window.open(card.url, "_blank");
        } else if (card.id) {
          const baseUrl = this.getBaseUrl(card);
          window.open(`${baseUrl}${card.id}`, "_blank");
        }
      });
    }
  }

  private getBaseUrl(card: CardData): string {
    // 根据 source 和 type 确定跳转链接
    if (card.source === "douban") {
      if (card.type === "movie" || card.type === "tv") {
        return "https://movie.douban.com/subject/";
      } else if (card.type === "book") {
        return "https://book.douban.com/subject/";
      } else {
        return "https://movie.douban.com/subject/";
      }
    } else {
      // 默认使用 TMDB
      if (card.type === "tv") {
        return "https://www.themoviedb.org/tv/";
      } else if (card.type === "book") {
        return "https://book.douban.com/subject/";
      } else {
        return "https://www.themoviedb.org/movie/";
      }
    }
  }

  private renderCardHeader(infoSection: HTMLElement, card: CardData): void {
    const headerEl = infoSection.createEl("div", { cls: "card-viewer-header" });
    const titleEl = headerEl.createEl("h3", {
      text: card.title,
      cls: "card-viewer-title",
    });
    const headerRightEl = headerEl.createEl("div", {
      cls: "card-viewer-header-right",
    });
    headerRightEl.createEl("span", {
      text: card.type.toUpperCase(),
      cls: `card-viewer-type card-viewer-type-${card.type}`,
    });
  }

  private renderRating(infoSection: HTMLElement, card: CardData): void {
    if (card.rating) {
      const metaEl = infoSection.createEl("div", { cls: "card-viewer-meta" });
      const ratingEl = metaEl.createEl("div", {
        cls: "card-viewer-rating",
      });
      const starsContainer = ratingEl.createEl("div", {
        cls: "card-viewer-stars",
      });
      
      this.renderStars(starsContainer, card.rating);
      
      ratingEl.createSpan({
        text: card.rating.toFixed(1),
        cls: "card-viewer-rating-text",
      });
    }
  }

  private renderStars(container: HTMLElement, rating: number): void {
    const starRating = rating / 2; // 转换为5星制
    for (let i = 0; i < 5; i++) {
      const isFull = i < Math.floor(starRating);
      const isHalf = i === Math.floor(starRating) && starRating % 1 >= 0.5;
      const starEl = container.createEl("span", {
        cls: `card-viewer-star ${isFull ? "full" : isHalf ? "half" : "empty"}`,
      });
      
      if (isHalf) {
        starEl.innerHTML = `<svg viewBox="0 0 20 20" fill="none"><defs><clipPath id="half-star-${i}"><rect x="0" y="0" width="10" height="20"/></clipPath></defs><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="#d1d5db"/><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="#fbbf24" clip-path="url(#half-star-${i})"/></svg>`;
      } else {
        starEl.innerHTML = `<svg viewBox="0 0 20 20" fill="none"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
      }
    }
  }

  private renderDetails(infoSection: HTMLElement, card: CardData): void {
    const detailsEl = infoSection.createEl("div", {
      cls: "card-viewer-details",
    });

    // 添加发行日期到详细信息中
    this.addDetail(detailsEl, "日期", card.release_date);

    if (card.type === "music") {
      this.addDetail(detailsEl, "作者", card.author);
      this.addDetail(detailsEl, "专辑", card.album);
      // 将秒钟转换为分钟:秒钟格式
      if (card.duration) {
        const minutes = Math.floor(card.duration / 60);
        const seconds = card.duration % 60;
        this.addDetail(detailsEl, "时长", `${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    } else if (card.type === "book") {
      this.addDetail(detailsEl, "作者", card.author);
    } else {
      this.addDetail(detailsEl, "地区", card.region);
      if (card.runtime) this.addDetail(detailsEl, "时长", `${card.runtime}分钟`);
    }
  }

  private renderPoster(posterSection: HTMLElement, card: CardData): void {
    if (card.poster) {
      const imageSrc = this.imagePathProcessor.processImagePath(card.poster);
      
      const posterContainer = posterSection.createEl("div", {
        cls: "card-viewer-poster-container",
      });
      const posterEl = posterContainer.createEl("img", {
        cls: "card-viewer-poster card-viewer-poster-image",
        attr: {
          src: imageSrc,
          alt: card.title || "海报图片",
        },
      });
      
      // 图片加载处理
      posterEl.onerror = () => {
        posterEl.addClass("card-viewer-poster-image hidden");
        const errorEl = posterContainer.createEl("div", {
          cls: "card-viewer-poster-error",
        });
        errorEl.createEl("div", {
          text: "📷",
          cls: "card-viewer-error-icon",
        });
        errorEl.createEl("div", {
          text: "图片加载失败",
          cls: "card-viewer-error-text",
        });
      };
      
      posterEl.onload = () => {
        posterEl.addClass("loaded");
      };
    } else {
      // 没有图片时显示占位符
      const placeholderEl = posterSection.createEl("div", {
        cls: "card-viewer-poster-placeholder",
        text: "暂无图片",
      });
    }
  }

  private renderAdditionalInfo(infoSection: HTMLElement, card: CardData): void {
    const detailsEl = infoSection.querySelector('.card-viewer-details') as HTMLElement;
    if (!detailsEl) return;

    // 其他详细信息
    this.addDetail(detailsEl, "类型", card.genres, "genres");
    
    // 简介（不显示标题）
    if (card.overview) {
      const overviewEl = detailsEl.createEl("div", {
        cls: "card-viewer-overview",
      });
      const overviewText = overviewEl.createEl("div", {
        text: card.overview,
        cls: "card-viewer-overview-text",
      });
    }
  }

  private addDetail(detailsEl: HTMLElement, label: string, value?: string | number, className: string = ""): void {
    if (value) {
      const detailEl = detailsEl.createEl("div", {
        cls: `card-viewer-detail ${className}`,
      });
      detailEl.createEl("span", {
        text: `${label}: `,
        cls: "card-viewer-label",
      });
      
      if (className === "genres") {
        // 为genres创建标签
        const genresContainer = detailEl.createEl("div", {
          cls: "card-viewer-genres-container",
        });
        const genres = value
          .toString()
          .split(",")
          .map(g => g.trim());
        genres.forEach(genre => {
          if (genre) {
            genresContainer.createEl("span", {
              text: genre,
              cls: "card-viewer-genre-tag",
            });
          }
        });
      } else {
        detailEl.createSpan({
          text: value.toString(),
          cls: "card-viewer-value",
        });
      }
    }
  }
}

export const createCardRenderer = (app: App): CardRenderer => {
  return new CardRendererImpl(app);
};