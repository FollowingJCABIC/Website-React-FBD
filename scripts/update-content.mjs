import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "src", "content");
const pdfRoot = path.join(root, "public", "pdfs");
const indexFile = path.join(contentDir, "index.js");
const pdfFile = path.join(contentDir, "pdfs.json");

const categories = ["religious", "art", "mathematics", "talk"];

function toTitle(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

async function safeReadDir(dir) {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function updateIndex() {
  const markdownFiles = (await safeReadDir(contentDir))
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  const imports = markdownFiles
    .map((name, idx) => `import entry${idx} from "./${name}?raw";`)
    .join("\n");

  const list = markdownFiles.map((_, idx) => `entry${idx}`).join(",\n  ");
  const output = `${imports}\n\nexport const rawEntries = [\n  ${list}\n];\n`;

  await fs.writeFile(indexFile, output, "utf8");
  return markdownFiles.length;
}

async function updatePdfs() {
  const payload = {};

  for (const category of categories) {
    const folder = path.join(pdfRoot, category);
    const files = (await safeReadDir(folder))
      .filter((name) => name.toLowerCase().endsWith(".pdf"))
      .sort((a, b) => a.localeCompare(b));

    payload[category] = files.map((name) => ({
      id: `${category}-${name.replace(/\.pdf$/i, "")}`,
      title: toTitle(name.replace(/\.pdf$/i, "")),
      size: "",
      url: `/pdfs/${category}/${name}`,
    }));
  }

  await fs.writeFile(pdfFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  await ensureDir(contentDir);
  await ensureDir(pdfRoot);
  for (const category of categories) {
    await ensureDir(path.join(pdfRoot, category));
  }

  const count = await updateIndex();
  await updatePdfs();

  console.log(`Updated content index with ${count} markdown files.`);
  console.log("Updated PDF library from public/pdfs.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
