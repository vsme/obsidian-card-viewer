import { App } from 'obsidian';
import { createImagePathProcessor, ImagePathProcessor } from '../utils/imagePathProcessor';

/**
 * HTML渲染器类，负责安全地渲染HTML内容
 */
export class HtmlRenderer {
    private imagePathProcessor: ImagePathProcessor;

    constructor(private app: App) {
        this.imagePathProcessor = createImagePathProcessor(app);
    }

    /**
     * 安全地渲染HTML内容到指定容器
     * @param contentEl 目标容器元素
     * @param source HTML源代码
     */
    async renderHtml(contentEl: HTMLElement, source: string): Promise<void> {
        try {
            // 清空容器
            contentEl.empty();
            
            // 添加HTML内容容器类
            contentEl.addClass('html-viewer-content');
            
            // 预处理HTML内容
            const processedHtml = this.preprocessHtmlContent(source);
            
            // 使用DOMParser安全解析HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(processedHtml, 'text/html');
            
            // 逐个添加子元素以避免阻塞
            const children = Array.from(doc.body.children);
            for (const child of children) {
                contentEl.appendChild(child.cloneNode(true));
            }
            
            // 后处理元素
            await this.postProcessHtmlElements(contentEl);
            
        } catch (error) {
            console.error('HTML渲染失败:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showError(contentEl, `HTML渲染失败: ${errorMessage}`);
        }
    }

    /**
     * 预处理HTML内容，转换路径
     * @param html 原始HTML内容
     * @returns 处理后的HTML内容
     */
    private preprocessHtmlContent(html: string): string {
        // 定义视频、图片和音频文件扩展名
        const mediaExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|mp4|webm|ogg|avi|mov|wmv|flv|mkv|m4v|3gp|mp3|wav|aac|flac|m4a)$/i;
        
        // 通用处理：匹配所有HTML标签中的src和poster属性
        // 使用全局替换来处理同一标签中的多个属性
        html = html.replace(/(src|poster)=(["'])([^"']*?)\2/gi, 
            (match: string, attrName: string, quote: string, attrValue: string) => {
                // 检查属性值是否以媒体文件扩展名结尾
                if (mediaExtensions.test(attrValue)) {
                    const processedValue = this.imagePathProcessor.processImagePath(attrValue);
                    return `${attrName}=${quote}${processedValue}${quote}`;
                }
                // 如果不是媒体文件，返回原始匹配
                return match;
            }
        );

        return html;
    }

    /**
     * 后处理HTML元素，添加错误处理
     * @param container 容器元素
     */
    private async postProcessHtmlElements(container: HTMLElement): Promise<void> {
        // 处理media-player元素
        const mediaPlayers = container.querySelectorAll('media-player');
        mediaPlayers.forEach((player) => {
            // 添加加载超时检测
            const timeout = setTimeout(() => {
                if (!player.hasAttribute('data-loaded')) {
                    console.warn('Media player加载超时');
                    this.showImageError(player as HTMLElement, '媒体加载超时');
                }
            }, 10000); // 10秒超时

            // 监听加载完成事件
            player.addEventListener('loadeddata', () => {
                clearTimeout(timeout);
                player.setAttribute('data-loaded', 'true');
            });

            player.addEventListener('error', () => {
                clearTimeout(timeout);
                this.showImageError(player as HTMLElement, '媒体加载失败');
            });
        });

        // 处理img元素
        const images = container.querySelectorAll('img');
        images.forEach((img) => {
            img.addEventListener('error', () => {
                this.showImageError(img, '图片加载失败');
            });

            img.addEventListener('load', () => {
                img.setAttribute('data-loaded', 'true');
            });
        });
    }

    /**
     * 显示错误信息
     * @param container 容器元素
     * @param message 错误消息
     */
    private showError(container: HTMLElement, message: string): void {
        container.empty();
        const errorEl = container.createEl('div', {
            cls: 'html-viewer-error',
            text: message
        });
    }

    /**
     * 显示图片/媒体加载错误
     * @param element 出错的元素
     * @param message 错误消息
     */
    private showImageError(element: HTMLElement, message: string): void {
        const errorEl = document.createElement('div');
        errorEl.className = 'image-load-error';
        errorEl.textContent = message;
        
        // 在元素后插入错误信息
        if (element.parentNode) {
            element.parentNode.insertBefore(errorEl, element.nextSibling);
        }
    }
}

/**
 * 创建HTML渲染器实例
 * @param app Obsidian应用实例
 * @returns HTML渲染器实例
 */
export function createHtmlRenderer(app: App): HtmlRenderer {
    return new HtmlRenderer(app);
}