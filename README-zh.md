# Card Viewer Plugin

一个用于在 Obsidian 中解析和查看电影、电视剧、书籍、音乐和 HTML 内容卡片的插件。

- 🎬 支持电影、电视剧、书籍、音乐四种卡片类型
- 🖼️ 图片代码块在阅读模式下预览
- 🔍 解析当前文件中的所有卡片
- 🎨 美观的卡片显示界面
- 🔗 支持点击跳转到原文件
- 🏷️ 按类型过滤卡片

## 使用方法

![插件截图](./screenshot.png)

### 配合插件使用示例

https://github.com/user-attachments/assets/fab12904-d1db-41c2-83bf-fd26013910f1


### 卡片格式

##### 电影卡片

````
```card-movie
id: 1356587
title: 长安的荔枝
release_date: 2025-07-12
region: China
rating: 7.5
runtime: 122分钟
genres: 剧情, 历史, 喜剧
overview: 唐天宝年间，人到中年的李善德（大鹏 饰）骂骂咧咧干了很多活，抠抠搜搜花了不少钱，到头来却还是个无名小吏。然而这一切随着一次召见似乎有了转机，某天有人安排给他一个"荔枝使"的肥差，只要办成，那就是荣华富贵人生逆袭，但要是办不成……
poster: attachment/media/movie-1356587-1754901879016.jpg
```
````

##### 电视剧卡片
````
```card-tv
id: 1396-绝命毒师
title: 绝命毒师
release_date: 2008-01-20
region: United States of America
rating: 8.925
genres: 剧情, 犯罪
overview: 新墨西哥州的高中化学老师沃尔特·H·怀特是拮据家庭的唯一经济来源。他大半生安分守己，兢兢业业，却在50岁生日之际突然得知自己罹患肺癌晚期的噩耗，原本便不甚顺意的人生顿时雪上加霜。为了保障怀孕的妻子斯凯勒和残疾的儿子小沃特能在自己死后衣食无忧，沃尔特决意铤而走险。
poster: attachment/media/tv-1396-1754901495923.jpg
```
````

##### 书籍卡片
````
```card-book
id: 37359280
title: 人工少女
release_date: 2025-07
region: 马来西亚
rating: 7.7
genres: 科幻，魔幻
overview: 《人工少女》是马来西亚华人作家龚万辉的首部长篇小说，讲述了在近未来，世界因为一场瘟疫而毁灭，疲惫的父亲带着他的人工女儿莉莉卡，跋涉在被雨林接管的城市废墟之中，通过一扇扇记忆之"门"，穿梭回过去，经历封藏的往事。
poster: attachment/media/book-37359280-1754902931565.jpg
author: 龚万辉
publisher: 浙江文艺出版社
isbn: 9787533980054
external_url: https://book.douban.com/subject/37359280/
```
````

##### 音乐卡片
````
```card-music
id: 2106636228
title: ENOUGH!
author: Eternxlkz
album: ENOUGH!
release_date: 2023-12-14
duration: 90
genres: Pop
poster: attachment/media/music-https___163cn_tv_Ial8GCT-1754901733825.jpg
url: https://163cn.tv/Ial8GCT
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

## 字段说明

### 通用字段

- `title`: 标题（必填）
- `id`: 标识符（可为数字或字符串）
- `release_date`: 发布日期（显示在详细信息中）
- `region`: 地区
- `rating`: 评分（自动显示为一位小数，如 8.0）
- `genres`: 类型/流派
- `overview`: 简介
- `poster`: 海报/封面图片路径

### 电影特有字段

- `runtime`: 时长（分钟，也可带单位如"122分钟"）

### 电视剧特有字段

（无特有字段，使用通用字段即可）

### 书籍特有字段

- `author`: 作者
- `publisher`: 出版社
- `isbn`: ISBN号码
- `pages`: 页数
- `external_url`: 外部链接（如豆瓣链接）

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

## 注意事项

- 卡片必须严格按照格式书写
- 图片路径支持相对路径和绝对路径
- 评分建议使用 0-10 的数字，显示时自动保留一位小数
- 音乐时长以秒为单位输入，显示时自动转换为分:秒格式
