// Checks the language redirect and the language select of a built multilingual site, without a browser (make example):
// node tools/check-redirect.mjs DIR. It takes the inline script of each page (the one that holds "docs-lang") and runs
// it with stubs of the referrer, the storage, the browser languages and location, then fires the select's change.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const dir = process.argv[2];
const origin = "https://agentica-lang.github.io";
const root = `${origin}/docs-theme/`;
const page = (file) => readFileSync(join(dir, file), "utf8");

function scriptOf(file) {
  const scripts = [...page(file).matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const found = scripts.filter((s) => s.includes("docs-lang"));
  if (found.length !== 1) throw new Error(`${file}: wants one redirect script, found ${found.length}`);
  return found[0];
}

// Runs the page's script. `stored` is the pick, `languages` the browser's, `referrer` the arrival.
function run(file, { referrer = "", languages = ["en-US"], stored = null, throwGet = false, throwSet = false } = {}) {
  const storage = new Map(stored === null ? [] : [["docs-lang", stored]]);
  const replaced = [];
  const listeners = {};
  const sandbox = {
    document: {
      referrer,
      addEventListener: (type, fn) => (listeners[type] ??= []).push(fn),
    },
    location: {
      origin,
      search: "",
      hash: "",
      replace: (href) => replaced.push(href),
      assign: (href) => replaced.push(href),
    },
    navigator: { languages },
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
  vm.runInNewContext(scriptOf(file), sandbox);
  const change = (value, selectedPick) => {
    const select = {
      value,
      selectedIndex: 0,
      options: [{ getAttribute: () => selectedPick }],
      matches: (selector) => selector === "select[data-lang-select]",
    };
    for (const fn of listeners.change ?? []) fn({ target: select });
  };
  return { replaced, storage, change };
}

const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` ${detail}`}`);
};
const expectRedirect = (name, got, wanted) => check(name, JSON.stringify(got) === JSON.stringify(wanted), `(got ${JSON.stringify(got)}, wanted ${JSON.stringify(wanted)})`);

const en = "guide/code/index.html";
const es = "es/guide/code/index.html";
const reference = "reference/index.html";

expectRedirect("a stored pick of es moves an English page to Spanish", run(en, { stored: "es" }).replaced, ["/docs-theme/es/guide/code/"]);
expectRedirect("a stored pick of en moves a Spanish page to English", run(es, { stored: "en" }).replaced, ["/docs-theme/guide/code/"]);
expectRedirect("browser es on an English deep page moves it to Spanish", run(en, { languages: ["es-ES", "en"] }).replaced, ["/docs-theme/es/guide/code/"]);
expectRedirect("browser en on a Spanish URL stays", run(es, { languages: ["en-US"] }).replaced, []);
expectRedirect("a crawler with es in its languages is moved from an English URL (accepted)", run(en, { languages: ["es"] }).replaced, ["/docs-theme/es/guide/code/"]);
expectRedirect("an internal referrer does not redirect", run(en, { referrer: `${root}guide/`, stored: "es" }).replaced, []);
expectRedirect("an internal referrer on a Spanish page does not redirect", run(es, { referrer: `${root}es/`, stored: "en" }).replaced, []);
expectRedirect("a referrer from a sibling site of the same origin redirects", run(en, { referrer: `${origin}/other-site/`, stored: "es" }).replaced, ["/docs-theme/es/guide/code/"]);
expectRedirect("an untranslated page stays for a stored pick of es", run(reference, { stored: "es" }).replaced, []);
expectRedirect("an untranslated page stays for browser es", run(reference, { languages: ["es"] }).replaced, []);
expectRedirect("an English page with a browser in English stays", run(en, { languages: ["en-US"] }).replaced, []);
expectRedirect("with storage denied, browser es still moves an English page", run(en, { throwGet: true, languages: ["es"] }).replaced, ["/docs-theme/es/guide/code/"]);
expectRedirect("with storage denied, a page stays without a redirect target", run(reference, { throwGet: true, languages: ["en-US"] }).replaced, []);

{
  const one = run(en, { languages: ["en-US"] });
  one.change("/docs-theme/es/guide/code/", "es");
  check("a change of the select stores the pick and goes to the option",
    one.storage.get("docs-lang") === "es" && one.replaced[0] === "/docs-theme/es/guide/code/",
    `(${one.storage.get("docs-lang")}, ${one.replaced[0]})`);
}
{
  const denied = run(en, { throwSet: true, languages: ["en-US"] });
  denied.change("/docs-theme/es/guide/code/", "es");
  check("a change of the select still goes to the option with storage denied", denied.replaced[0] === "/docs-theme/es/guide/code/");
}

const failed = results.filter((ok) => !ok).length;
console.log(`check-redirect: ${results.length - failed} of ${results.length} pass`);
process.exit(failed ? 1 : 0);
