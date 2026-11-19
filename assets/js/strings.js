// The interface strings of a page: the JSON block of baseof.html (theme-strings), else the English here. Hugo writes an
// empty string for a key a language does not translate, so an empty value falls back too.
const ENGLISH = {
  copy: "Copy",
  copy_code: "Copy code",
  copy_prompt: "Copy prompt",
  copy_input: "Copy input",
  copy_signature: "Copy signature",
  copied: "Copied",
  copy_failed: "Copy failed",
  copy_page: "Copy page",
  page_actions: "Page actions",
  copy_link: "Copy link",
  switch_dark: "Switch to dark theme",
  switch_light: "Switch to light theme",
  search_min: "Type a word of at least {n} characters.",
  search_loading: "Loading…",
  search_error: "Search could not load. Type again to retry.",
  search_none: "No results.",
  search_count_one: "1 result",
  search_count_other: "{n} results",
};

let page = {};
try {
  const block = document.getElementById("theme-strings");
  if (block) page = JSON.parse(block.textContent);
} catch (e) {
  // A broken block leaves the English.
}

export function t(key) {
  return page[key] || ENGLISH[key];
}
