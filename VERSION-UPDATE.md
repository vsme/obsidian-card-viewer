# 版本更新脚本使用说明

本项目包含一个自动化脚本，用于同时更新 `package.json` 和 `manifest.json` 文件中的版本号，确保两个文件的版本保持一致。

## 使用方法

### 方法一：直接运行脚本

```bash
node update-version.js <新版本号>
```

例如：
```bash
node update-version.js 1.0.4
```

### 方法二：使用 npm 脚本

```bash
npm run version:update <新版本号>
```

例如：
```bash
npm run version:update 1.0.4
```

## 版本号格式

版本号必须遵循语义化版本规范 (SemVer)，格式为 `x.y.z`，其中：
- `x` 是主版本号
- `y` 是次版本号  
- `z` 是修订版本号

## 脚本功能

1. **验证版本号格式**：确保输入的版本号符合 `x.y.z` 格式
2. **同时更新两个文件**：
   - `package.json` - 使用 2 个空格缩进
   - `manifest.json` - 使用制表符缩进
3. **显示更新结果**：显示旧版本号和新版本号
4. **提供后续步骤建议**：包括 git 操作命令

## 示例输出

```
正在更新 package.json...
✓ package.json 版本已从 1.0.3 更新到 1.0.4
正在更新 manifest.json...
✓ manifest.json 版本已从 1.0.3 更新到 1.0.4

版本更新完成! 🎉

建议的后续步骤:
1. git add package.json manifest.json
2. git commit -m "Update version to 1.0.4"
3. git tag v1.0.4
4. git push && git push --tags
```

## 错误处理

- 如果未提供版本号，脚本会显示使用说明
- 如果版本号格式不正确，脚本会报错并退出
- 如果文件读写出现问题，脚本会显示错误信息并退出

## 注意事项

- 运行脚本前请确保当前工作目录是项目根目录
- 建议在运行脚本前先提交当前更改，以便在需要时回滚
- 脚本会保持 `manifest.json` 的制表符缩进格式，符合 Obsidian 插件的标准格式