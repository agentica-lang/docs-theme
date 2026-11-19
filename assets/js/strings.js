// The interface strings of the page, from the theme-strings block that baseof.html writes.
let page = {};
try {
  page = JSON.parse(document.getElementById("theme-strings").textContent);
} catch (e) {
  page = {};
}

export function t(key) {
  return page[key] ?? "";
}
