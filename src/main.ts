import { Plugin, App, PluginManifest, MarkdownPostProcessorContext } from "obsidian";
import { CardType, ErrorHandler, CardViewerSettings, DEFAULT_SETTINGS, CardRenderer, ImgsRenderer } from './types';
import { createErrorHandler, safeExecute } from './utils/errorHandler';
import { createCardRenderer } from './renderers/cardRenderer';
import { createImgsRenderer } from './renderers/imgsRenderer';
import { createHtmlRenderer, HtmlRenderer } from './renderers/htmlRenderer';
import { CardViewerSettingTab } from './settings';

/**
 * Obsidian Card Viewer Plugin
 * 支持多种卡片类型的渲染，包括电影、电视剧、书籍、音乐等
 * 同时支持图片网格和HTML内容的渲染
 */
export default class CardViewerPlugin extends Plugin {
  // 私有属性
  private registeredEvents: { detach(): void }[] = [];
  private errorHandler: ErrorHandler;
  private cardRenderer!: CardRenderer;
  private imgsRenderer!: ImgsRenderer;
  private htmlRenderer!: HtmlRenderer;
  private htmlProcessorRegistered: boolean = false;
  
  // 公共设置
  public settings: CardViewerSettings = DEFAULT_SETTINGS;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.registeredEvents = [];
    this.errorHandler = createErrorHandler();
  }

  /**
   * 插件加载时的主要入口点
   */
  async onload(): Promise<void> {
    try {
      // 1. 加载用户设置
      await this.loadSettings();

      // 2. 验证API兼容性
      if (!this.validateApiCompatibility()) {
        return;
      }

      // 3. 初始化所有渲染器
      this.initializeRenderers();

      // 4. 设置用户界面
      this.setupUserInterface();

      // 5. 注册所有处理器
      await this.registerAllProcessors();

    } catch (error) {
       this.errorHandler(error as Error, 'onload');
     }
  }

  /**
   * 插件卸载时的清理工作
   */
  onunload(): void {
    this.cleanup();
  }

  /**
   * 验证Obsidian API兼容性
   */
  private validateApiCompatibility(): boolean {
    if (!this.app?.workspace) {
      console.warn('CardViewer: Workspace API not available');
      return false;
    }

    if (typeof this.registerMarkdownCodeBlockProcessor !== "function") {
      console.warn('CardViewer: Code block processor API not available');
      return false;
    }

    return true;
  }

  /**
   * 初始化所有渲染器
   */
  private initializeRenderers(): void {
    this.cardRenderer = createCardRenderer(this.app);
    this.imgsRenderer = createImgsRenderer(this.app);
    this.htmlRenderer = createHtmlRenderer(this.app);
  }

  /**
   * 设置用户界面组件
   */
  private setupUserInterface(): void {
    this.addSettingTab(new CardViewerSettingTab(this.app, this));
  }

  /**
   * 注册所有处理器
   */
  private async registerAllProcessors(): Promise<void> {
    const processors = [
      { name: 'Card Processors', fn: () => this.registerCardProcessors() },
      { name: 'HTML Processor', fn: () => this.registerHtmlProcessor() },
      { name: 'Post Processor', fn: () => this.registerPostProcessor() }
    ];

    for (const processor of processors) {
      await safeExecute(
        processor.fn,
        this.errorHandler,
        processor.name
      );
    }
  }

  /**
   * 注册卡片类型处理器
   */
  private registerCardProcessors(): void {
    const cardTypes: CardType[] = ['movie', 'tv', 'book', 'music'];
    
    cardTypes.forEach(type => {
      this.registerMarkdownCodeBlockProcessor(
        `card-${type}`,
        this.createCardProcessor(type)
      );
    });
  }

  /**
   * 创建特定类型的卡片处理器
   */
  private createCardProcessor(type: CardType) {
    return async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      try {
        await this.cardRenderer.renderCard(type, source, el, ctx);
      } catch (error) {
        this.renderError(el, `渲染${type}卡片失败`, error instanceof Error ? error : new Error(String(error)));
      }
    };
  }

  /**
   * 注册HTML处理器
   */
  private registerHtmlProcessor(): void {
    if (this.settings.enableHtmlParsing && !this.htmlProcessorRegistered) {
      this.registerMarkdownCodeBlockProcessor(
        "html", 
        this.createHtmlProcessor()
      );
      this.htmlProcessorRegistered = true;
    }
  }

  /**
   * 创建HTML处理器
   */
  private createHtmlProcessor() {
    return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      try {
        this.renderHtmlBlock(source, el);
      } catch (error) {
          this.renderError(el, 'HTML渲染失败', error instanceof Error ? error : new Error(String(error)));
      }
    };
  }

  /**
   * 动态更新HTML处理器状态
   */
  public updateHtmlProcessor(): void {
    // 注意：由于Obsidian API限制，无法动态注销已注册的处理器
    // 当前实现需要重新加载插件才能完全生效
    if (this.settings.enableHtmlParsing && !this.htmlProcessorRegistered) {
      this.registerHtmlProcessor();
    }
    
    // 触发视图刷新
    this.app.workspace?.trigger('layout-change');
  }

  /**
   * 渲染HTML代码块
   */
  private renderHtmlBlock(source: string, el: HTMLElement): void {
    const trimmedSource = source.trim();
    
    // 创建HTML容器
    const htmlContainer = this.createHtmlContainer(el);
    const contentEl = this.createContentArea(htmlContainer);

    // 处理内容
    if (this.isEmptyHtmlContent(trimmedSource)) {
      this.renderEmptyContent(contentEl);
    } else {
      this.htmlRenderer.renderHtml(contentEl, trimmedSource);
    }
  }

  /**
   * 创建HTML容器
   */
  private createHtmlContainer(el: HTMLElement): HTMLElement {
    const htmlContainer = el.createEl("div", {
      cls: "html-viewer-container",
    });

    // 添加HTML标识头部
    const headerEl = htmlContainer.createEl("div", {
      cls: "html-viewer-header",
    });
    headerEl.createEl("span", {
      text: "HTML",
      cls: "html-viewer-type",
    });

    return htmlContainer;
  }

  /**
   * 创建内容区域
   */
  private createContentArea(container: HTMLElement): HTMLElement {
    return container.createEl("div", {
      cls: "html-viewer-content",
    });
  }

  /**
   * 渲染空内容占位符
   */
  private renderEmptyContent(contentEl: HTMLElement): void {
    contentEl.createEl("div", {
      cls: "html-viewer-placeholder",
      text: "空的HTML内容",
    });
  }

  /**
   * 检查是否为空HTML内容
   */
  private isEmptyHtmlContent(content: string): boolean {
    if (content.length === 0) return true;
    
    // 检查是否只包含空的HTML标签（不含样式、类或ID属性）
    const emptyTagPatterns = [
      /^\s*<\w+(?:\s+(?!style|class|id)[^=]*(?:="[^"]*")?)*>\s*<\/\w+>\s*$/,
      /^\s*<\w+(?:\s+(?!style|class|id)[^=]*(?:="[^"]*")?)*\/>\s*$/
    ];
    
    return emptyTagPatterns.some(pattern => 
      pattern.test(content) && !/\b(?:style|class|id)\s*=/.test(content)
    );
  }

  /**
   * 注册后处理器
   */
  private registerPostProcessor(): void {
    this.registerMarkdownPostProcessor(async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      try {
        await Promise.all([
          this.processCardBlocks(el, ctx),
          this.processImgsBlocks(el, ctx)
        ]);
      } catch (error) {
        // 静默处理错误，避免影响其他内容渲染
        console.warn('CardViewer: Post processor error:', error);
      }
    });
  }

  /**
   * 处理卡片代码块
   */
  private async processCardBlocks(el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> {
    const cardCodeBlocks = el.querySelectorAll('pre > code[class*="language-card"]');

    for (const codeBlock of Array.from(cardCodeBlocks)) {
      const htmlCodeBlock = codeBlock as HTMLElement;
      const cardType = this.extractCardType(htmlCodeBlock.className);
      
      if (!cardType) continue;

      await this.processCardBlock(htmlCodeBlock, cardType, ctx);
    }
  }

  /**
   * 从类名中提取卡片类型
   */
  private extractCardType(className: string): string | null {
    const cardMatch = className.match(/language-card-([a-z]+)/);
    return cardMatch ? cardMatch[1] : null;
  }

  /**
   * 处理单个卡片代码块
   */
  private async processCardBlock(codeBlock: HTMLElement, cardType: string, ctx: MarkdownPostProcessorContext): Promise<void> {
    const codeContent = codeBlock.textContent || "";
    const preElement = codeBlock.parentElement;
    
    if (!preElement?.parentNode) return;

    // 创建卡片容器并渲染
    const cardContainer = document.createElement("div");
    await this.cardRenderer.renderCard(cardType, codeContent, cardContainer, ctx);
    
    // 替换原始代码块
    preElement.parentNode.replaceChild(cardContainer, preElement);
  }

  /**
   * 处理图片网格代码块
   */
  private async processImgsBlocks(el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> {
    const imgsCodeBlocks = el.querySelectorAll('pre > code[class*="language-imgs"]');

    for (const codeBlock of Array.from(imgsCodeBlocks)) {
      await this.processImgsBlock(codeBlock as HTMLElement, ctx);
    }
  }

  /**
   * 处理单个图片网格代码块
   */
  private async processImgsBlock(codeBlock: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> {
    const codeContent = codeBlock.textContent || "";
    const preElement = codeBlock.parentElement;
    
    if (!preElement?.parentNode) return;

    // 创建图片网格容器并渲染
    const gridContainer = document.createElement("div");
    gridContainer.className = "imgs-grid-container";
    await this.imgsRenderer.renderImgsGrid(codeContent, gridContainer, ctx);
    
    // 替换原始代码块
    preElement.parentNode.replaceChild(gridContainer, preElement);
  }

  /**
   * 渲染错误信息
   */
  private renderError(el: HTMLElement, message: string, error: Error): void {
    if (el && typeof el.createEl === "function") {
      el.createEl("div", {
        text: `${message}: ${(error as Error).message}`,
        cls: "card-viewer-error"
      });
    }
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    try {
      // 重置状态
      this.htmlProcessorRegistered = false;
      
      // 清理事件监听器
      this.cleanupEventListeners();
      
    } catch (error) {
      console.warn('CardViewer: Cleanup error:', error);
    }
  }

  /**
   * 清理事件监听器
   */
  private cleanupEventListeners(): void {
    if (this.registeredEvents?.length) {
      this.registeredEvents.forEach(event => {
        try {
          event.detach?.();
        } catch (error) {
          // 静默处理错误
        }
      });
      this.registeredEvents = [];
    }
  }

  /**
   * 加载用户设置
   */
  async loadSettings(): Promise<void> {
    try {
      const loadedData = await this.loadData();
      this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
    } catch (error) {
      console.warn('CardViewer: Failed to load settings:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * 保存用户设置
   */
  async saveSettings(): Promise<void> {
    try {
      await this.saveData(this.settings);
    } catch (error) {
      console.error('CardViewer: Failed to save settings:', error);
      throw error;
    }
  }
}