/**
 * Extracts translations from src/lib/i18n.ts → _locales/{lang}/{namespace}.json
 * for use with react-i18next.
 *
 * Handles:
 *  - Plain strings
 *  - Simple arrow-function templates  → i18next {{variable}} interpolation
 *  - Outer ternary plurals  (n > 1 ? plural : singular)  → _one / _other keys
 *  - Two-param ternary (h > 0 ? hm_template : m_template)  → _hm / _m keys
 *  - Multi-line getDailyLimit-style functions              → _hm / _m keys
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const LOCALES = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'];
const NAMESPACES = ['common', 'sidebar', 'popup', 'auth', 'blocked', 'analytics', 'blockLists', 'profiles', 'strictMode', 'account', 'pricing'];

// ---------------------------------------------------------------------------
// 1. Read & extract translations block
// ---------------------------------------------------------------------------
const raw = readFileSync(join(ROOT, 'src/lib/i18n.ts'), 'utf-8');
const startMarker = 'const translations = {';
const startIdx = raw.indexOf(startMarker);
if (startIdx === -1) throw new Error('Cannot find "const translations = {"');

let depth = 0, endIdx = -1;
for (let i = startIdx + startMarker.length - 1; i < raw.length; i++) {
  if (raw[i] === '{') depth++;
  else if (raw[i] === '}') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
}
if (endIdx === -1) throw new Error('Could not find end of translations object');
let block = raw.slice(startIdx + startMarker.length - 1, endIdx);

// ---------------------------------------------------------------------------
// 2. Strip TypeScript type annotations from arrow-function params
// ---------------------------------------------------------------------------
block = block.replace(/\(([^)]+)\)\s*=>/g, (match, params) => {
  if (!params.includes(':')) return match;
  const stripped = params
    .split(',')
    .map(p => p.replace(/\s*:\s*[^,)]+/, '').trim())
    .join(', ');
  return `(${stripped}) =>`;
});

// Quote reserved-word property keys
const RESERVED = new Set([
  'continue', 'delete', 'switch', 'class', 'for', 'while', 'return', 'new',
  'in', 'throw', 'try', 'catch', 'finally', 'void', 'break', 'case', 'const',
  'let', 'var', 'do', 'else', 'export', 'import', 'if', 'this', 'typeof',
  'instanceof', 'default', 'function', 'yield', 'debugger', 'with', 'super',
  'extends', 'enum', 'static', 'implements', 'interface', 'package', 'private',
  'protected', 'public', 'abstract', 'from', 'of', 'async', 'await',
]);
block = block.split('\n').map(line =>
  line.replace(/^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/, (m, sp, key, col) =>
    RESERVED.has(key) ? `${sp}"${key}"${col}` : m)
).join('\n');

// ---------------------------------------------------------------------------
// 3. Evaluate
// ---------------------------------------------------------------------------
const ctx = {};
vm.runInNewContext(`result = ${block}`, ctx);
const translations = ctx.result;

// ---------------------------------------------------------------------------
// 4. Convert a translation value → JSON entries
//    Returns an array of [key, value] pairs (may be more than one for plural/hm)
// ---------------------------------------------------------------------------
function toEntries(key, value) {
  if (typeof value === 'string') return [[key, value]];
  if (typeof value !== 'function') return [[key, String(value)]];

  const src = value.toString();
  const paramMatch = src.match(/^\s*\(([^)]*)\)/);
  const params = paramMatch
    ? paramMatch[1].split(',').map(p => p.trim()).filter(Boolean)
    : [];

  // ── A) Simple outer ternary pluralization:
  //      (n) => n > 1 ? `${n} items` : `${n} item`
  //   or (count) => count > 1 ? `${count} sites` : `${count} site`
  // We only match single-param outer ternaries on a single line
  const outerTernary = src.match(/=>\s*\w+\s*>\s*\d+\s*\?\s*`([^`]+)`\s*:\s*`([^`]+)`\s*$/s);
  if (outerTernary && params.length === 1) {
    const p = params[0];
    const plural   = outerTernary[1].replace(/\$\{[^}]+\}/g, `{{${p}}}`);
    const singular = outerTernary[2].replace(/\$\{[^}]+\}/g, `{{${p}}}`);
    return [
      [`${key}_one`,   singular],
      [`${key}_other`, plural],
    ];
  }

  // ── B) Two-param outer ternary on first param > 0:
  //      (h, m) => h > 0 ? `${h}h ${m}min / ...` : `${m}min / ...`
  const twoParamTernary = src.match(/=>\s*\w+\s*>\s*\d+\s*\?\s*`([^`]+)`\s*:\s*`([^`]+)`\s*$/s);
  if (twoParamTernary && params.length === 2) {
    const [p0, p1] = params;
    const tmplHM = twoParamTernary[1]
      .replace(new RegExp(`\\$\\{${p0}\\}`, 'g'), `{{${p0}}}`)
      .replace(new RegExp(`\\$\\{${p1}\\}`, 'g'), `{{${p1}}}`);
    const tmplM = twoParamTernary[2]
      .replace(new RegExp(`\\$\\{${p0}\\}`, 'g'), `{{${p0}}}`)
      .replace(new RegExp(`\\$\\{${p1}\\}`, 'g'), `{{${p1}}}`);
    return [
      [`${key}_hm`, tmplHM],
      [`${key}_m`,  tmplM],
    ];
  }

  // ── C) Multi-line getDailyLimit / getWeeklyLimit style:
  //      function body contains `h > 0 ? \`hm\` : \`m\``
  const bodyHMTernary = src.match(/\bh\s*>\s*0\s*\?\s*`([^`]+)`\s*:\s*`([^`]+)`/);
  if (bodyHMTernary) {
    const tmplHM = bodyHMTernary[1]
      .replace(/\$\{h\}/g, '{{h}}')
      .replace(/\$\{m\}/g, '{{m}}');
    const tmplM = bodyHMTernary[2]
      .replace(/\$\{h\}/g, '{{h}}')
      .replace(/\$\{m\}/g, '{{m}}');
    return [
      [`${key}_hm`, tmplHM],
      [`${key}_m`,  tmplM],
    ];
  }

  // ── D) Default: sentinel substitution
  if (params.length === 0) {
    try { return [[key, String(value())]]; } catch { return [[key, key]]; }
  }

  const sentinels = params.map(p => `__SENTINEL_${p.toUpperCase()}__`);
  let result;
  try { result = String(value(...sentinels)); } catch { return [[key, key]]; }
  params.forEach((p, i) => {
    result = result.split(sentinels[i]).join(`{{${p}}}`);
  });
  return [[key, result]];
}

// ---------------------------------------------------------------------------
// 5. Write JSON files
// ---------------------------------------------------------------------------
let total = 0, warnings = 0;

for (const ns of NAMESPACES) {
  const nsData = translations[ns];
  if (!nsData) { console.warn(`⚠  Namespace "${ns}" not found`); warnings++; continue; }

  for (const locale of LOCALES) {
    const localeData = nsData[locale];
    if (!localeData) { console.warn(`⚠  "${locale}" missing in "${ns}"`); warnings++; continue; }

    const json = {};
    for (const [key, val] of Object.entries(localeData)) {
      for (const [k, v] of toEntries(key, val)) {
        json[k] = v;
      }
    }

    const dir = join(ROOT, '_locales', locale);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${ns}.json`), JSON.stringify(json, null, 2), 'utf-8');
    total++;
  }
}

console.log(`✓ Generated ${total} translation files  (${warnings} warnings)`);
