// Checks the search tags of a built site (make example): node tools/check-seo.mjs DIR [--off]
// Every page: a title, one h1, either a canonical URL or a robots noindex, and a description with no entity escaped
// twice, of 160 characters or less and without the Copy button's text. The canonical URL is https and og:url is the
// same. An og:type article has an article:published_time, and a large card an og:image:alt. Every JSON-LD block
// parses and its nodes have the fields Google requires. The sitemap (or each sitemap of this build that a sitemap
// index lists) lists no noindex page and no page whose canonical URL is another page. With --off (off.toml), none of
// the tags is there. A page with translations lists each of them, itself included, and x-default to the root's
// language; every link is an https URL of this site, and each target lists the same links (reciprocal).
// Hugo's alias pages (a refresh to the new URL) are skipped.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const [dir, mode] = process.argv.slice(2);
const off = mode === "--off";
const errors = [];
const fail = (file, message) => errors.push(`${file}: ${message}`);

function htmlFiles(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

// The minifier drops the quotes of simple attribute values, so a value is quoted or runs to a space or `>`.
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|([^\\s>]+))`));
  return m ? (m[1] ?? m[2]) : null;
};
const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, "g")) ?? [];
const metaNamed = (html, name) => tags(html, "meta").filter((t) => attr(t, "name") === name || attr(t, "property") === name);
const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (text) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name) =>
    name[0] === "#" ? String.fromCodePoint(Number(name.replace(/^#x/i, "0x").replace(/^#/, ""))) : entities[name] ?? whole);
const absolute = (url) => typeof url === "string" && /^https?:\/\/[^/]+\//.test(url);

const required = {
  WebSite: ["name", "url"],
  Organization: ["name", "url", "logo"],
  BreadcrumbList: ["itemListElement"],
  SoftwareSourceCode: ["name"],
  SoftwareApplication: ["name"],
  BlogPosting: ["headline", "datePublished", "author"],
};

function checkNode(file, node, ownURL) {
  const type = node["@type"];
  if (!type) return fail(file, "a JSON-LD node has no @type");
  for (const field of required[type] ?? []) {
    if (node[field] === undefined || node[field] === "") fail(file, `${type} has no ${field}`);
  }
  if (type === "BreadcrumbList") {
    const items = node.itemListElement ?? [];
    if (!items.length) fail(file, "BreadcrumbList is empty");
    items.forEach((item, i) => {
      if (item["@type"] !== "ListItem" || item.position !== i + 1 || !item.name || !absolute(item.item)) {
        fail(file, `BreadcrumbList item ${i + 1} needs @type ListItem, position ${i + 1}, a name and an absolute item`);
      }
    });
    const last = items.at(-1);
    if (last && last.item !== ownURL) fail(file, `the last breadcrumb ${last.item} is not the page ${ownURL}`);
  }
  if (type === "Organization" && !absolute(node.logo)) fail(file, "Organization logo is not an absolute URL");
  if (type === "BlogPosting" && !node.author?.name) fail(file, "BlogPosting author has no name");
}

const noindexPages = new Set();
const elsewhere = new Set();
const homeCanonical = (() => {
  const html = readFileSync(join(dir, "index.html"), "utf8");
  const link = tags(html, "link").find((t) => attr(t, "rel") === "canonical");
  const og = metaNamed(html, "og:url")[0];
  return link ? attr(link, "href") : og ? attr(og, "content") : null;
})();
const seen = { WebSite: 0, Organization: 0, BreadcrumbList: 0 };
const alternates = new Map();
const htmlLang = (html) => attr(tags(html, "html")[0] ?? "", "lang");

for (const path of htmlFiles(dir)) {
  const file = relative(dir, path);
  const html = readFileSync(path, "utf8");
  if (/<meta http-equiv="?refresh/.test(html)) continue;
  const ownURL = homeCanonical && homeCanonical + (file === "index.html" ? "" : file.replace(/index\.html$/, ""));
  if (!/<title>[^<]+<\/title>/.test(html)) fail(file, "no <title>");
  const h1s = tags(html, "h1").length;
  if (h1s !== 1) fail(file, `${h1s} h1 headings`);

  const robots = metaNamed(html, "robots").map((t) => attr(t, "content"));
  const canonicals = tags(html, "link").filter((t) => attr(t, "rel") === "canonical").map((t) => attr(t, "href"));
  const noindex = robots.some((r) => r.includes("noindex"));
  if (noindex) noindexPages.add(file);
  if (file === "404.html" && !noindex) fail(file, "the 404 page has no robots noindex");
  if (noindex && canonicals.length) fail(file, "a noindex page has a canonical URL");
  if (!noindex && (canonicals.length !== 1 || !absolute(canonicals[0]))) fail(file, "needs one absolute canonical URL");
  if (canonicals[0] && ownURL && canonicals[0] !== ownURL) elsewhere.add(file);
  if (canonicals[0] && !canonicals[0].startsWith("https://")) fail(file, `the canonical URL is not https: ${canonicals[0]}`);
  const ogURL = metaNamed(html, "og:url").map((t) => attr(t, "content"))[0];
  if (canonicals[0] && ogURL && ogURL !== canonicals[0]) fail(file, `og:url ${ogURL} is not the canonical URL ${canonicals[0]}`);
  for (const tag of [...metaNamed(html, "description"), ...metaNamed(html, "og:description"), ...metaNamed(html, "twitter:description")]) {
    const text = attr(tag, "content") ?? "";
    if (/&amp;(amp|lt|gt|quot|[a-z]+|#\d+);/.test(tag)) fail(file, `a description escapes an entity twice: ${text}`);
    const plain = decode(text);
    if ([...plain].length > 160) fail(file, `a description has ${[...plain].length} characters, over 160: ${plain}`);
    if (/\bCopy\b/.test(plain)) fail(file, `a description has the Copy button's text: ${plain}`);
  }

  const blocks = [...html.matchAll(/<script type=(?:"application\/ld\+json"|application\/ld\+json)>([\s\S]*?)<\/script>/g)];
  const crumbs = /<nav class="?breadcrumbs"?[\s>]/.test(html);
  const og = metaNamed(html, "og:title").length > 0;
  const themeColor = metaNamed(html, "theme-color").length;
  const links = tags(html, "link").filter((t) => attr(t, "rel") === "alternate" && attr(t, "hreflang") !== null);
  if (links.length) {
    alternates.set(file, {
      lang: htmlLang(html),
      canonical: canonicals[0],
      links: links.map((t) => ({ lang: attr(t, "hreflang"), href: attr(t, "href") })),
    });
  }

  if (off) {
    if (blocks.length || crumbs || og || themeColor) fail(file, "a search tag is on in the off build");
    if (tags(html, "link").some((t) => attr(t, "type") === "application/rss+xml")) fail(file, "a feed link in the off build");
    continue;
  }
  if (themeColor !== 2) fail(file, "needs the light and the dark theme-color");
  if (!noindex && file !== "404.html") {
    if (!og || !metaNamed(html, "og:image").length || !metaNamed(html, "twitter:card").length) fail(file, "no Open Graph or Twitter card");
    if (blocks.length !== 1) fail(file, `${blocks.length} JSON-LD blocks, wants 1`);
    const content = (name) => metaNamed(html, name).map((t) => attr(t, "content"))[0];
    const article = content("og:type") === "article";
    if (article && Number.isNaN(Date.parse(content("article:published_time")))) fail(file, "an article has no article:published_time");
    if (!article && content("article:published_time")) fail(file, "a page that is not an article has article:published_time");
    if (content("twitter:card") === "summary_large_image" && !content("og:image:alt")) fail(file, "a large card image has no alt text");
  }
  if (existsSync(join(dir, "index.xml")) && !tags(html, "link").some((t) => attr(t, "type") === "application/rss+xml")) {
    fail(file, "the site has a feed and the page does not link it");
  }
  for (const [, text] of blocks) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      fail(file, `JSON-LD does not parse: ${error.message}`);
      continue;
    }
    if (data["@context"] !== "https://schema.org") fail(file, "JSON-LD @context is not https://schema.org");
    for (const node of data["@graph"] ?? []) {
      checkNode(file, node, ownURL);
      if (node["@type"] in seen) seen[node["@type"]]++;
    }
    const home = file === "index.html" || file === `${htmlLang(html)}/index.html`;
    const types = (data["@graph"] ?? []).map((n) => n["@type"]);
    if (home && !(types.includes("WebSite") && types.includes("Organization"))) fail(file, "the home page needs WebSite and Organization");
    if (!home && !types.includes("BreadcrumbList")) fail(file, "no BreadcrumbList");
    if (!home && !crumbs) fail(file, "no visible breadcrumbs");
  }
}

