// Checks the version selector's paths without a browser (make example): node tools/check-selector.mjs
// It runs assets/versions/selector.js against stubs of the page, the storage and fetch, and checks where a switch of
// version goes and where the "view in latest" link points, for an English page and a Spanish one under a version.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../assets/versions/selector.js"), "utf8");
const origin = "https://agentica-lang.github.io";
const root = `${origin}/docs-theme/`;
const versions = [
  { version: "dev", path: "dev/" },
  { version: "0.1.0", path: "0.1.0/", latest: true, languages: ["es"] },
  { version: "0.0.9", path: "0.0.9/", languages: [] },
];

class Element {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attrs = {};
    this.listeners = {};
    this.parentNode = null;
    this.classList = { toggle() {}, add() {}, contains: () => false };
    this.textContent = "";
    this.hidden = false;
  }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  insertBefore(child) { return this.appendChild(child); }
  append(...items) { for (const item of items) if (typeof item !== "string") this.appendChild(item); }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  focus() {}
  getClientRects() { return [1]; }
}

// Runs the selector on a page: `pathname` under the root, `lang` of the page, the pages that exist (absolute URLs) and
// the stored pick. Returns what the selector made of it.
async function run({ pathname, lang, exists = [], stored = "" }) {
  const created = [];
  const assigned = [];
  const existing = new Set(exists);
  const storage = new Map(stored ? [["docs-lang", stored]] : []);
  const ok = (value) => Promise.resolve(value);
  const fetch = (url, options) => {
    if (options && options.method === "HEAD") return ok({ ok: existing.has(url) });
    return ok({ json: () => ok(versions) });
  };
  const body = new Element("body");
  const document = {
    currentScript: { src: `${root}_versions/selector.js` },
    documentElement: { lang, classList: { contains: () => false, add() {} } },
    body,
    activeElement: null,
    getElementById: () => null,
    querySelector: () => null,
    createElement(tag) {
      const element = new Element(tag);
      created.push(element);
      return element;
    },
  };
  const sandbox = {
    document,
    location: { pathname, hash: "", assign: (href) => assigned.push(href) },
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => storage.set(key, String(value)),
    },
    window: {
      fetch,
      URL,
      matchMedia: () => ({ matches: false, addEventListener() {} }),
      addEventListener() {},
    },
    fetch,
    URL,
  };
  vm.runInNewContext(source, sandbox);
  await new Promise((resolve) => setTimeout(resolve, 10));
  const select = created.find((element) => element.className === "version-select");
  const link = created.find((element) => element.tagName === "A");
  return {
    select,
    switchTo(version) {
      select.value = version;
      select.children.forEach((option) => { option.selected = option.value === version; });
      select.listeners.change[0]();
      return new Promise((resolve) => setTimeout(() => resolve(assigned[0]), 10));
    },
    latestLink: link && link.href,
  };
}

const results = [];
const check = (name, actual, wanted) => {
  const ok = actual === wanted;
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` (got ${actual}, wanted ${wanted})`}`);
};

// A Spanish page of the dev version: the latest has it, the English-only version shows its English page.
{
  const page = { pathname: "/docs-theme/dev/es/x/", lang: "es", exists: [`${origin}/docs-theme/es/x/`] };
  const selector = await run(page);
  check("the view-in-latest link of a Spanish dev page is the Spanish latest page", selector.latestLink, `${origin}/docs-theme/es/x/`);
  check("the view-in-latest link falls back to the English page when there is no Spanish one",
    (await run({ ...page, exists: [`${origin}/docs-theme/x/`] })).latestLink, `${origin}/docs-theme/x/`);
  check("the view-in-latest link is the latest home when no copy of the page exists",
    (await run({ ...page, exists: [] })).latestLink, `${origin}/docs-theme/`);
  check("a Spanish dev page to an English-only version goes to its English page",
    await (await run({ ...page, exists: [`${origin}/docs-theme/0.0.9/x/`] })).switchTo("0.0.9"), `${origin}/docs-theme/0.0.9/x/`);
  check("a Spanish dev page to an English-only version with no page goes to its home",
    await (await run(page)).switchTo("0.0.9"), `${origin}/docs-theme/0.0.9/`);
  check("a Spanish dev page to the latest goes to the Spanish page there",
    await (await run(page)).switchTo("0.1.0"), `${origin}/docs-theme/es/x/`);
  check("a Spanish dev page to the latest with no Spanish page goes to the English page",
    await (await run({ ...page, exists: [`${origin}/docs-theme/x/`] })).switchTo("0.1.0"), `${origin}/docs-theme/x/`);
}

// The root is the latest release: a Spanish page at the root is the latest, not an unknown version.
{
  const selector = await run({ pathname: "/docs-theme/es/x/", lang: "es", exists: [`${origin}/docs-theme/0.0.9/x/`] });
  const picked = selector.select.children.find((option) => option.selected);
  check("a Spanish page at the root is found in the latest version", picked && picked.value, "0.1.0");
  check("a Spanish page at the root switches to an English-only version's page",
    await selector.switchTo("0.0.9"), `${origin}/docs-theme/0.0.9/x/`);
}

// An English page with a stored Spanish pick goes to the Spanish page of the latest version.
{
  const selector = await run({
    pathname: "/docs-theme/guide/code/",
    lang: "en",
    stored: "es",
    exists: [`${origin}/docs-theme/es/guide/code/`],
  });
  check("a stored pick of es moves the version switch to the Spanish page", await selector.switchTo("0.1.0"), `${origin}/docs-theme/es/guide/code/`);
}

const failed = results.filter((ok) => !ok).length;
console.log(`check-selector: ${results.length - failed} of ${results.length} pass`);
process.exit(failed ? 1 : 0);
