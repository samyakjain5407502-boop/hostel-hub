/**
 * i18n consistency check — run with `npm run i18n:check`.
 *
 * Verifies that:
 *   1. no dictionary file declares the same key twice (silent-overwrite bug),
 *   2. every locale implements the full English key set (no English leaking
 *      into Hindi / Hinglish at runtime),
 *   3. both locales stay in sync when a new key is added.
 *
 * Exit code 1 on any failure so it can gate CI.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'src', 'i18n');
const KEY_RE = /^\s{2}'([^']+)':/gm;

function readKeys(file) {
  const src = readFileSync(join(DIR, file), 'utf8');
  return [...src.matchAll(KEY_RE)].map((m) => m[1]);
}

function group(prefixes) {
  const keys = [];
  const duplicates = [];
  for (const file of prefixes) {
    for (const key of readKeys(file)) {
      if (keys.includes(key)) duplicates.push({ key, file });
      else keys.push(key);
    }
  }
  return { keys, duplicates };
}

const locales = {
  en: ['en.ts', 'en2.ts', 'en3.ts', 'en4.ts', 'en5.ts'],
  hi: ['hi.ts', 'hi2.ts', 'hi3.ts', 'hi4.ts', 'hi5.ts'],
  hinglish: ['hinglish.ts', 'hinglish2.ts', 'hinglish3.ts', 'hinglish4.ts', 'hinglish5.ts']
};

let failed = false;

// Sanity: every declared file must exist.
for (const files of Object.values(locales)) {
  for (const f of files) {
    try {
      readFileSync(join(DIR, f), 'utf8');
    } catch {
      console.error(`✖ missing dictionary file: src/i18n/${f}`);
      failed = true;
    }
  }
}

const resolved = Object.fromEntries(
  Object.entries(locales).map(([lang, files]) => [lang, group(files)])
);

for (const [lang, { keys, duplicates }] of Object.entries(resolved)) {
  if (duplicates.length) {
    failed = true;
    console.error(`✖ ${lang}: ${duplicates.length} duplicate key(s)`);
    for (const d of duplicates) console.error(`   · "${d.key}" re-declared in ${d.file}`);
  } else {
    console.log(`✔ ${lang}: ${keys.length} unique keys`);
  }
}

const base = resolved.en.keys;
for (const [lang, { keys }] of Object.entries(resolved)) {
  if (lang === 'en') continue;
  const missing = base.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !base.includes(k));
  if (missing.length) {
    failed = true;
    console.error(`✖ ${lang}: missing ${missing.length} key(s) → ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ' …' : ''}`);
  }
  if (extra.length) {
    failed = true;
    console.error(`✖ ${lang}: ${extra.length} key(s) not present in en → ${extra.slice(0, 12).join(', ')}${extra.length > 12 ? ' …' : ''}`);
  }
  if (!missing.length && !extra.length) console.log(`✔ ${lang}: fully in sync with en`);
}

// Catch unreadable dictionaries in the barrel files list.
const barrels = readdirSync(DIR).filter((f) => /^[a-z0-9]+\.ts$/.test(f));
for (const f of barrels) {
  if (!Object.values(locales).flat().includes(f)) {
    failed = true;
    console.error(`✖ src/i18n/${f} is not registered in scripts/check-i18n.mjs or the locale barrel`);
  }
}

if (failed) {
  console.error('\ni18n check failed.');
  process.exit(1);
}
console.log('\ni18n check passed — all locales complete.');
