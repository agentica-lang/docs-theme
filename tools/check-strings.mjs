// The interface strings of a built example site. Usage: node tools/check-strings.mjs LANG BUILD_DIR
// LANG is the locale of the build. "en": each listed English phrase is in the built page. Any other locale: each
// English phrase is gone, its translation (i18n/LANG.toml) is in, and every key of en.toml has a translation.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const [lang, build] = process.argv.slice(2);
if (!lang || !build) {
  console.error("usage: node tools/check-strings.mjs LANG BUILD_DIR");
  process.exit(2);
}

// The phrases each page shows, by key. Keys with a placeholder are checked by the text around it.
const PAGES = {
  "index.html": ["skip_content", "skip_navigation", "search_label", "search_help", "copy_page", "view_source", "open_chatgpt", "open_claude", "switch_dark", "more_page_actions", "all_releases", "page_source"],
  "404.html": ["error_404_title", "not_found_title", "not_found_text", "not_found_search", "not_found_list"],
  "llms.txt": ["llms_intro", "llms_version_repo"],
};
const MIN_FRAGMENT = 8;

function strings(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = /^(\w+) = "(.*)"$/.exec(line);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

const failures = [];
const english = strings("i18n/en.toml");
const translated = lang === "en" ? english : strings(`i18n/${lang}.toml`);

if (lang !== "en") {
  for (const key of Object.keys(english)) {
    if (!translated[key]) failures.push(`i18n/${lang}.toml has no value for ${key}`);
  }
}

// The text between placeholders, long enough to be a phrase of its own.
const fragments = (value) => value.split(/\{\w+\}/).map((part) => part.trim()).filter((part) => part.length >= MIN_FRAGMENT);

for (const [page, keys] of Object.entries(PAGES)) {
  const html = readFileSync(join(build, page), "utf8");
  for (const key of keys) {
    if (lang === "en") {
      for (const part of fragments(english[key])) if (!html.includes(part)) failures.push(`${page}: English "${part}" (${key}) is missing`);
      continue;
    }
    if (translated[key] === english[key]) continue;
    const kept = fragments(translated[key]);
    for (const part of fragments(english[key])) if (!kept.includes(part) && html.includes(part)) failures.push(`${page}: English "${part}" (${key}) is still there`);
    for (const part of kept) if (!html.includes(part)) failures.push(`${page}: "${part}" (${key}) is not there`);
  }
}

if (lang !== "en") {
  const html = readFileSync(join(build, "index.html"), "utf8");
  if (!new RegExp(`<html lang="?${lang}"?>`).test(html)) failures.push(`index.html: <html lang> is not ${lang}`);
}

for (const failure of failures) console.error(failure);
if (failures.length) process.exit(1);
console.log(`check-strings: ${lang} strings of ${build} pass`);
