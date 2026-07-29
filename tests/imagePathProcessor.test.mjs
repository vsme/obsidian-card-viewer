import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

const buildResult = await build({
  entryPoints: ["src/utils/imagePathProcessor.ts"],
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
const { ImagePathProcessor } = await import(moduleUrl);

function createFixture() {
  const files = new Map();
  const app = {
    metadataCache: {
      getFirstLinkpathDest: () => null,
    },
    vault: {
      getAbstractFileByPath: (path) => files.get(path) ?? null,
      getResourcePath: (file) => `app://${file.path}`,
    },
  };

  return {
    app,
    addFile(path) {
      files.set(path, { isTFile: true, path });
    },
  };
}

test("uses the original vault path when it exists", () => {
  const fixture = createFixture();
  fixture.addFile("attachments/cover.jpg");
  fixture.addFile("site/attachments/cover.jpg");
  const processor = new ImagePathProcessor(fixture.app, () => ({
    localImagePathPrefix: "site",
  }));

  assert.equal(
    processor.processImagePath("attachments/cover.jpg"),
    "app://attachments/cover.jpg"
  );
});

test("falls back to the configured prefix when the original path is missing", () => {
  const fixture = createFixture();
  fixture.addFile("site/attachments/cover.jpg");
  const processor = new ImagePathProcessor(fixture.app, () => ({
    localImagePathPrefix: "site",
  }));

  assert.equal(
    processor.processImagePath("attachments/cover.jpg"),
    "app://site/attachments/cover.jpg"
  );
});

test("keeps the original behavior when the prefix is empty", () => {
  const fixture = createFixture();
  fixture.addFile("site/attachments/cover.jpg");
  const processor = new ImagePathProcessor(fixture.app);

  assert.equal(
    processor.processImagePath("attachments/cover.jpg"),
    "attachments/cover.jpg"
  );
});

test("normalizes slashes around the configured prefix", () => {
  const fixture = createFixture();
  fixture.addFile("site/attachments/cover.jpg");
  const processor = new ImagePathProcessor(fixture.app, () => ({
    localImagePathPrefix: "/site/",
  }));

  assert.equal(
    processor.processImagePath("/attachments/cover.jpg"),
    "app://site/attachments/cover.jpg"
  );
});

test("does not rewrite external image URLs", () => {
  const fixture = createFixture();
  const processor = new ImagePathProcessor(fixture.app, () => ({
    localImagePathPrefix: "site",
  }));

  assert.equal(
    processor.processImagePath("https://example.com/cover.jpg"),
    "https://example.com/cover.jpg"
  );
});
