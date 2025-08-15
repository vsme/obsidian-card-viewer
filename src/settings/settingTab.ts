import { App, Modal, Notice, PluginSettingTab, Setting } from "obsidian";
import { CardViewerSettings } from '../types';
import type CardViewerPlugin from '../main';

// 确认对话框Modal类
class ConfirmModal extends Modal {
  private resolve: (value: boolean) => void;
  private title: string;
  private message: string;
  private confirmText: string;
  private cancelText: string;

  constructor(app: App, title: string, message: string, confirmText: string, cancelText: string, resolve: (value: boolean) => void) {
    super(app);
    this.title = title;
    this.message = message;
    this.confirmText = confirmText;
    this.cancelText = cancelText;
    this.resolve = resolve;
  }

  onOpen() {
    const { contentEl, titleEl } = this;
    
    titleEl.setText(this.title);
    contentEl.empty();
    
    // 添加消息文本
    const messageEl = contentEl.createEl('p');
    messageEl.style.marginBottom = '20px';
    messageEl.style.lineHeight = '1.5';
    messageEl.setText(this.message);
    
    // 添加按钮容器
    const buttonContainer = contentEl.createEl('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    
    // 取消按钮
    const cancelButton = buttonContainer.createEl('button');
    cancelButton.setText(this.cancelText);
    cancelButton.onclick = () => {
      this.close();
      this.resolve(false);
    };
    
    // 确认按钮
    const confirmButton = buttonContainer.createEl('button');
    confirmButton.setText(this.confirmText);
    confirmButton.addClass('mod-cta');
    confirmButton.onclick = () => {
      this.close();
      this.resolve(true);
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export class CardViewerSettingTab extends PluginSettingTab {
  plugin: CardViewerPlugin;

  constructor(app: App, plugin: CardViewerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Card Viewer 设置' });

    new Setting(containerEl)
      .setName('启用 HTML 解析')
      .setDesc('是否启用 HTML 代码块的解析和渲染功能')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableHtmlParsing)
        .onChange(async (value) => {
          if (!value && this.plugin.settings.enableHtmlParsing) {
            // 禁用时显示确认对话框
            const confirmed = await this.showConfirmDialog(
              '确认禁用 HTML 解析',
              '禁用 HTML 解析功能需要重启插件才能完全生效。\n\n是否确认禁用并立即重启插件？',
              '确认并重启',
              '取消'
            );
            
            if (confirmed) {
              this.plugin.settings.enableHtmlParsing = value;
              await this.plugin.saveSettings();
              new Notice('HTML解析已禁用，正在重启插件...');
              // 重启插件
              await this.restartPlugin();
            } else {
              // 用户取消，恢复开关状态
              toggle.setValue(true);
              return;
            }
          } else {
            // 启用时直接生效
            this.plugin.settings.enableHtmlParsing = value;
            await this.plugin.saveSettings();
            this.plugin.updateHtmlProcessor();
            if (value) {
              new Notice('HTML解析已启用');
            }
          }
        }));
  }

  // 显示确认对话框
  private async showConfirmDialog(title: string, message: string, confirmText: string, cancelText: string): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new ConfirmModal(this.app, title, message, confirmText, cancelText, resolve);
      modal.open();
    });
  }

  // 重启插件
  private async restartPlugin(): Promise<void> {
    const pluginId = this.plugin.manifest.id;
    const plugins = (this.app as any).plugins;
    
    try {
      // 禁用插件
      await plugins.disablePlugin(pluginId);
      // 等待一小段时间确保完全卸载
      await new Promise(resolve => setTimeout(resolve, 100));
      // 重新启用插件
      await plugins.enablePlugin(pluginId);
      
      // 等待插件完全加载后重新打开设置页面
      setTimeout(() => {
        try {
          // 获取重新加载后的插件实例
          const reloadedPlugin = plugins.plugins[pluginId];
          if (reloadedPlugin) {
            // 打开插件设置
            (this.app as any).setting.open();
            (this.app as any).setting.openTabById(pluginId);
            new Notice('插件重启完成，设置页面已重新打开');
          } else {
            new Notice('插件重启完成');
          }
        } catch (settingError) {
          console.error('Failed to reopen settings:', settingError);
          new Notice('插件重启完成');
        }
      }, 200);
      
    } catch (error) {
      new Notice('插件重启失败，请手动重启');
      console.error('Plugin restart failed:', error);
    }
  }
}