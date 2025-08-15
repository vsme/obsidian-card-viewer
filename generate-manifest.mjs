import { readFileSync, writeFileSync } from "fs";

// 读取 package.json
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

// manifest 模板
const manifestTemplate = `{
	"id": "obsidian-card-viewer",
	"name": "Card Viewer",
	"version": "{{VERSION}}",
	"minAppVersion": "1.6.0",
	"description": "{{DESCRIPTION}}",
	"author": "{{AUTHOR}}",
	"authorUrl": "https://github.com/vsme",
	"isDesktopOnly": false
}`;

// 替换模板中的占位符
const manifestContent = manifestTemplate
  .replace(/{{VERSION}}/g, packageJson.version)
  .replace(/{{DESCRIPTION}}/g, packageJson.description)
  .replace(/{{AUTHOR}}/g, packageJson.author);

// 写入 manifest.json
writeFileSync("manifest.json", manifestContent);

console.log(`Generated manifest.json with version ${packageJson.version}`);