const locs = (xml) => xml.match(/<loc>(https?:\/\/[^<]+?)<\/loc>/g)?.map((l) => l.slice(5, -6)) ?? [];
function checkSitemap(name, xml) {
  const base = locs(xml);
  if (!base.length) fail(name, "no <loc>");
  // The site's root is the root page's URL. Not the shortest URL: a language's own sitemap (es/sitemap.xml) has its home,
  // `es/`, as its shortest one, and that is not the root.
  const root = homeCanonical || base.reduce((a, b) => (a.length <= b.length ? a : b), base[0] ?? "");
  for (const loc of base) {
    if (!loc.startsWith(root)) fail(name, `${loc} is not under ${root}`);
    const page = join(loc.slice(root.length), "index.html");
    if (!existsSync(join(dir, page))) fail(name, `${loc} has no page`);
    if (noindexPages.has(page)) fail(name, `${loc} is a noindex page`);
    if (elsewhere.has(page)) fail(name, `${loc} has its canonical URL on another page`);
  }
}

// A sitemap index (a site that also lists the sitemaps of other sites) is checked through the sitemaps of this
// build; the others are built and checked elsewhere.
const sitemap = join(dir, "sitemap.xml");
if (existsSync(sitemap)) {
  const xml = readFileSync(sitemap, "utf8");
  if (xml.includes("<sitemapindex")) {
    const own = locs(xml)
      .filter((loc) => homeCanonical && loc.startsWith(homeCanonical))
      .map((loc) => loc.slice(homeCanonical.length))
      .filter((file) => existsSync(join(dir, file)));
    if (!own.length) fail("sitemap.xml", "a sitemap index with no sitemap of this build");
    for (const file of own) checkSitemap(file, readFileSync(join(dir, file), "utf8"));
  } else {
    checkSitemap("sitemap.xml", xml);
  }
} else {
  fail("sitemap.xml", "missing");
}

