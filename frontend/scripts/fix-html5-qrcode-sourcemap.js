const fs = require("fs");
const path = require("path");

const targetDir = path.join(__dirname, "..", "node_modules", "html5-qrcode");

function walk(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".js")) {
      continue;
    }

    const original = fs.readFileSync(fullPath, "utf8");
    const cleaned = original
      .split(/\r?\n/)
      .filter((line) => !line.startsWith("//# sourceMappingURL="))
      .join("\n");

    if (cleaned !== original) {
      fs.writeFileSync(fullPath, cleaned, "utf8");
    }
  }
}

walk(targetDir);
console.log("html5-qrcode source map references cleaned.");
