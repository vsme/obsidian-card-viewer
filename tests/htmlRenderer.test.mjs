import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

const buildResult = await build({
  entryPoints: ["src/renderers/htmlRenderer.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  plugins: [
    {
      name: "obsidian-mock",
      setup(builder) {
        builder.onResolve({ filter: /^obsidian$/ }, () => ({
          path: "obsidian",
          namespace: "obsidian-mock",
        }));
        builder.onLoad(
          { filter: /.*/, namespace: "obsidian-mock" },
          () => ({
            loader: "js",
            contents: `
              export class TFile {
                static [Symbol.hasInstance](value) {
                  return value?.isTFile === true;
                }
              }
              export function normalizePath(path) {
                return path
                  .replace(/\\\\/g, "/")
                  .replace(/\\/+/g, "/")
                  .replace(/\\/$/, "");
              }
            `,
          })
        );
      },
    },
  ],
});

const moduleUrl = `data:text/javascript;base64,${Buffer.from(
  buildResult.outputFiles[0].text
).toString("base64")}`;
const { HtmlRenderer } = await import(moduleUrl);

function createRenderer() {
  const lookups = [];
  const file = { isTFile: true, path: "notes/project/cover.jpg" };
  const app = {
    metadataCache: {
      getFirstLinkpathDest: (path, sourcePath) => {
        lookups.push([path, sourcePath]);
        return path === "cover.jpg" ? file : null;
      },
    },
    vault: {
      getAbstractFileByPath: () => null,
      getResourcePath: (resolvedFile) => `app://${resolvedFile.path}`,
    },
  };

  return { renderer: new HtmlRenderer(app, () => ({ localImagePathPrefix: "" })), lookups };
}

test("resolves HTML media paths with query parameters from the current note", () => {
  const { renderer, lookups } = createRenderer();

  const html = renderer.preprocessHtmlContent(
    '<img src="cover.jpg?width=300">',
    "notes/project/note.md"
  );

  assert.equal(html, '<img src="app://notes/project/cover.jpg">');
  assert.deepEqual(lookups, [["cover.jpg", "notes/project/note.md"]]);
});

test("resolves HTML media paths with hash fragments from the current note", () => {
  const { renderer, lookups } = createRenderer();

  const html = renderer.preprocessHtmlContent(
    '<video poster="cover.jpg#preview"></video>',
    "notes/project/note.md"
  );

  assert.equal(
    html,
    '<video poster="app://notes/project/cover.jpg"></video>'
  );
  assert.deepEqual(lookups, [["cover.jpg", "notes/project/note.md"]]);
});
