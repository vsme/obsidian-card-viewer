const { Plugin, Notice } = require("obsidian");
class CardViewerPlugin extends Plugin {
  constructor(app, manifest) {
    super(app, manifest);
    this.registeredEvents = [];
    // 全局错误处理
    this.handleError = (error, context = "unknown") => {
      // 静默处理错误，不输出到控制台
      // 可以在这里添加用户通知或其他错误处理逻辑
    };
  }

  async onload() {
    // API兼容性检查
    if (!this.app || !this.app.workspace) {
      return;
    }
    // 检查必要的API方法
    if (typeof this.registerMarkdownCodeBlockProcessor !== "function") {
      return;
    }
    // 注册特定类型的卡片处理器
    try {
      const cardTypes = ['movie', 'tv', 'book', 'music'];
      cardTypes.forEach(type => {
        this.registerMarkdownCodeBlockProcessor(
          `card-${type}`,
          async (source, el, ctx) => {
            try {
              await this.renderCard(type, source, el, ctx);
            } catch (error) {
              if (el && typeof el.createEl === "function") {
                el.createEl("div", {
                  text: `渲染${type}卡片失败: ${error.message}`,
                });
              }
            }
          }
        );
      });
    } catch (error) {
      // 静默处理注册失败
    }
    // 注册HTML代码块处理器
    try {
      this.registerMarkdownCodeBlockProcessor("html", (source, el, ctx) => {
        try {
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
          // 检查是否为空或只包含空的HTML标签
          const isEmptyContent =
            trimmedSource.length === 0 ||
            (/^\s*<\w+(?:\s+(?!style|class|id)[^=]*(?:="[^"]*")?)*>\s*<\/\w+>\s*$/.test(
              trimmedSource
            ) &&
              !/\b(?:style|class|id)\s*=/.test(trimmedSource)) ||
            (/^\s*<\w+(?:\s+(?!style|class|id)[^=]*(?:="[^"]*")?)*\/>\s*$/.test(
              trimmedSource
            ) &&
              !/\b(?:style|class|id)\s*=/.test(trimmedSource));

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
        } catch (error) {
          el.createEl("div", { text: `HTML渲染失败: ${error.message}` });
        }
      });
    } catch (error) {
      // 静默处理注册失败
    }

    // 注册阅读模式后处理器，通过 class 检查识别 card 和 imgs 代码块
    try {
      this.registerMarkdownPostProcessor(async (el, ctx) => {
        try {
          // 查找所有带有 language-card 开头的 class 的代码块（包含下划线及类型）
          const cardCodeBlocks = el.querySelectorAll(
            'pre > code[class*="language-card"]'
          );

          for (const codeBlock of cardCodeBlocks) {
            const codeContent = codeBlock.textContent || "";
            const preElement = codeBlock.parentElement;
            
            // 从class名称中提取卡片类型
            let cardType = null;
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
            await this.renderCard(cardType, codeContent, cardContainer, ctx);

            // 替换原始代码块
            if (preElement && preElement.parentNode) {
              preElement.parentNode.replaceChild(cardContainer, preElement);
            }
          }

          // 查找所有带有 language-imgs class 的代码块
          const imgsCodeBlocks = el.querySelectorAll(
            'pre > code[class*="language-imgs"]'
          );

          for (const codeBlock of imgsCodeBlocks) {
            const codeContent = codeBlock.textContent || "";
            const preElement = codeBlock.parentElement;

            // 创建图片网格容器
            const gridContainer = document.createElement("div");
            gridContainer.className = "imgs-grid-container";

            // 渲染图片网格
            await this.renderImgsGrid(codeContent, gridContainer, ctx);

            // 替换原始代码块
            if (preElement && preElement.parentNode) {
              preElement.parentNode.replaceChild(gridContainer, preElement);
            }
          }
        } catch (error) {
          // 静默处理错误
        }
      });
    } catch (error) {
      // 静默处理注册失败
    }
  }
  onunload() {
    // 清理事件监听器和引用
    try {
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
  parseCard(type, content) {
    const parseField = field => {
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
    const parseNumber = field => {
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
    };
  }
  async renderImgsGrid(source, el, ctx) {
    try {
      // 添加标识
      const headerEl = el.appendChild(document.createElement("div"));
      headerEl.className = "imgs-grid-header";
      const typeEl = headerEl.appendChild(document.createElement("span"));
      typeEl.textContent = "IMAGES";
      typeEl.className = "imgs-grid-type";

      // 创建9宫格容器
      const gridEl = el.appendChild(document.createElement("div"));
      gridEl.className = "imgs-grid";

      // 解析图片信息
      const imageRegex = /!\[([^\]]*)\]\(([^\s\)]+)(?:\s+"([^"]+)")?\)/g;
      const images = [];
      let match;

      while ((match = imageRegex.exec(source)) !== null) {
        images.push({
          alt: match[1] || "",
          src: match[2],
          title: match[3] || "",
        });
      }

      if (images.length === 0) {
        // 显示空内容占位符
        const placeholderEl = gridEl.appendChild(document.createElement("div"));
        placeholderEl.className = "imgs-grid-placeholder";
        placeholderEl.textContent = "未找到图片";
      } else {
        // 渲染图片
        images.forEach((image, index) => {
          const imageItem = gridEl.appendChild(document.createElement("div"));
          imageItem.className = "imgs-grid-item";

          let imageSrc = image.src;
          // 处理相对路径
          if (imageSrc.startsWith("../")) {
            // 移除开头的 ../
            imageSrc = imageSrc.replace(/^\.\.\//, "");
            const file = this.app.vault.getAbstractFileByPath(imageSrc);
            if (file) {
              try {
                imageSrc = this.app.vault.adapter.getResourcePath(imageSrc);
              } catch {
                // 保持原路径
              }
            }
          }

          const imgEl = imageItem.appendChild(document.createElement("img"));
          imgEl.className = "imgs-grid-image";
          imgEl.src = imageSrc;
          imgEl.alt = image.alt;
          imgEl.loading = "lazy";

          // 如果有标题，添加标题显示
          if (image.title) {
            const titleEl = imageItem.appendChild(
              document.createElement("div")
            );
            titleEl.className = "imgs-grid-title";
            titleEl.textContent = image.title;
          }

          // 图片加载错误处理
          imgEl.onerror = () => {
            imageItem.classList.add("error");
            const errorEl = imageItem.appendChild(
              document.createElement("div")
            );
            errorEl.className = "imgs-grid-error";
            errorEl.textContent = "图片加载失败";
          };

          // 点击放大功能
          imgEl.addEventListener("click", () => {
            // 创建模态框显示大图
            const modal = document.createElement("div");
            modal.className = "imgs-modal";
            modal.innerHTML = `
              <div class="imgs-modal-content">
                <button class="imgs-modal-close" type="button" aria-label="关闭">&times;</button>
                <img src="${imageSrc}" alt="${image.alt}" class="imgs-modal-image">
                ${image.title ? `<div class="imgs-modal-title">${image.title}</div>` : ""}
              </div>
            `;

            document.body.appendChild(modal);

            // 关闭模态框
            const closeModal = () => {
              document.body.removeChild(modal);
            };

            modal
              .querySelector(".imgs-modal-close")
              .addEventListener("click", closeModal);
            modal.addEventListener("click", e => {
              if (e.target === modal) {
                closeModal();
              }
            });
          });
        });
      }
    } catch (error) {
      const errorEl = el.appendChild(document.createElement("div"));
      errorEl.textContent = `图片网格渲染失败: ${error.message}`;
    }
  }

  async renderCard(type, source, el, ctx) {
    if (!el || typeof el.createEl !== "function") {
      return;
    }
    const card = this.parseCard(type, source);
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
    if (card.id || (card.type === "music" && card.url)) {
      cardEl.addClass("card-viewer-clickable");
      cardEl.addEventListener("click", e => {
        e.preventDefault();
        if (card.type === "music" && card.url) {
          window.open(card.url, "_blank");
        } else if (card.id) {
          let baseUrl;
          if (card.type === "tv") {
            baseUrl = "https://www.themoviedb.org/tv/";
          } else if (card.type === "book") {
            baseUrl = "https://book.douban.com/subject/";
          } else {
            baseUrl = "https://www.themoviedb.org/movie/";
          }
          window.open(`${baseUrl}${card.id}`, "_blank");
        }
      });
    }
    // 标题和类型
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

    // 评分信息
    if (card.rating) {
      const metaEl = infoSection.createEl("div", { cls: "card-viewer-meta" });
      if (card.rating) {
        const ratingEl = metaEl.createEl("div", {
          cls: "card-viewer-rating",
        });
        const starsContainer = ratingEl.createEl("div", {
          cls: "card-viewer-stars",
        });
        const starRating = card.rating / 2; // 转换为5星制
        for (let i = 0; i < 5; i++) {
          const isFull = i < Math.floor(starRating);
          const isHalf = i === Math.floor(starRating) && starRating % 1 >= 0.5;
          const starEl = starsContainer.createEl("span", {
            cls: `card-viewer-star ${isFull ? "full" : isHalf ? "half" : "empty"}`,
          });
          starEl.innerHTML = `<svg viewBox="0 0 20 20" fill="none"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
          if (isHalf) {
            starEl.innerHTML = `<svg viewBox="0 0 20 20" fill="none"><defs><clipPath id="half-star-${i}"><rect x="0" y="0" width="10" height="20"/></clipPath></defs><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="#d1d5db"/><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="#fbbf24" clip-path="url(#half-star-${i})"/></svg>`;
          }
        }
        ratingEl.createSpan({
          text: card.rating.toFixed(1),
          cls: "card-viewer-rating-text",
        });
      }
    }
    // 详细信息
    const detailsEl = infoSection.createEl("div", {
      cls: "card-viewer-details",
    });
    const addDetail = (label, value, className = "") => {
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
    };
    // 添加发行日期到详细信息中
    addDetail("日期", card.release_date);

    if (card.type === "music") {
      addDetail("作者", card.author);
      addDetail("专辑", card.album);
      // 将秒钟转换为分钟:秒钟格式
      if (card.duration) {
        const minutes = Math.floor(card.duration / 60);
        const seconds = card.duration % 60;
        addDetail("时长", `${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    } else if (card.type === "book") {
      addDetail("作者", card.author);
    } else {
      addDetail("地区", card.region);
      if (card.runtime) addDetail("时长", `${card.runtime}分钟`);
    }
    // 海报图片
    if (card.poster) {
      let imageSrc = card.poster;
      // 简化路径处理
      if (imageSrc.startsWith("attachment/")) {
        const file = this.app.vault.getAbstractFileByPath(imageSrc);
        if (file) {
          try {
            imageSrc = this.app.vault.adapter.getResourcePath(imageSrc);
          } catch {
            // 保持原路径
          }
        }
      }
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
    // 其他详细信息
    addDetail("类型", card.genres, "genres");
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
}
module.exports = CardViewerPlugin;
