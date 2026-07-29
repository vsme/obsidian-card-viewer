import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

const buildResult = await build({
  entryPoints: ["src/renderers/imgsRenderer.ts"],
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
              export class Modal {}
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
const { ImgsRendererImpl } = await import(moduleUrl);

function createElement(tagName) {
  return {
    tagName,
    children: [],
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    addEventListener() {},
    classList: { add() {} },
  };
}

test("resolves image grid paths from the current note", async () => {
  const elements = [];
  globalThis.document = {
    createElement(tagName) {
      const element = createElement(tagName);
      elements.push(element);
      return element;
    },
  };

  const lookups = [];
  const file = { isTFile: true, path: "notes/project/cover.jpg" };
  const app = {
    metadataCache: {
      getFirstLinkpathDest: (path, sourcePath) => {
        lookups.push([path, sourcePath]);
        return file;
      },
    },
    vault: {
      getAbstractFileByPath: () => null,
      getResourcePath: (resolvedFile) => `app://${resolvedFile.path}`,
    },
  };
  const renderer = new ImgsRendererImpl(app, () => ({
    localImagePathPrefix: "",
  }));

  await renderer.renderImgsGrid(
    "![cover](./cover.jpg)",
    createElement("root"),
    { sourcePath: "notes/project/note.md" }
  );

  assert.deepEqual(lookups, [["./cover.jpg", "notes/project/note.md"]]);
  assert.equal(
    elements.find((element) => element.tagName === "img")?.src,
    "app://notes/project/cover.jpg"
  );
});
