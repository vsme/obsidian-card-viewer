import { Plugin, Notice } from "obsidian";
import { CardType, ErrorHandler, CardViewerSettings, DEFAULT_SETTINGS } from './types';
import { createErrorHandler, safeExecute } from './utils/errorHandler';
import { createCardRenderer } from './renderers/cardRenderer';
import { createImgsRenderer } from './renderers/imgsRenderer';
import { CardViewerSettingTab } from './settings';

export default class CardViewerPlugin extends Plugin {
  private registeredEvents: any[] = [];
  private errorHandler: ErrorHandler;
  private cardRenderer: any;
  private imgsRenderer: any;
  private htmlProcessorRegistered: boolean = false; // 跟踪HTML处理器是否已注册
  settings: CardViewerSettings = DEFAULT_SETTINGS;

  constructor(app: any, manifest: any) {
    super(app, manifest);
    this.registeredEvents = [];
    this.errorHandler = createErrorHandler();
  }

  async onload(): Promise<void> {
    // 加载设置
    await this.loadSettings();

    // API兼容性检查
    if (!this.app || !this.app.workspace) {
      return;
    }

    // 检查必要的API方法
    if (typeof this.registerMarkdownCodeBlockProcessor !== "function") {
      return;
    }

    // 初始化渲染器
    this.cardRenderer = createCardRenderer(this.app);
    this.imgsRenderer = createImgsRenderer(this.app);

    // 添加设置选项卡
    this.addSettingTab(new CardViewerSettingTab(this.app, this));

    // 注册特定类型的卡片处理器
    await safeExecute(
      () => this.registerCardProcessors(),
      this.errorHandler,
      'registerCardProcessors'
    );

    // 注册HTML代码块处理器（总是注册，但内部根据设置决定是否处理）
    await safeExecute(
      () => this.registerHtmlProcessor(),
      this.errorHandler,
      'registerHtmlProcessor'
    );

    // 注册阅读模式后处理器
    await safeExecute(
      () => this.registerPostProcessor(),
      this.errorHandler,
      'registerPostProcessor'
    );
  }

  onunload(): void {
    // 清理事件监听器和引用
    try {
      // 重置HTML处理器状态
      this.htmlProcessorRegistered = false;
      
      // 清理可能的DOM事件监听器
      if (this.registeredEvents) {
        this.registeredEvents.forEach(event => {
          try {
            event.detach();
          } catch (error) {
            // 静默处理错误
          }
        });
        this.registeredEvents = [];
      }
    } catch (error) {
      // 静默处理错误
    }
  }

  private registerCardProcessors(): void {
    const cardTypes: CardType[] = ['movie', 'tv', 'book', 'music'];
    
    cardTypes.forEach(type => {
      this.registerMarkdownCodeBlockProcessor(
        `card-${type}`,
        async (source: string, el: HTMLElement, ctx: any) => {
          try {
            await this.cardRenderer.renderCard(type, source, el, ctx);
          } catch (error) {
            if (el && typeof el.createEl === "function") {
              el.createEl("div", {
                text: `渲染${type}卡片失败: ${(error as Error).message}`,
              });
            }
          }
        }
      );
    });
  }

  private registerHtmlProcessor(): void {
    // 只在启用时注册处理器
    if (this.settings.enableHtmlParsing && !this.htmlProcessorRegistered) {
      this.registerMarkdownCodeBlockProcessor("html", (source: string, el: HTMLElement, ctx: any) => {
        try {
          this.renderHtmlBlock(source, el);
        } catch (error) {
          el.createEl("div", { text: `HTML渲染失败: ${(error as Error).message}` });
        }
      });
      this.htmlProcessorRegistered = true;
    }
  }

  // 动态更新HTML处理器状态
  public updateHtmlProcessor(): void {
    // 注意：由于Obsidian API限制，无法动态注销已注册的处理器
    // 当前实现需要重新加载插件才能完全生效
    // 但我们仍然尝试注册新的处理器（如果从禁用变为启用）
    if (this.settings.enableHtmlParsing && !this.htmlProcessorRegistered) {
      this.registerHtmlProcessor();
    }
    
    // 触发视图刷新
    if (this.app.workspace) {
      this.app.workspace.trigger('layout-change');
    }
  }

