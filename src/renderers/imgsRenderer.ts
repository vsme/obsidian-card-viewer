import { App, MarkdownPostProcessorContext } from "obsidian";
import { ImageData, ImgsRenderer } from "../types";
import {
  createImagePathProcessor,
  ImagePathProcessor,
} from "../utils/imagePathProcessor";
import { ImageModal } from "../modals/ImageModal";

export class ImgsRendererImpl implements ImgsRenderer {
  private imagePathProcessor: ImagePathProcessor;

  constructor(private app: App) {
    this.imagePathProcessor = createImagePathProcessor(app);
  }

  async renderImgsGrid(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ): Promise<void> {
    try {
      // 添加标识
      const headerEl = el.appendChild(document.createElement("div"));
      headerEl.className = "card-viewer-imgs-header";
      const typeEl = headerEl.appendChild(document.createElement("span"));
      typeEl.textContent = "IMAGES";
      typeEl.className = "card-viewer-imgs-type";

      // 创建9宫格容器
      const gridEl = el.appendChild(document.createElement("div"));
      gridEl.className = "card-viewer-imgs-grid";

      // 解析图片信息
      const images = this.parseImages(source);

      if (images.length === 0) {
        this.renderEmptyPlaceholder(gridEl);
      } else {
        this.renderImages(gridEl, images);
      }
    } catch (error) {
      const errorEl = el.appendChild(document.createElement("div"));
      errorEl.textContent = `图片网格渲染失败: ${(error as Error).message}`;
    }
  }

  private parseImages(source: string): ImageData[] {
    const imageRegex = /!\[([^\]]*)\]\(([^\s\)]+)(?:\s+"([^"]+)")?\)/g;
    const images: ImageData[] = [];
    let match;

    while ((match = imageRegex.exec(source)) !== null) {
      images.push({
        alt: match[1] || "",
        src: match[2],
        title: match[3] || "",
      });
    }

    return images;
  }

  private renderEmptyPlaceholder(gridEl: HTMLElement): void {
    const placeholderEl = gridEl.appendChild(document.createElement("div"));
    placeholderEl.className = "card-viewer-imgs-placeholder";
    placeholderEl.textContent = "未找到图片";
  }

  private renderImages(gridEl: HTMLElement, images: ImageData[]): void {
    images.forEach((image, index) => {
      const imageItem = this.createImageItem(image, index);
      gridEl.appendChild(imageItem);
    });
  }

  private createImageItem(image: ImageData, index: number): HTMLElement {
    const imageItem = document.createElement("div");
    imageItem.className = "card-viewer-imgs-item";

    const imageSrc = this.processImageSrc(image.src);
    const imgEl = this.createImageElement(imageItem, imageSrc, image);

    // 如果有标题，添加标题显示
    if (image.title) {
      this.addImageTitle(imageItem, image.title);
    }

    // 图片加载错误处理
    this.setupErrorHandling(imgEl, imageItem);

    // 点击放大功能
    this.setupClickHandler(imgEl, imageSrc, image);

    return imageItem;
  }

  private processImageSrc(src: string): string {
    return this.imagePathProcessor.processImagePath(src);
  }

  private createImageElement(
    container: HTMLElement,
    src: string,
    image: ImageData
  ): HTMLElement {
    const imgEl = container.appendChild(document.createElement("img"));
    imgEl.className = "card-viewer-imgs-image";
    imgEl.src = src;
    imgEl.alt = image.alt;
    imgEl.loading = "lazy";
    return imgEl;
  }

  private addImageTitle(container: HTMLElement, title: string): void {
    const titleEl = container.appendChild(document.createElement("div"));
    titleEl.className = "card-viewer-imgs-title";
    titleEl.textContent = title;
  }

  private setupErrorHandling(imgEl: HTMLElement, container: HTMLElement): void {
    imgEl.onerror = () => {
      container.classList.add("error");
      const errorEl = container.appendChild(document.createElement("div"));
      errorEl.className = "card-viewer-imgs-error";
      errorEl.textContent = "图片加载失败";
    };
  }

  private setupClickHandler(
    imgEl: HTMLElement,
    src: string,
    image: ImageData
  ): void {
    imgEl.addEventListener("click", () => {
      this.showImageModal(src, image);
    });
  }

  private showImageModal(src: string, image: ImageData): void {
    const modal = new ImageModal(this.app, src, image);
    modal.open();
  }
}

export const createImgsRenderer = (app: App): ImgsRenderer => {
  return new ImgsRendererImpl(app);
};
