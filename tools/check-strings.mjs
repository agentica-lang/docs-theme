// The interface strings of the example site. Usage: node tools/check-strings.mjs LANG BUILD_DIR
// LANG is the locale of the build. "en": each listed English phrase is in the built pages. Any other locale: each
// English phrase is gone, its translation (i18n/LANG.toml) is in, and no value is left as English by mistake.
// Also checked, for every locale: each key of en.toml has a value in i18n/es.toml, the keys the scripts ask for are
// the keys of the theme-strings block, and the English of the version selector is the English of en.toml.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const [lang, build] = process.argv.slice(2);
if (!lang || !build) {
  console.error("usage: node tools/check-strings.mjs LANG BUILD_DIR");
  process.exit(2);
}

// The phrases of each page, by key. A value with a placeholder is checked by the text around it.
const PAGES = {
  "index.html": ["skip_content", "skip_navigation", "menu", "search_label", "search_help", "copy_page", "view_source", "open_chatgpt", "open_claude", "more_page_actions", "switch_dark", "all_releases", "page_source"],
  "404.html": ["error_404_title", "not_found_title", "not_found_text", "not_found_search", "not_found_list"],
  "llms.txt": ["llms_intro", "llms_version_repo"],
  "guide/index.html": ["next", "pager_nav"],
  "guide/code/index.html": ["previous", "output", "input", "prompt", "does_not_compile", "copy_code", "copy_input", "copy_prompt"],
  "blog/index.html": ["breadcrumb", "home"],
};
// Values that stay the same in Spanish on purpose (a term that stays, or a product name).
const SAME_IN_SPANISH = new Set(["release_version", "prompt"]);
const MIN_FRAGMENT = 4;

const failures = [];
const fail = (message) => failures.push(message);

function strings(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = /^(\w+) = "(.*)"$/.exec(line);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

const english = strings("i18n/en.toml");
const spanish = strings("i18n/es.toml");
const translated = lang === "en" ? english : strings(`i18n/${lang}.toml`);
// The strings of the locale: a key with no value in its i18n file falls back to English, as the theme does.
const shown = (key) => translated[key] || english[key];

for (const key of Object.keys(english)) {
  if (!spanish[key]) fail(`i18n/es.toml has no value for ${key}`);
}

// The text of a value that the page shows: whole when it has no placeholder, else the parts between placeholders.
// A part that starts or ends with a letter matches a whole word, so "Breadcrumb" is not found in "BreadcrumbList".
const fragments = (value) => {
  if (!/\{\w+\}/.test(value)) return [value];
  return value.split(/\{\w+\}/).map((part) => part.trim()).filter((part) => part.length >= MIN_FRAGMENT);
};

for (const [page, keys] of Object.entries(PAGES)) {
  const html = readFileSync(join(build, page), "utf8");
  for (const key of keys) {
    if (!(key in english)) {
      fail(`${page}: ${key} is not a key of en.toml`);
      continue;
    }
    const has = (part) => {
      const edge = (char, side) => (/\w/.test(char) ? side : "");
      const body = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`${edge(part[0], "(?<!\\w)")}${body}${edge(part.at(-1), "(?!\\w)")}`).test(html);
    };
    if (lang === "en") {
      for (const part of fragments(english[key])) if (!has(part)) fail(`${page}: English "${part}" (${key}) is missing`);
      continue;
    }
    if (shown(key) === english[key] && !SAME_IN_SPANISH.has(key)) {
      fail(`${key}: the ${lang} value is the English one; translate it or list it in SAME_IN_SPANISH`);
      continue;
    }
    if (shown(key) === english[key]) continue;
    const kept = fragments(shown(key));
    for (const part of fragments(english[key])) {
      if (!kept.includes(part) && has(part)) fail(`${page}: English "${part}" (${key}) is still there`);
    }
    for (const part of kept) if (!has(part)) fail(`${page}: "${part}" (${key}) is not there`);
  }
}

if (lang !== "en") {
  const html = readFileSync(join(build, "index.html"), "utf8");
  if (!new RegExp(`<html lang="?${lang}"?>`).test(html)) fail(`index.html: <html lang> is not ${lang}`);
}

// The keys the scripts ask for, against the list the block is written from.
const blockKeys = [...readFileSync("layouts/_partials/theme-strings.html", "utf8").matchAll(/^\s+((?:"\w+"\s*)+)/gm)]
  .flatMap((match) => [...match[1].matchAll(/"(\w+)"/g)].map((m) => m[1]));
const asked = new Set();
for (const file of ["assets/js/copy.js", "assets/js/page-actions.js", "assets/js/share.js", "assets/js/theme.js", "assets/js/search.js", "assets/versions/selector.js"]) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/\bt\("(\w+)"\)/g)) asked.add(match[1]);
  if (/\bt\(`copy_\$\{/.test(source)) for (const kind of ["code", "prompt", "input", "signature"]) asked.add(`copy_${kind}`);
}
for (const key of asked) {
  if (!blockKeys.includes(key)) fail(`theme-strings has no ${key}, which a script asks for`);
  if (!(key in english)) fail(`en.toml has no ${key}, which a script asks for`);
}

// The English the version selector keeps for a page with no block: it must be the English of en.toml.
const selector = readFileSync("assets/versions/selector.js", "utf8");
const fallback = /var English = \{([\s\S]*?)\};/.exec(selector);
if (!fallback) fail("assets/versions/selector.js has no English fallback");
else {
  for (const match of fallback[1].matchAll(/(\w+): "(.*?)"/g)) {
    if (english[match[1]] !== match[2]) fail(`selector.js English ${match[1]} is not the value of en.toml`);
  }
}

for (const failure of failures) console.error(failure);
if (failures.length) process.exit(1);
console.log(`check-strings: ${lang} strings of ${build} pass`);