if (!off && (!seen.WebSite || !seen.Organization || !seen.BreadcrumbList)) fail(dir, "the build has no WebSite, Organization or BreadcrumbList");
if (off && alternates.size) fail(dir, "hreflang links in the off build");
const linkSet = (links) => links.map((l) => `${l.lang} ${l.href}`).sort().join("\n");
const pageFile = (href) => {
  const rel = href.slice(homeCanonical.length);
  return join(dir, rel === "" || rel.endsWith("/") ? `${rel}index.html` : rel);
};
const defaultLang = alternates.size ? htmlLang(readFileSync(join(dir, "index.html"), "utf8")) : "";
for (const [file, page] of alternates) {
  const languages = page.links.filter((l) => l.lang !== "x-default");
  const self = languages.find((l) => l.href === page.canonical);
  if (!self || self.lang !== page.lang) fail(file, "hreflang has no link of this page in its own language");
  if (languages.length < 2) fail(file, "the hreflang set is missing a translation");
  const english = languages.find((l) => l.lang === defaultLang);
  const xDefault = page.links.filter((l) => l.lang === "x-default");
  if (xDefault.length !== 1 || !english || xDefault[0].href !== english.href) fail(file, "x-default is not the root language's page");
  for (const link of page.links) {
    if (!link.href.startsWith("https://") || !link.href.startsWith(homeCanonical)) fail(file, `hreflang ${link.lang} is not an https URL of this site: ${link.href}`);
  }
  for (const link of languages) {
    const path = pageFile(link.href);
    const back = existsSync(path) ? alternates.get(relative(dir, path)) : null;
    if (!back) fail(file, `hreflang ${link.lang} goes nowhere: ${link.href}`);
    else if (linkSet(back.links) !== linkSet(page.links)) fail(file, `hreflang of ${link.href} is not reciprocal`);
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`check-seo: ${htmlFiles(dir).length} pages of ${dir} pass${off ? " (all search tags off)" : ""}`);
