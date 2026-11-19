// Checks the language redirect and the language select of a built multilingual site, without a browser (make example):
// node tools/check-redirect.mjs DIR DEV_DIR. DIR is the multilingual build, DEV_DIR the same site built at its dev
// version's folder (baseURL `<root>/dev/`). It takes the inline script of a page (the one that holds "docs-lang") and
// runs it with stubs of the referrer, the storage, the browser languages, the navigation type, the select and location.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const [dir, devDir] = process.argv.slice(2);
const origin = "https://agentica-lang.github.io";
const root = `${origin}/docs-theme/`;

function html(folder, file) {
  return readFileSync(join(folder, file), "utf8");
}

function scriptOf(folder, file) {
  const scripts = [...html(folder, file).matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const found = scripts.filter((s) => s.includes("docs-lang"));
  if (found.length !== 1) throw new Error(`${file}: wants one redirect script, found ${found.length}`);
  return found[0];
}

// A select of the page: `options` are { value, pick, defaultSelected }, the first selected by default.
function select(options) {
  const items = options.map((o) => ({
    value: o.value,
    defaultSelected: !!o.defaultSelected,
    getAttribute: (name) => (name === "data-lang-pick" ? o.pick : null),
  }));
  return {
    options: items,
    selectedIndex: Math.max(0, items.findIndex((o) => o.defaultSelected)),
    get value() {
      return items[this.selectedIndex].value;
    },
    matches: (selector) => selector === "select[data-lang-select]",
  };
}

// Runs the page's script. `stored` is the pick, `languages` the browser's, `referrer` the arrival, `navigation` the
// kind of navigation (back_forward for Back), `selects` the page's language selects.
function run(folder, file, { referrer = "", languages = ["en-US"], stored = null, throwGet = false, throwSet = false, navigation = "navigate", selects = [] } = {}) {
  const storage = new Map(stored === null ? [] : [["docs-lang", stored]]);
  const replaced = [];
  const listeners = {};
  const on = (type, fn) => (listeners[type] ??= []).push(fn);
  const sandbox = {
    document: {
      referrer,
      addEventListener: on,
      querySelectorAll: () => selects,
    },
    window: { addEventListener: on },
    location: {
      origin,
      search: "",
      hash: "",
      replace: (href) => replaced.push(href),
      assign: (href) => replaced.push(href),
    },
    navigator: { languages },
    performance: { getEntriesByType: () => [{ type: navigation }] },
    localStorage: {
      getItem: (key) => {
        if (throwGet) throw new Error("storage denied");
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem: (key, value) => {
        if (throwSet) throw new Error("storage denied");
        storage.set(key, String(value));
      },
    },
  };
  vm.runInNewContext(scriptOf(folder, file), sandbox);
  const fire = (type, event) => (listeners[type] ?? []).forEach((fn) => fn(event));
  return {
    replaced,
    storage,
    change: (target) => fire("change", { target }),
    pageshow: () => fire("pageshow", {}),
  };
}

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`);
};
const expectRedirect = (name, got, wanted) => check(name, JSON.stringify(got) === JSON.stringify(wanted), `(got ${JSON.stringify(got)}, wanted ${JSON.stringify(wanted)})`);
const rootOf = (folder, file) => html(folder, file).match(/root:"([^"]*)"/)[1];

const en = "guide/code/index.html";
const es = "es/guide/code/index.html";
const reference = "reference/index.html";

// The root is the site's, for the root build and for the dev version's build alike.
check("the root build's root is the site's root", rootOf(dir, en) === root, rootOf(dir, en));
check("the dev build's root is the site's root, not its own folder", rootOf(devDir, en) === root, rootOf(devDir, en));

expectRedirect("a stored pick of es moves an English page to Spanish", run(dir, en, { stored: "es" }).replaced, ["/docs-theme/es/guide/code/"]);
expectRedirect("a stored pick of en moves a Spanish page to English", run(dir, es, { stored: "en" }).replaced, ["/docs-theme/guide/code/"]);
expectRedirect("a stored pick of es moves the English home to the Spanish home", run(dir, "index.html", { stored: "es" }).replaced, ["/docs-theme/es/"]);
expectRedirect("a stored pick of en moves the Spanish home to the English home", run(dir, "es/index.html", { stored: "en" }).replaced, ["/docs-theme/"]);
expectRedirect("browser es on an English deep page moves it to Spanish", run(dir, en, { languages: ["es-ES", "en"] }).replaced, ["/docs-theme/es/guide/code/"]);
expectRedirect("browser en on a Spanish URL stays", run(dir, es, { languages: ["en-US"] }).replaced, []);
expectRedirect("a crawler with es in its languages is moved from an English URL (accepted)", run(dir, en, { languages: ["es"] }).replaced, ["/docs-theme/es/guide/code/"]);
expectRedirect("an internal referrer does not redirect", run(dir, en, { referrer: `${root}guide/`, stored: "es" }).replaced, []);
expectRedirect("an internal referrer on a Spanish page does not redirect", run(dir, es, { referrer: `${root}es/`, stored: "en" }).replaced, []);
expectRedirect("an internal referrer on the home page does not redirect", run(dir, "index.html", { referrer: root, stored: "es" }).replaced, []);
expectRedirect("a referrer from the root of a dev version's build does not redirect", run(devDir, en, { referrer: root, stored: "es" }).replaced, []);
expectRedirect("a referrer from a sibling site of the same origin redirects", run(dir, en, { referrer: `${origin}/other-site/`, stored: "es" }).replaced, ["/docs-theme/es/guide/code/"]);
expectRedirect("an untranslated page stays for a stored pick of es", run(dir, reference, { stored: "es" }).replaced, []);
expectRedirect("an untranslated page stays for browser es", run(dir, reference, { languages: ["es"] }).replaced, []);
expectRedirect("an English page with a browser in English stays", run(dir, en, { languages: ["en-US"] }).replaced, []);
expectRedirect("with storage denied, browser es still moves an English page", run(dir, en, { throwGet: true, languages: ["es"] }).replaced, ["/docs-theme/es/guide/code/"]);
expectRedirect("with storage denied, a page stays without a redirect target", run(dir, reference, { throwGet: true, languages: ["en-US"] }).replaced, []);
expectRedirect("a Back navigation does not redirect, even with a stored pick", run(dir, en, { stored: "es", navigation: "back_forward" }).replaced, []);
expectRedirect("a reload of the page still redirects (control of the Back case)", run(dir, en, { stored: "es", navigation: "reload" }).replaced, ["/docs-theme/es/guide/code/"]);

{
  const picker = select([
    { value: "/docs-theme/guide/code/", pick: "en", defaultSelected: true },
    { value: "/docs-theme/es/guide/code/", pick: "es" },
  ]);
  const one = run(dir, en, { languages: ["en-US"] });
  picker.selectedIndex = 1;
  one.change(picker);
  check("a change of the select stores the pick and goes to the option",
    one.storage.get("docs-lang") === "es" && one.replaced[0] === "/docs-theme/es/guide/code/",
    `(${one.storage.get("docs-lang")}, ${one.replaced[0]})`);
}
{
  const denied = run(dir, en, { throwSet: true, languages: ["en-US"] });
  const picker = select([
    { value: "/docs-theme/guide/code/", pick: "en", defaultSelected: true },
    { value: "/docs-theme/es/guide/code/", pick: "es" },
  ]);
  picker.selectedIndex = 1;
  denied.change(picker);
  check("a change of the select still goes to the option with storage denied", denied.replaced[0] === "/docs-theme/es/guide/code/");
}
{
  const picker = select([
    { value: "/docs-theme/guide/code/", pick: "en", defaultSelected: true },
    { value: "/docs-theme/es/guide/code/", pick: "es" },
  ]);
  const page = run(dir, en, { languages: ["en-US"], selects: [picker] });
  picker.selectedIndex = 1;
  page.pageshow();
  check("a Back to the page resets the select to its own language", picker.selectedIndex === 0, `(index ${picker.selectedIndex})`);
}

const failed = results.filter((ok) => !ok).length;
console.log(`check-redirect: ${results.length - failed} of ${results.length} pass`);
process.exit(failed ? 1 : 0);
