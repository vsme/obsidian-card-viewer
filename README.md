# Card Viewer Plugin

一个用于在 Obsidian 中解析和查看电影、电视剧、书籍、音乐和 HTML 内容卡片的插件。

## 功能特性

- 🎬 支持电影、电视剧、书籍、音乐四种卡片类型
- 🔍 解析当前文件中的所有卡片
- 📚 查看整个库中的所有卡片
- 🎨 美观的卡片显示界面
- 🔗 支持点击跳转到原文件
- 🏷️ 按类型过滤卡片
- 💻 HTML 代码块在阅读模式下实时预览
- ⭐ 精确的评分显示（保留一位小数）
- ⏱️ 音乐时长精确显示（分:秒格式）

## 使用方法

### 命令

1. **Parse Cards in Current File** - 解析当前文件的卡片
2. **View All Cards** - 查看所有卡片

### 卡片格式

##### 电影卡片

````
```card:movie
title: 阿凡达
id: 19995
release_date: 2009-12-18
region: 美国
rating: 7.6
runtime: 162
genres: 动作, 冒险, 奇幻, 科幻
overview: 在遥远的潘多拉星球上，杰克·萨利是一个身体残疾的前海军陆战队员...
poster: /path/to/poster.jpg
```
````

##### 电视剧卡片
````
```card:tv
title: 权力的游戏
id: 1399
release_date: 2011-04-17
region: 美国
rating: 9.3
genres: 剧情, 动作冒险, 科幻奇幻
overview: 七个王国的贵族家族争夺铁王座的控制权...
poster: /path/to/poster.jpg
```
````

##### 书籍卡片
````
```card:book
title: 三体
id: book_123
release_date: 2006-05-01
region: 中国
rating: 8.8
genres: 科幻小说
overview: 文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划"红岸工程"取得了突破性进展...
poster: /path/to/cover.jpg
```
````

##### 音乐卡片
````
```card:music
title: 夜曲
author: 周杰伦
album: 十一月的萧邦
duration: 270
genres: 流行音乐
poster: /path/to/album.jpg
url: https://music.example.com/track/123
```
````

> **注意**：音乐的 `duration` 字段以秒为单位，显示时会自动转换为 "分:秒" 格式（如 4:30）。

##### HTML 内容预览

````
```html
<div style="padding: 20px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border-radius: 10px; color: white; text-align: center;">
  <h2>Hello World!</h2>
  <p>这是一个 HTML 内容示例</p>
  <button onclick="alert('Hello!')" style="padding: 8px 16px; border: none; border-radius: 5px; background: white; color: #333; cursor: pointer;">点击我</button>
</div>
```
````

> **注意**：HTML 内容只在阅读模式下显示预览效果，在编辑模式下显示源代码。

### 代码块渲染

你也可以使用代码块来渲染卡片：

````
```card
movie
title: 星际穿越
release_date: 2014-11-07
rating: 9.3
genres: 剧情, 科幻
overview: 近未来的地球黄沙遍野，小麦、秋葵等基础农作物相继因枯萎病灭绝...
```
````

## 字段说明

### 通用字段

- `title`: 标题（必填）
- `release_date`: 发布日期（显示在详细信息中）
- `region`: 地区
- `rating`: 评分（自动显示为一位小数，如 8.0）
- `genres`: 类型/流派
- `overview`: 简介
- `poster`: 海报/封面图片路径

### 电影特有字段

- `id`: 电影ID（数字）
- `runtime`: 时长（分钟）

### 电视剧特有字段

- `id`: 电视剧ID（字符串）

### 书籍特有字段

- `id`: 书籍ID（字符串）

### 音乐特有字段

- `author`: 作者/歌手
- `album`: 专辑
- `duration`: 时长（秒，显示为分:秒格式）
- `url`: 播放链接

### HTML 内容说明

- 使用标准的 ```html 代码块格式
- 在阅读模式下自动渲染为可交互的 HTML 内容
- 在编辑模式下显示源代码
- 支持完整的 HTML 语法和 CSS 样式

## 卡片布局说明

### 显示结构

1. **标题行**：标题 + 类型标签
2. **评分区域**：星星评分 + 数字评分（保留一位小数）
3. **详细信息**：
   - 日期：发布日期
   - 地区：制作地区
   - 时长：运行时长
   - 类型：分类标签

### 特殊格式

- **评分显示**：所有评分都显示为一位小数（如 8.0、7.7、9.3）
- **音乐时长**：自动从秒转换为分:秒格式（如 270秒 → 4:30）
- **星星评分**：基于10分制转换为5星制显示

## 安装

1. 将插件文件夹复制到 `.obsidian/plugins/` 目录下
2. 在 Obsidian 设置中启用 "Card Viewer" 插件
3. 重启 Obsidian

## 快捷键

你可以在 Obsidian 设置的快捷键部分为插件命令设置自定义快捷键。

## 注意事项

- 卡片必须严格按照格式书写
- 图片路径支持相对路径和绝对路径
- 评分建议使用 0-10 的数字，显示时自动保留一位小数
- 音乐时长以秒为单位输入，显示时自动转换为分:秒格式
- 发行日期会显示在详细信息的第一行
