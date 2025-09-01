# Card Viewer Plugin

[中文介绍](./README-zh.md)

A plugin for parsing and viewing movie, TV show, book, music cards in Obsidian.

- 🎨 Beautiful card display interface
- 🎬 Support for four card types: movies, TV shows, books, and music  
- 🖼️ Image code blocks preview in grid layout with lightbox support in reading mode
- 🌐 Optional HTML code block rendering

## Usage

![Plugin Screenshot](./screenshot.png)

### Templater Plugin Usage Example

https://github.com/user-attachments/assets/fab12904-d1db-41c2-83bf-fd26013910f1


### Card Formats

##### Movie Card

````
```card-movie
id: 1356587
title: Chang'an Lychee
release_date: 2025-07-12
region: China
rating: 7.5
runtime: 122 minutes
genres: Drama, History, Comedy
overview: During the Tang Tianbao period, middle-aged Li Shande (Dapeng) grumbled through many jobs, spent a lot of money frugally, but still remained a nameless clerk. However, everything seemed to turn around with a summons. One day, someone arranged for him a lucrative position as "Lychee Envoy". If successful, it would mean wealth and a life reversal, but if he failed...
poster: attachment/media/movie-1356587-1754901879016.jpg
```
````

##### TV Show Card

````
```card-tv
id: 1396-Breaking Bad
title: Breaking Bad
release_date: 2008-01-20
region: United States of America
rating: 8.925
genres: Drama, Crime
overview: High school chemistry teacher Walter H. White is the sole breadwinner for his struggling family. Having lived most of his life law-abiding and diligent, he suddenly learns on his 50th birthday that he has terminal lung cancer, making his already difficult life even worse. To ensure his pregnant wife Skyler and disabled son Walter Jr. can live comfortably after his death, Walter decides to take desperate measures.
poster: attachment/media/tv-1396-1754901495923.jpg
```
````

##### Book Card

````
```card-book
id: 37359280
title: Artificial Girl
release_date: 2025-07
region: Malaysia
rating: 7.7
genres: Science Fiction, Fantasy
overview: "Artificial Girl" is the first novel by Malaysian Chinese writer Gong Wanhui. It tells the story of a near future where the world is destroyed by a plague. A weary father travels with his artificial daughter Lilika through city ruins reclaimed by jungle, passing through doors of memory to shuttle back to the past and experience buried memories.
poster: attachment/media/book-37359280-1754902931565.jpg
author: Gong Wanhui
publisher: Zhejiang Literature and Art Publishing House
isbn: 9787533980054
external_url: https://book.douban.com/subject/37359280/
```
````

##### Music Card

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

> **Note**: The `duration` field for music is in seconds and will be automatically converted to "minutes:seconds" format when displayed (e.g., 4:30).

##### HTML Content Preview

````
```html
<div style="padding: 20px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border-radius: 10px; color: white; text-align: center;">
  <h2>Hello World!</h2>
  <p>This is an HTML content example</p>
  <button onclick="alert('Hello!')" style="padding: 8px 16px; border: none; border-radius: 5px; background: white; color: #333; cursor: pointer;">Click Me</button>
</div>
```
````

> **Note**: `HTML` content preview is enabled by default. You can disable it in plugin settings.

https://github.com/user-attachments/assets/b0057692-e6a8-45b2-b3e4-3d030ce709dd


## Field Descriptions

### Common Fields

- `title`: Title (required)
- `id`: Identifier (can be number or string)
- `release_date`: Release date (displayed in detailed information)
- `region`: Region
- `rating`: Rating (automatically displayed as one decimal place, e.g., 8.0)
- `genres`: Type/Genre
- `overview`: Synopsis
- `poster`: Poster/cover image path

### Movie-Specific Fields

- `runtime`: Duration (in minutes, can include unit like "122 minutes")

### TV Show-Specific Fields

(No specific fields, use common fields)

### Book-Specific Fields

- `author`: Author
- `publisher`: Publisher
- `isbn`: ISBN number
- `pages`: Page count
- `external_url`: External link (e.g., Douban link)

### Music-Specific Fields

- `author`: Author/Artist
- `album`: Album
- `duration`: Duration (in seconds, displayed as minutes:seconds format)
- `url`: Play link

### HTML Content Description

- Uses standard ```html code block format
- Automatically renders as interactive HTML content in reading mode
- Shows source code in edit mode
- Supports full HTML syntax and CSS styles

## Card Layout Description

- **Rating Display**: All ratings are displayed with one decimal place (e.g., 8.0, 7.7, 9.3)
- **Music Duration**: Automatically converts from seconds to minutes:seconds format (e.g., 270 seconds → 4:30)
- **Star Rating**: Converts from 10-point scale to 5-star display

## Installation

### BRAT (Recommended)

#### Install BRAT Plugin

1. Open Obsidian settings, click "Community plugins"
2. Search for "BRAT" plugin and click "Install"
3. Enable BRAT plugin
4. Restart Obsidian

#### Install Card Viewer Plugin via BRAT

1. Open Obsidian settings, find "BRAT" settings page
2. Click "Add Beta Plugin" button
3. Enter the plugin's GitHub repository URL in the popup dialog:
   ```
   https://github.com/vsme/obsidian-card-viewer-beta
   ```
4. Click "Add Plugin" button
5. BRAT will automatically download and install the plugin
6. Enable "Card Viewer" plugin in "Community plugins" page
7. Restart Obsidian

#### Update Plugin

Plugins installed via BRAT will automatically check for updates. You can also:

1. View installed beta plugins list in BRAT settings page
2. Click "Check for updates" button next to the plugin to manually check for updates
3. If updates are available, BRAT will automatically download and install the latest version

### Manual Installation

1. Copy the plugin folder to the `.obsidian/plugins/` directory
2. Enable the "Card Viewer" plugin in Obsidian settings
3. Restart Obsidian

## Notes

- Cards must be written strictly according to the format, otherwise they may not display correctly
- Image paths support both relative and absolute paths
- Ratings should use numbers from 0-10, automatically displayed with one decimal place
- Music duration should be input in seconds, automatically converted to minutes:seconds format when displayed
