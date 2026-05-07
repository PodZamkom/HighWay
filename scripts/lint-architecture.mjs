import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".js", ".jsx"]);
const IGNORED_DIRS = new Set([".git", ".next", "dist", "node_modules", "runtime"]);

const findings = [];

const PUBLIC_ENTRY_FILES = [
  path.join(ROOT_DIR, "app", "(site)"),
  path.join(ROOT_DIR, "app", "api", "cars", "route.ts"),
  path.join(ROOT_DIR, "app", "robots.ts"),
  path.join(ROOT_DIR, "app", "sitemap.ts"),
];

const ADMIN_API_ROOT = path.join(ROOT_DIR, "app", "api", "admin");
const ADMIN_APP_ROOT = path.join(ROOT_DIR, "app", "admin");
const ADMIN_COMPONENTS_ROOT = path.join(ROOT_DIR, "components", "admin");

const PUBLIC_FORBIDDEN_IMPORTS = [
  "@/app/admin",
  "@/app/api/admin",
  "@/components/admin",
  "@/lib/admin/",
  "@/lib/catalogRepository",
  "@/lib/newsRepository",
  "@/lib/cmsRepository",
  "@/lib/mediaRepository",
  "@/lib/catalog/catalogAdminService",
  "@/lib/news/newsAdminService",
  "@/lib/cms/cmsAdminService",
  "@/lib/media/mediaAdminService",
];

const ADMIN_API_FORBIDDEN_IMPORTS = [
  "@/lib/catalogRepository",
  "@/lib/newsRepository",
  "@/lib/cmsRepository",
  "@/lib/mediaRepository",
  "@/lib/publicSiteService",
  "@/lib/data",
];

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function isCodeFile(filePath) {
  return CODE_EXTENSIONS.has(path.extname(filePath));
}

function isInside(filePath, targetPath) {
  const relative = path.relative(targetPath, filePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isPublicEntryFile(filePath) {
  return PUBLIC_ENTRY_FILES.some((targetPath) => isInside(filePath, targetPath));
}

function isAdminApiFile(filePath) {
  return isInside(filePath, ADMIN_API_ROOT);
}

function isAdminOwnedFile(filePath) {
  return isInside(filePath, ADMIN_API_ROOT) || isInside(filePath, ADMIN_APP_ROOT) || isInside(filePath, ADMIN_COMPONENTS_ROOT);
}

async function walk(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolutePath)));
      continue;
    }

    if (entry.isFile() && isCodeFile(absolutePath)) {
      files.push(absolutePath);
    }
  }

  return files;
}

function collectImports(source) {
  const imports = [];
  const importRegex = /\bfrom\s+["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  let match = importRegex.exec(source);

  while (match) {
    imports.push(match[1] || match[2]);
    match = importRegex.exec(source);
  }

  return imports;
}

function report(filePath, message) {
  findings.push(`${normalizePath(path.relative(ROOT_DIR, filePath))}: ${message}`);
}

async function main() {
  const files = await walk(ROOT_DIR);

  for (const filePath of files) {
    const source = await fs.readFile(filePath, "utf8");
    const imports = collectImports(source);

    if (isPublicEntryFile(filePath)) {
      for (const target of imports) {
        if (PUBLIC_FORBIDDEN_IMPORTS.some((prefix) => target === prefix || target.startsWith(`${prefix}/`))) {
          report(filePath, `public entry must not import "${target}"`);
        }
      }

      if (source.includes("noStore(") || source.includes("unstable_noStore")) {
        report(filePath, "public entry must not use noStore or unstable_noStore");
      }
    }

    if (isAdminApiFile(filePath)) {
      for (const target of imports) {
        if (ADMIN_API_FORBIDDEN_IMPORTS.some((prefix) => target === prefix || target.startsWith(`${prefix}/`))) {
          report(filePath, `admin api must not import "${target}" directly; use domain services`);
        }
      }
    }

    if (!isAdminOwnedFile(filePath)) {
      for (const target of imports) {
        if (target === "@/components/admin" || target.startsWith("@/components/admin/")) {
          report(filePath, `non-admin code must not import admin UI "${target}"`);
        }
      }
    }
  }

  if (findings.length > 0) {
    console.error("[lint:architecture] violations found:");
    for (const finding of findings) {
      console.error(`- ${finding}`);
    }
    process.exit(1);
  }

  console.log("[lint:architecture] OK");
}

await main();
