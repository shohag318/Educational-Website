const fs = require("fs");
const path = require("path");

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory() && e.name !== "node_modules" && e.name !== ".next") walk(p, a);
    else if (/\.(tsx|ts)$/.test(e.name)) a.push(p);
  }
  return a;
}

const files = walk("src");
const lucide = new Set();
const mui = new Map();

for (const f of files) {
  const c = fs.readFileSync(f, "utf8");
  for (const m of c.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g)) {
    m[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((n) => {
        const name = n.replace(/\s+as\s+\w+/, "").trim();
        if (name && !name.startsWith("type ")) lucide.add(name);
      });
  }
  for (const m of c.matchAll(/import\s+(\w+)\s+from\s*['"]@mui\/icons-material\/(\w+)['"]/g)) {
    mui.set(m[1], m[2]);
  }
  if (c.includes("SvgIconComponent")) console.log("SvgIconComponent in", f);
}

fs.writeFileSync(
  "scripts/icon-extract.json",
  JSON.stringify({ lucide: [...lucide].sort(), mui: Object.fromEntries(mui) }, null, 2)
);
console.log("LUCIDE_COUNT", lucide.size);
console.log("MUI_COUNT", mui.size);
