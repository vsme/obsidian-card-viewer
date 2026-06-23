import { App, TFile } from 'obsidian';

/**
 * 通用图片路径处理工具类
 */
export class ImagePathProcessor {
  constructor(private app: App) {}

  /**
   * 通用图片路径处理算法 - 遵循 Obsidian 最佳实践
   * @param imagePath 原始图片路径
   * @param sourcePath 渲染卡片的 Markdown 文件路径（用于相对路径解析和短链接解析）
   * @returns 处理后的资源URL或原路径
   * 
   * 支持的路径格式：
   * - `./path/to/image.jpg` - 相对路径，从当前目录开始查找
   * - `../path/to/image.jpg` - 相对路径，从上级目录开始查找
   * - `folder/image.jpg` - 相对路径，从 vault 根目录查找
   * - `/folder/image.jpg` - 以单个/开头的路径，去掉/后从 vault 根目录查找
   * - `image.jpg` - 仅文件名，使用 Obsidian 内置链接解析器在全库搜索
   * - `http://example.com/image.jpg` - HTTP/HTTPS URL，直接返回
   * - `data:image/...` - Data URL，直接返回
   * - `//absolute/path/image.jpg` - 绝对路径，直接返回
   * 
   * 使用 Obsidian Vault API 获取资源URL，确保跨平台兼容性
   */
  processImagePath(imagePath: string, sourcePath: string = ""): string {
    let processedPath = imagePath;
    
    try {
      // 解码 URL 编码的路径
      processedPath = decodeURIComponent(processedPath);
    } catch {
      // 如果解码失败，保持原路径
    }

    // 判断是否为外部链接或 Data URL，直接返回
    if (processedPath.startsWith("http://") || 
        processedPath.startsWith("https://") || 
        processedPath.startsWith("data:") || 
        processedPath.startsWith("blob:") || 
        processedPath.startsWith("file:") ||
        processedPath.startsWith("//")) {
      return processedPath;
    }

    // 移除路径中可能附带的查询参数或哈希（例如 image.png?width=100 或 image.png#header）
    // 这对于本地文件查找非常关键，否则会因为文件名不匹配而找不到图片
    let cleanPath = processedPath;
    const queryIndex = cleanPath.indexOf('?');
    if (queryIndex !== -1) {
      cleanPath = cleanPath.substring(0, queryIndex);
    }
    const hashIndex = cleanPath.indexOf('#');
    if (hashIndex !== -1) {
      cleanPath = cleanPath.substring(0, hashIndex);
    }

    // 优先使用 Obsidian 的 metadataCache.getFirstLinkpathDest 来解析路径
    // 这可以完美支持短链接格式（如 [[图片.jpg]]）以及标准的相对/绝对路径
    if (sourcePath) {
      const file = this.app.metadataCache.getFirstLinkpathDest(cleanPath, sourcePath);
      if (file instanceof TFile) {
        return this.app.vault.getResourcePath(file);
      }
    }

    // --- 降级处理逻辑 ---
    // 如果 getFirstLinkpathDest 没有找到，执行手动路径解析作为兜底

    // 获取当前笔记所在的目录
    const sourceDir = sourcePath ? sourcePath.split('/').slice(0, -1).join('/') : "";

    // 处理相对路径 (./ 或 ../)
    if (cleanPath.startsWith("./") || cleanPath.startsWith("../")) {
      let resolvedPath = cleanPath;
      
      if (sourceDir) {
        // 基于当前目录手动解析 .. 和 .
        const parts = sourceDir.split('/').filter(p => p);
        const pathParts = cleanPath.split('/').filter(p => p);
        
        for (const part of pathParts) {
          if (part === '.') continue;
          if (part === '..') {
            parts.pop(); // 返回上一级目录
          } else {
            parts.push(part);
          }
        }
        resolvedPath = parts.join('/');
      } else {
        // 如果无法获取源路径，则简单地移除前缀
        resolvedPath = cleanPath.replace(/^(\.\/|\.\.\/)+/, '');
      }
      return this.getVaultResourcePath(resolvedPath) || imagePath;
    }
    // 处理以单个 / 开头的绝对路径（从 vault 根目录查找）
    else if (cleanPath.startsWith("/") && !cleanPath.startsWith("//")) {
      const pathWithoutSlash = cleanPath.substring(1);
      return this.getVaultResourcePath(pathWithoutSlash) || imagePath;
    }
    // 其他情况尝试直接作为相对 vault 根目录的路径查找
    else {
      return this.getVaultResourcePath(cleanPath) || imagePath;
    }
  }

  /**
   * 获取 vault 中文件的资源路径
   * @param path vault 相对路径
   * @returns 资源URL或null
   * 
   * 使用 Obsidian 推荐的 Vault API 而非 Adapter API
   * 确保跨平台兼容性（桌面端和移动端）
   */
  private getVaultResourcePath(path: string): string | null {
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) {
        // 使用 Vault API 获取资源路径，这是推荐的做法
        return this.app.vault.getResourcePath(file);
      }
    } catch (error) {
      console.warn(`Failed to get resource path for: ${path}`, error);
    }
    return null;
  }
}

/**
 * 创建图片路径处理器实例的工厂函数
 * @param app Obsidian App 实例
 * @returns ImagePathProcessor 实例
 */
export function createImagePathProcessor(app: App): ImagePathProcessor {
  return new ImagePathProcessor(app);
}