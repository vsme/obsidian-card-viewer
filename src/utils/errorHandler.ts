import { ErrorHandler } from '../types';

export const createErrorHandler = (): ErrorHandler => {
  return (error: Error, context: string = 'unknown') => {
    // 静默处理错误，不输出到控制台
    // 可以在这里添加用户通知或其他错误处理逻辑
    console.debug(`[CardViewer] Error in ${context}:`, error.message);
  };
};

export const safeExecute = async <T>(
  fn: () => Promise<T> | T,
  errorHandler: ErrorHandler,
  context: string = 'unknown'
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    errorHandler(error as Error, context);
    return null;
  }
};

export const createSafeElement = (
  parent: HTMLElement,
  tag: string,
  options: {
    text?: string;
    cls?: string;
    attr?: Record<string, string>;
  } = {}
): HTMLElement | null => {
  try {
    const element = parent.createEl(tag as keyof HTMLElementTagNameMap, {
      text: options.text,
      cls: options.cls,
      attr: options.attr
    });
    return element;
  } catch (error) {
    console.debug('[CardViewer] Failed to create element:', error);
    return null;
  }
};