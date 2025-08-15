import { App, TFile } from 'obsidian';

/**
 * 通用图片路径处理工具类
 */
export class ImagePathProcessor {
  constructor(private app: App) {}

  /**
   * 通用图片路径处理算法 - 遵循 Obsidian 最佳实践
   * @param imagePath 原始图片路径
   * @returns 处理后的资源URL或原路径
   * 
   * 支持的路径格式：
   * - `./path/to/image.jpg` - 相对路径，从当前目录开始查找
   * - `../path/to/image.jpg` - 相对路径，从上级目录开始查找
   * - `folder/image.jpg` - 相对路径，从 vault 根目录查找
   * - `/folder/image.jpg` - 以单个/开头的路径，去掉/后从 vault 根目录查找
   * - `http://example.com/image.jpg` - HTTP/HTTPS URL，直接返回
   * - `data:image/...` - Data URL，直接返回
   * - `//absolute/path/image.jpg` - 绝对路径，直接返回
   * 
   * 使用 Obsidian Vault API 获取资源URL，确保跨平台兼容性
   */
  processImagePath(imagePath: string): string {
    let processedPath = imagePath;
    
    try {
      // 解码 URL 编码的路径
      processedPath = decodeURIComponent(processedPath);
    } catch {
      // 如果解码失败，保持原路径
    }

    // 处理以 ./ 开头的相对路径
    if (processedPath.startsWith("./")) {
      // 移除 ./ 前缀，从当前目录开始查找
      const normalizedPath = processedPath.replace(/^\.\//,"");
      return this.getVaultResourcePath(normalizedPath) || imagePath;
    }
    // 处理以 ../ 开头的相对路径
    else if (processedPath.startsWith("../")) {
      // 移除 ../ 前缀，从上级目录开始查找
      const normalizedPath = processedPath.replace(/^\.\.\//, "");
      return this.getVaultResourcePath(normalizedPath) || imagePath;
    }
    // 处理以单个 / 开头但不是 // 双斜杠的路径
    else if (processedPath.startsWith("/") && !processedPath.startsWith("//")) {
      // 去掉前面的 / 并从 vault 根目录查找
      const pathWithoutSlash = processedPath.substring(1);
      return this.getVaultResourcePath(pathWithoutSlash) || imagePath;
    }
    // 处理其他相对路径（不以 / 开头，且不是 URL）
    else if (!processedPath.startsWith("/") && 
             !processedPath.startsWith("http://") && 
             !processedPath.startsWith("https://") && 
             !processedPath.startsWith("data:") && 
             !processedPath.startsWith("blob:") && 
             !processedPath.startsWith("file:")) {
      // 尝试从 vault 根目录查找文件
      return this.getVaultResourcePath(processedPath) || imagePath;
    }
    // 其他情况：绝对路径或 URL，直接返回
    // 包括：//absolute/path、http://、https://、data:、blob:、file: 等
    return processedPath;
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