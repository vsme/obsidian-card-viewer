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
  const vaultLookups = [];
  let linkDestination = null;
  let metadataLookups = 0;
  const app = {
    metadataCache: {
      getFirstLinkpathDest: () => {
        metadataLookups += 1;
        return linkDestination;
      },
    },
    vault: {
      getAbstractFileByPath: (path) => {
        vaultLookups.push(path);
        return files.get(path) ?? null;
      },
      getResourcePath: (file) => `app://${file.path}`,
    },
  };

  return {
    app,
    addFile(path) {
      const file = { isTFile: true, path };
      files.set(path, file);
      return file;
    },
    setLinkDestination(file) {
      linkDestination = file;
    },
    get metadataLookups() {
      return metadataLookups;
    },
    vaultLookups,
  };
}

test("uses the original vault path when it exists", () => {
  const fixture = createFixture();
  fixture.addFile("attachments/cover.jpg");
  fixture.addFile("site/attachments/cover.jpg");
  fixture.setLinkDestination(fixture.addFile("other/attachments/cover.jpg"));
  const processor = new ImagePathProcessor(fixture.app, () => ({
    localImagePathPrefix: "site",
  }));

  assert.equal(
    processor.processImagePath(
      "attachments/cover.jpg",
      "notes/example.md"
    ),
    "app://attachments/cover.jpg"
  );
});

test("falls back to the configured prefix when the original path is missing", () => {
  const fixture = createFixture();
  fixture.addFile("site/attachments/cover.jpg");
  fixture.setLinkDestination(fixture.addFile("other/attachments/cover.jpg"));
  const processor = new ImagePathProcessor(fixture.app, () => ({
    localImagePathPrefix: "site",
  }));

  assert.equal(
    processor.processImagePath(
      "attachments/cover.jpg",
      "notes/example.md"
    ),
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

test("does not inspect app resource URLs", () => {
  const fixture = createFixture();
  const processor = new ImagePathProcessor(fixture.app, () => ({
    localImagePathPrefix: "site",
  }));
  const resourceUrl = "app://obsidian.md/vault/attachments/cover.jpg";

  assert.equal(
    processor.processImagePath(resourceUrl, "notes/example.md"),
    resourceUrl
  );
  assert.equal(fixture.metadataLookups, 0);
  assert.deepEqual(fixture.vaultLookups, []);
});

test("preserves metadata link resolution when the prefix is empty", () => {
  const fixture = createFixture();
  fixture.setLinkDestination(fixture.addFile("media/cover.jpg"));
  const processor = new ImagePathProcessor(fixture.app);

  assert.equal(
    processor.processImagePath("cover.jpg", "notes/example.md"),
    "app://media/cover.jpg"
  );
});
