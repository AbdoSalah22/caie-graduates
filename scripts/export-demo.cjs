/**
 * Export Firestore data into static JSON files for the /demo route.
 *
 * Reads companies, submissions and settings straight from Firestore via the
 * public REST API (no Admin SDK, no new dependencies) and writes:
 *
 *   public/demo-data/companies.json
 *   public/demo-data/submissions.json
 *   public/demo-data/settings.json
 *   public/demo-data/meta.json
 *   public/demo-data/logos/*          (company logos downloaded as local files)
 *
 * Logo URLs are rewritten to the local files so the exported JSON never ships
 * external logo.dev / Firebase Storage tokens.
 *
 * Usage:
 *   npm run export-demo
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "demo-data");
const LOGO_DIR = path.join(OUT_DIR, "logos");

const PAGE_SIZE = 300;
const MAX_DOCS = Number(process.env.DEMO_EXPORT_MAX || 3000);

// ── Env ────────────────────────────────────────────────────────────────────

function parseEnvFile(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

const env = parseEnvFile(path.join(ROOT, ".env.local"));

function getVar(name) {
  return process.env[name] || env[name] || "";
}

const projectId = getVar("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
const apiKey = getVar("NEXT_PUBLIC_FIREBASE_API_KEY");

if (!projectId || !apiKey) {
  console.error(
    "Missing Firebase config. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID and\n" +
      "NEXT_PUBLIC_FIREBASE_API_KEY in .env.local (or pass them as env vars).",
  );
  process.exit(1);
}

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)`;

// ── Firestore REST helpers ─────────────────────────────────────────────────

function decodeValue(value) {
  if (value === null || value === undefined) return null;
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("referenceValue" in value) return value.referenceValue;
  if ("bytesValue" in value) return value.bytesValue;
  if ("arrayValue" in value)
    return (value.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in value) return decodeFields(value.mapValue.fields || {});
  return null;
}

function decodeFields(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields || {})) {
    out[key] = decodeValue(value);
  }
  return out;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

async function fetchCollection(collectionName) {
  const docs = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      key: apiKey,
      pageSize: String(PAGE_SIZE),
    });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await fetchJson(
      `${BASE_URL}/documents/${collectionName}?${params.toString()}`,
    );

    for (const doc of data.documents || []) {
      docs.push({
        id: doc.name.split("/").pop(),
        ...decodeFields(doc.fields || {}),
      });
    }

    pageToken = data.nextPageToken || "";

    if (docs.length >= MAX_DOCS) {
      console.warn(
        `⚠  Stopped at ${MAX_DOCS} docs for "${collectionName}" (DEMO_EXPORT_MAX=${MAX_DOCS}).`,
      );
      break;
    }
  } while (pageToken);

  console.log(`✓ ${collectionName}: ${docs.length} documents`);
  return docs;
}

async function fetchSettingDoc(docName) {
  try {
    const params = new URLSearchParams({ key: apiKey });
    const data = await fetchJson(
      `${BASE_URL}/documents/settings/${docName}?${params.toString()}`,
    );
    return decodeFields(data.fields || {});
  } catch {
    return {};
  }
}

// ── Logo download ─────────────────────────────────────────────────────────

const EXT_BY_CONTENT_TYPE = {
  "image/svg+xml": ".svg",
  "image/svg": ".svg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/gif": ".gif",
};

function extFromUrl(url) {
  const match = url.match(/\.(png|jpe?g|webp|svg|gif)(\?|#|$)/i);
  return match ? `.${match[1].toLowerCase()}` : "";
}

async function downloadLogo(companyId, logoUrl) {
  const res = await fetch(logoUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  let ext = "";
  for (const [type, e] of Object.entries(EXT_BY_CONTENT_TYPE)) {
    if (contentType.startsWith(type)) {
      ext = e;
      break;
    }
  }
  if (!ext) ext = extFromUrl(logoUrl);
  if (!ext) ext = ".png";

  const fileName = encodeURIComponent(companyId) + ext;
  fs.writeFileSync(path.join(LOGO_DIR, fileName), buffer);
  return `/demo-data/logos/${fileName}`;
}

function snakeToCamel(value) {
  return typeof value === "string"
    ? value.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    : value;
}

/** True for root-relative paths like "/logos/alinma.png". */
function isRelativeLogoUrl(url) {
  return typeof url === "string" && /^\/[^/]/.test(url) && !/^\/\//.test(url);
}

/** Copy a root-relative public file (e.g. /logos/alinma.png) into demo-data/logos. */
function copyLocalLogo(relativeUrl) {
  const relPath = relativeUrl.replace(/^\//, "");
  const source = path.join(ROOT, "public", relPath);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
    throw new Error(`local file not found: ${relativeUrl}`);
  }
  const fileName = path.basename(relPath);
  fs.copyFileSync(source, path.join(LOGO_DIR, fileName));
  return `/demo-data/logos/${fileName}`;
}

async function exportCompanies() {
  const companies = await fetchCollection("companies");

  for (const company of companies) {
    // Normalize field names (e.g. square_color -> squareColor).
    for (const key of Object.keys(company)) {
      const camel = snakeToCamel(key);
      if (camel !== key) {
        company[camel] = company[key];
        delete company[key];
      }
    }

    if (!company.logoUrl) continue;

    try {
      if (isRelativeLogoUrl(company.logoUrl)) {
        company.logoUrl = copyLocalLogo(company.logoUrl);
      } else {
        company.logoUrl = await downloadLogo(company.id, company.logoUrl);
      }
    } catch (err) {
      // Never ship an external token URL in exported data; drop it instead.
      console.warn(
        `⚠  Dropping logo for "${company.id}" (download failed: ${err.message}).`,
      );
      delete company.logoUrl;
    }
  }

  const output = fs
    .readdirSync(LOGO_DIR)
    .filter((f) => fs.statSync(path.join(LOGO_DIR, f)).isFile()).length;
  console.log(`✓ logos downloaded locally: ${output}`);

  return companies;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Exporting demo data from project "${projectId}"...`);
  fs.mkdirSync(LOGO_DIR, { recursive: true });

  // Start with a clean logo folder so removals never linger in the snapshot.
  for (const file of fs.readdirSync(LOGO_DIR)) {
    fs.unlinkSync(path.join(LOGO_DIR, file));
  }

  const companies = await exportCompanies();
  const submissions = await fetchCollection("submissions");
  const settings = await fetchSettingDoc("home");

  // Keep only the fields the app actually uses, in a stable shape.
  const cleanSubmissions = submissions.map((s) => {
    const out = {
      id: s.id,
    };
    for (const key of [
      "name",
      "title",
      "linkedin",
      "company",
      "portfolioCv",
      "graduationClass",
      "userId",
      "timestamp",
    ]) {
      if (s[key] !== undefined && s[key] !== null) out[key] = s[key];
    }
    return out;
  });

  const files = {
    "companies.json": { companies },
    "submissions.json": { submissions: cleanSubmissions },
    "settings.json": { settings },
    "meta.json": {
      exportedAt: new Date().toISOString(),
      projectId,
      counts: {
        companies: companies.length,
        submissions: cleanSubmissions.length,
      },
    },
  };

  for (const [fileName, payload] of Object.entries(files)) {
    fs.writeFileSync(
      path.join(OUT_DIR, fileName),
      JSON.stringify(payload, null, 2) + "\n",
    );
    console.log(`✓ wrote public/demo-data/${fileName}`);
  }

  console.log("\nDone! /demo now serves the exported snapshot.");
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});