  private renderHtmlBlock(source: string, el: HTMLElement): void {
    // 创建HTML容器
    const htmlContainer = el.createEl("div", {
      cls: "html-viewer-container",
    });

    // 添加HTML标识
    const headerEl = htmlContainer.createEl("div", {
      cls: "html-viewer-header",
    });
    headerEl.createEl("span", {
      text: "HTML",
      cls: "html-viewer-type",
    });

    // 创建内容区域
    const contentEl = htmlContainer.createEl("div", {
      cls: "html-viewer-content",
    });

    // 检查是否为空内容
    const trimmedSource = source.trim();
    const isEmptyContent = this.isEmptyHtmlContent(trimmedSource);

    if (isEmptyContent) {
      // 显示空内容占位符
      contentEl.createEl("div", {
        cls: "html-viewer-placeholder",
        text: "空的HTML内容",
      });
    } else {
      // 渲染HTML内容
      contentEl.innerHTML = source;
    }
  }

  private isEmptyHtmlContent(content: string): boolean {
    // 检查是否为空或只包含空的HTML标签
    return (
      content.length === 0 ||
      (/^\s*<\w+(?:\s+(?!style|class|id)[^=]*(?:="[^"]*")?)*>\s*<\/\w+>\s*$/.test(
        content
      ) &&
        !/\b(?:style|class|id)\s*=/.test(content)) ||
      (/^\s*<\w+(?:\s+(?!style|class|id)[^=]*(?:="[^"]*")?)*\/>\s*$/.test(
        content
      ) &&
        !/\b(?:style|class|id)\s*=/.test(content))
    );
  }

  private registerPostProcessor(): void {
    this.registerMarkdownPostProcessor(async (el: HTMLElement, ctx: any) => {
      try {
        await this.processCardBlocks(el, ctx);
        await this.processImgsBlocks(el, ctx);
      } catch (error) {
        // 静默处理错误
      }
    });
  }

  private async processCardBlocks(el: HTMLElement, ctx: any): Promise<void> {
    // 查找所有带有 language-card 开头的 class 的代码块（包含下划线及类型）
    const cardCodeBlocks = el.querySelectorAll(
      'pre > code[class*="language-card"]'
    );

    for (let i = 0; i < cardCodeBlocks.length; i++) {
      const codeBlock = cardCodeBlocks[i] as HTMLElement;
      const codeContent = codeBlock.textContent || "";
      const preElement = codeBlock.parentElement;
      
      // 从class名称中提取卡片类型
      let cardType: string | null = null;
      const classList = codeBlock.className;
      const cardMatch = classList.match(/language-card-([a-z]+)/);
      if (cardMatch) {
        cardType = cardMatch[1];
      } else if (classList.includes('language-card')) {
         // 跳过通用的language-card，只处理特定类型
         continue;
       }

      // 创建卡片容器
      const cardContainer = document.createElement("div");

      // 渲染卡片
      await this.cardRenderer.renderCard(cardType, codeContent, cardContainer, ctx);

      // 替换原始代码块
      if (preElement && preElement.parentNode) {
        preElement.parentNode.replaceChild(cardContainer, preElement);
      }
    }
  }

  private async processImgsBlocks(el: HTMLElement, ctx: any): Promise<void> {
    // 查找所有带有 language-imgs class 的代码块
    const imgsCodeBlocks = el.querySelectorAll(
      'pre > code[class*="language-imgs"]'
    );

    for (let i = 0; i < imgsCodeBlocks.length; i++) {
      const codeBlock = imgsCodeBlocks[i] as HTMLElement;
      const codeContent = codeBlock.textContent || "";
      const preElement = codeBlock.parentElement;

      // 创建图片网格容器
      const gridContainer = document.createElement("div");
      gridContainer.className = "imgs-grid-container";

      // 渲染图片网格
      await this.imgsRenderer.renderImgsGrid(codeContent, gridContainer, ctx);

      // 替换原始代码块
      if (preElement && preElement.parentNode) {
        preElement.parentNode.replaceChild(gridContainer, preElement);
      }
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}