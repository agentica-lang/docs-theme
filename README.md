# docs-theme

The Hugo theme of the agentica-lang docs sites: one look, one layout and one
highlighter for the docs of every repo. Content stays in each repo.

What a site gets:

- The layout: header, sidebar tree, page table of contents, pager, footer, 404,
  light and dark themes, search (`/` or Ctrl+K).
- Page actions: copy the page as Markdown, view the Markdown, open it in
  ChatGPT or Claude.
- The outputs: `index.md` next to each page, `search.json`, `llms.txt` and
  `llms-full.txt`.
- Code blocks: ` ```agentica ` (or `agc`), ` ```signature `, ` ```output `,
  ` ```input ` and ` ```prompt ` (text to paste into a coding agent, which
  wraps); `{expect="CODE"}` on an agentica block shows the error code it
  gives. Every block but an output has a Copy button. A test that runs a
  site's examples should skip `signature` and `prompt` blocks.
- The highlighter, `highlight/highlight.mjs`, which colors the agentica and
  signature blocks of the built HTML with the TextMate grammar of
  [agc-tmlanguage](https://github.com/agentica-lang/agc-tmlanguage).

The design rules are in [DESIGN.md](DESIGN.md).

## Use it in a repo

You need Hugo 0.167.0 or newer (the standard build is enough: the styles run
on Dart Sass), Dart Sass (CI uses 1.105.1) and Node.
The site lives in `site/`, one folder below the repo root: the page source
links depend on it.

1. Add the theme as a submodule. Clone the repo with `--recurse-submodules`
   from then on, or run `git submodule update --init`.

   ```sh
   git submodule add https://github.com/agentica-lang/docs-theme.git site/themes/docs-theme
   ```

2. In `site/hugo.toml`, load the theme. `_merge = "deep"` also takes the
   theme's `[outputs]`, `[markup]` and `[minify]` settings; without it, the
   Markdown copies, search and `llms.txt` are missing.

   ```toml
   _merge = "deep"
   baseURL = "https://www.agentica-lang.com/my-repo/"
   title = "My repo"
   theme = "docs-theme"
   disableKinds = ["taxonomy", "term", "rss"]
   enableGitInfo = true

   [module.hugoVersion]
     min = "0.167.0"

   [params]
     description = "One sentence about the project."
     repo = "https://github.com/agentica-lang/my-repo"
     version = "1.2.0"
   ```

3. Build with Hugo, then run the highlighter on the output:

   ```sh
   npm ci --prefix site/themes/docs-theme/highlight --ignore-scripts
   hugo --source site --panicOnWarning
   node site/themes/docs-theme/highlight/highlight.mjs site/public
   ```

   The highlighter fails when the site has no agentica block, or when no
   token got a color. Add `--strict` when the site also has signature blocks:
   it then fails without one, and when a color class matches no token, which
   catches a grammar change. Add `--allow-unused-classes` after `--strict`
   when the site's code does not use every kind of token.

4. Ignore the build output: `site/public/`, `site/resources/` and
   `site/.hugo_build.lock`.

5. In CI, check out the submodule (`actions/checkout` with `submodules: true`,
   or `git submodule update --init site/themes/docs-theme`) and point the npm
   cache of `actions/setup-node` at
   `site/themes/docs-theme/highlight/package-lock.json`.
   Then check the search tags of the build (see "Search engines"):

   ```sh
   make -C site/themes/docs-theme check-seo DIR="$PWD/site/public"
   ```

   With `enableGitInfo`, also check out the whole history
   (`fetch-depth: 0`): the sitemap's `<lastmod>` is the date of the last
   commit of each page, and a shallow clone gives every page the same date.

Each folder of the content is a section with an `_index.md`. The sidebar and
the pager follow the `weight` in the front matter of each page. When the text of
a page or of the home page starts with a `#` heading (a README mounted as
`content/_index.md`), that heading is the title shown on the page.

A link to another page names its file, relative to the linking file
(`[Filters](filters.md)`, `[Guide](guide/_index.md)`), so it works on GitHub
too. A relative link written as a page (`x.md` or `../x/`) that reaches no page
is a Hugo warning, which `--panicOnWarning` turns into an error. A link to any
other file of the repository goes to GitHub when `repoPublic` is true, and is
plain text otherwise.

## Params

All are optional.

| Param | Default | What it does |
|---|---|---|
| `description` | none | The meta and Open Graph description of the home page (when its front matter has none) and of a page with no description or summary, and the summary in `llms.txt` |
| `image` | none | An image for a small `summary` card on every page with no image of its own, in place of the theme's large card; a value with no `https://` is a path under `baseURL` (see below) |
| `socialImage` | the theme's org card | A 1200×630 image for the large card (`summary_large_image`) of every page that has no image of its own; wins over `image`. A path under the site's `static/` folder also gives its width and height. Without it and without `image`, pages get the theme's `assets/images/social.png` (the Agentica name and tagline), which a site replaces with its own `assets/images/social.png` |
| `socialImageAlt` | the site title, or the theme's `social_image_alt` ("Agentica: Ruby with static types") for the org card | The alt text of the large card |
| `share` | `true` | Share links at the end of each post (see below); `false` (or `"false"`) turns them off, and `share:` in a page's front matter wins over it |
| `version` | none | A string such as `"1.2.0"`: the version in the header, the footer and `llms.txt`; `HUGO_PARAMS_VERSION` in the environment sets it too. Without it, they show no version |
| `repo` | none | The GitHub repo URL: the footer links to its releases, and with `version` the version links to its release |
| `tagPrefix` | `""` | Put before the version in the release tag: `v` for a tag `v1.2.0` |
| `tagline` | none | Added to the `<title>` of the home page, "Title: tagline", and to the footer when `repoPublic` is false |
| `repoPublic` | `false` | Shows the GitHub link and the page source links; needs `repo` |
| `branch` | `main` | The branch of the page source links |
| `narrow` | `50rem` | The width at and below which the sidebar becomes a drawer |
| `search` | `true` | The search box in the header and its script, which fetches the index. `search: false` (or `"false"`, as `HUGO_PARAMS_SEARCH=false` gives it) in a page's front matter hides them on that page only (a landing page, say), and the page's own value wins over the site's, so `search: true` shows them on one page of a site that turns them off. In a section's `_index.md` it applies to that list page only; use `cascade` for its pages. `search.json` still lists every page, `search: false` ones too |
| `versions` | off | A table: `enabled` (`false`) turns on the version selector, and `root` (the site's root path, with or without a trailing slash: `/docs` and `/docs/` are the same) is where `versions.json` and the selector's files are. See below |

## Versions

A site that publishes the docs of several versions in one folder (the latest
at the root, the others under `0.3.0/`, `dev/`) can show a version selector
(`DESIGN.md`, Version selector). The site's build:

- writes `versions.json` at the root: a list of
  `{ "version": "0.3.0", "path": "0.3.0/" }`, in the order of the menu, with
  `"latest": true` on the one at the root;
- builds each version with the selector on and the root of all versions, from
  the environment, so a tag whose `hugo.toml` lacks them gets them too:
  `HUGO_PARAMS_VERSIONS_ENABLED=true HUGO_PARAMS_VERSIONS_ROOT=/docs/ hugo
  --baseURL https://host/docs/0.3.0/`.

Only the build at the root (whose own root is `root`) publishes
`_versions/selector.js` and `_versions/selector.css`; the version folders get
no copy. Every page of every version loads them from `root`, with no hash, so
a page built before a change gets the current selector. A page built without this theme can load the same two files from
the root with a `<link>` and a `<script defer>` tag.

### Build every version

`tools/site_versions.py` does that build for a repo whose releases are git
tags (Python standard library only). From the root of the repo (or pass
`--repo`: inside the theme's folder, git finds the theme's own repo), with the
theme at `site/themes/docs-theme`:

```sh
python3 -I site/themes/docs-theme/tools/site_versions.py build \
  --base-url https://host/docs/
```

It builds each release tag in its own git worktree with `make site
HUGO_FLAGS="--baseURL ..."`, and `dev` from the working tree. It writes
`build/site-versions/public` with the latest at the root, `VERSION/`, `dev/`,
`versions.json` and `_versions/`, and gives the version and dev pages a
canonical URL to the root or `noindex`. It takes Hugo and Dart Sass from the
four pins of the repo's `.github/workflows/pages.yml` (`HUGO_VERSION`,
`HUGO_SHA256`, `DART_SASS_VERSION`, `DART_SASS_SHA256`, the extended Hugo
archive), and caches each tag by commit. The top of the script says how it
treats a tag that fails or has no site.

| Option | Default | What it does |
|---|---|---|
| `--tag-pattern` | `^(\d+\.\d+\.\d+)$` | A regex with one group, the version, for the release tags: `^tensor-(\d+\.\d+\.\d+)$` for the tag `tensor-0.4.0` |
| `--dev` | `first` | `last` puts `dev` at the end of the selector |
| `--repo` | the git checkout of the working directory | The repo to build |
| `--out`, `--cache`, `--tools` | `build/site-versions/public`, `build/site-versions/cache`, `~/.cache/docs-theme-site-tools` | Where the site, the cache of built tags, and the downloaded Hugo and Dart Sass go |

`make site-versions-test` runs its tests.

## Languages

A site in several languages sets them in `hugo.toml` (see
`exampleSite/multilingual.toml`): the default language (English here) at the
root, each other one under its code (`/es/`), with its content in its own
`content.es/` folder and its strings in `i18n/es.toml`. With one language the
site has none of the parts below.

- The language selector (`DESIGN.md`, Language selector) is a `<select>` of
  every language. Each option goes to the same page in that language when the
  page has it, else to that language's home. It is in the header and, under
  30rem, in the menu. Without JavaScript, a `<noscript>` holds the same
  languages as links.
- The redirect is an inline script at the top of `<head>`. An arrival from
  outside the site moves to the same page in the reader's language when that
  page exists. "Outside" means a referrer that does not start with the site's
  root (its origin and first folder, the same for every version of the site),
  so a sibling docs site on the same origin counts as outside. A Back
  navigation never redirects. A pick in the select is stored in `localStorage`
  as `docs-lang` and wins over the browser. With no pick, the browser's first
  language the site has moves only a reader of the default language. A change
  inside the site never redirects. Crawlers get each URL as it is, but a
  crawler that sends `es` as a browser language can be moved from an English
  URL to Spanish; `hreflang` covers the indexing.
- Each page with translations has `hreflang` for each of them, itself included,
  and `x-default` to the default language's page, and `og:locale` and
  `og:locale:alternate`. A page with no translation has none of them. The
  `og:locale` of a language is its `params.ogLocale` in the language's config
  (such as `es_ES`, `en_US` in `exampleSite/multilingual.toml`); without it,
  the language code.
- A Markdown link to a page the language does not have goes to the default
  language's page, with `hreflang="en"`.

## Search engines

Every page gets, in its `<head>` (`_partials/seo.html`): the description, a
canonical URL (or a robots `noindex,follow`), the theme color, a link to the
feed, Open Graph and Twitter card tags, and one JSON-LD block. The JSON-LD of
the home page has a `WebSite` and an `Organization` (and the `software` block
below); the other pages have a `BreadcrumbList`, the same path that the visible
breadcrumbs show above the title (their first item is the `home` string of
`i18n/`, "Home"). `sitemap.xml` lists the home page, sections and pages, with no
`noindex` page, no page whose canonical URL is another page, and no section with
no text and no listed page (so a section of empty sections is left out too);
with `enableGitInfo` each one has a `<lastmod>` from Git. A site that is all
`noindex` lists only its home page, since a sitemap needs one URL. The 404 page
is `noindex` and links the home page and the top sections that the sitemap
lists.

The description of a page is its `description`, else (on the home page) the
`description` param, else its summary cut to 160 characters at a word, else the
`description` param. The home page's `og:title` is its full `<title>`.
`make check-seo DIR=<built site>` (`tools/check-seo.mjs`) fails on a missing
title, h1, canonical URL or tag, a canonical URL that is not `https://`, an
`og:url` that is not the canonical URL, or a description over 160 characters.
When `sitemap.xml` is a sitemap index, it checks the sitemaps of the build that
the index lists and skips those of other sites.

Each part has its param, and `false` turns it off:

| Param | Default | What it does |
|---|---|---|
| `structuredData` | `true` | The JSON-LD block |
| `breadcrumbs` | `true` | The visible breadcrumbs of every page but the home page; the JSON-LD keeps its `BreadcrumbList` |
| `openGraph` | `true` | The Open Graph and Twitter card tags |
| `feedLink` | `true` | The `<link rel="alternate">` to the RSS feed of the page or the home page, when the site has one |
| `themeColor` | `{ light = "#ffffff", dark = "#0f1217" }` | The `theme-color` of the light and the dark system color setting |
| `noindex` | `false` | `true` makes every page `noindex,follow`: for an old version or a preview. `HUGO_PARAMS_NOINDEX=true` sets it too |
| `organization` | the agentica-lang org | A table: `name` (`Agentica`), `url` (`https://www.agentica-lang.com/`), `logo` (`icon-512.png` there) and `sameAs` (a list, the GitHub org). The footer links `url` as "`name` home", except on the site at that URL |
| `software` | none | A table that adds a `SoftwareSourceCode` to the home page: `name` (the site title), `description` (the site's), `codeRepository` (`repo`), `programmingLanguage`, `license`. There is no `SoftwareApplication`: Google wants offers or ratings for it |

In the front matter of a page, `noindex: true` makes that page `noindex` and
leaves it out of the sitemap, and `canonical:` sets its canonical URL (to point
a copy at its original), which also leaves it out of the sitemap.

The card image of a page is, in order: the first entry of `images` in its
front matter (a file of the page bundle, or a path or URL), a `cover.*` image
of its page bundle (`blog/my-post/index.md` and `blog/my-post/cover.png`), or
the `socialImage` param (or the theme's org card). Each gives `twitter:card` `summary_large_image`, an
`og:image:alt` (the `imageAlt` front matter, else the page title) and, when
known, `og:image:width` and `og:image:height`; a file of the page bundle
becomes a 1200px wide jpg. Make the image 1200×630. A page with none of them
of a site that sets the `image` param keeps it, in a `summary` card.

A post is a page with a `date`. Its `og:type` is `article`, with
`article:published_time` and `article:modified_time` (the date of its last
commit with `enableGitInfo`, else its `lastmod`); the other pages are
`website`. `single.html` ends
a post with share links (`_partials/share.html`): X, LinkedIn, Hacker News,
Reddit and Bluesky, plain links with nothing loaded from those sites, and a
"Copy link" button, shown only when the browser has a clipboard.
`share: false` in the front matter turns them off on one post. A site with its
own post layout adds them with `{{ partial "share.html" . }}`.

`canonical`, `image` and the organization's `logo` take a full `https://` URL (a
protocol-relative `//host/path` gets `https:`), or else a path: the path of a
page (`/guide/code/`, found with `site.GetPage`) gives that page's URL, and any
other path is taken under `baseURL`, with or without a leading slash. So with
`baseURL = "https://www.agentica-lang.com/my-repo/"`, `/x.png` is
`https://www.agentica-lang.com/my-repo/x.png`, not the root of the host.

To add JSON-LD nodes, override `_partials/structured-data-extra.html`: it
returns a list of dicts, which join the page's `@graph`. The example site adds
a `BlogPosting` to each page of its `blog` section that way. The theme has no
`TechArticle` for docs pages (no search result uses it) and no image render
hook (width, height, lazy loading, a warning on a missing alt text); both wait
for a site that needs them.

## Change a template

A file of the site wins over the file of the theme with the same path. To change
one part, copy it from the theme to the same path under `site/layouts/` (or
`site/assets/`) and edit the copy. For example, a site can use its own icon with
`site/layouts/_partials/favicon.html`, its own search tags with
`site/layouts/_partials/seo.html`, add to the home page with
`site/layouts/_partials/home-extra.html` (empty in the theme), and the agentica
site keeps its own `layouts/reference/list.html`. Keep copies few: a copy no
longer gets the theme's fixes. A copy of `single.html` or `list.html` (or any
page layout) must call `{{ partial "breadcrumbs.html" . }}` at the top of its
`<article>`, as the theme's do, or its pages lose the visible breadcrumbs that
match their `BreadcrumbList`.

`layouts/_partials/page-notice.html` is empty too: a site copies it to show a
notice at the top of each single, list and home page (for example, that a
translation is out of date). The home layout calls it too.

## Translate the theme

The words of the theme (buttons, labels, messages, the 404 page) are in
`i18n/en.toml`. The theme also ships `i18n/es.toml`, the Spanish. A site that
sets another `locale` copies `i18n/en.toml` to `i18n/<lang>.toml` in its own
folder, translates the values and keeps the keys. Hugo merges the theme's and
the site's files key by key: a site's file may hold only the keys it changes,
and the theme's other keys still resolve, in English too. A partial file is
safe for another language: a key left out there falls back to the English.

A template reads a key with `{{ partial "t.html" "key" }}`. Its fallback reads
`i18n/en.toml` as a file, and it runs only when no bundle gives the key a value.
A value may hold placeholders in braces, such as `{version}` or
`{url}`. The template or the script replaces them. Keep them as they are.

The keys, by part of the page:

- Header and sidebar: `skip_content`, `skip_navigation`, `menu`, `home`,
  `site_nav`, `section_pages`, `release_version`, `switch_dark`, `switch_light`,
  `language_label` (the language selector).
- Search: `search_label`, `search_placeholder`, `search_help`, `search_results`,
  `search_min`, `search_loading`, `search_error`, `search_none`,
  `search_count_one`, `search_count_other`.
- Pager, breadcrumbs, headings: `previous`, `next`, `pager_nav`, `breadcrumb`,
  `link_to_section`.
- Footer: `all_releases`, `page_source`, `site_on_github`, `org_home`.
- The 404 page: `error_404_title` (the tab title), `not_found_title`,
  `not_found_text`, `not_found_search`, `not_found_try`, `not_found_list`.
- Page actions: `page_label`, `page_actions`, `more_page_actions`, `copy_page`,
  `view_source`, `open_chatgpt`, `open_claude`, `page_prompt`.
- Code blocks: `copy`, `copy_code`, `copy_prompt`, `copy_input`,
  `copy_signature`, `copied`, `copy_failed`, `output`, `input`, `prompt`,
  `runtime_error`, `does_not_compile`.
- Share links: `share_label`, `share_on`, `copy_link`.
- The version selector and its note: `version_label`, `latest`,
  `view_in_version`, `version_dev_note`, `version_old_note`.
- llms.txt, llms-full.txt and each page's Markdown: `llms_intro`,
  `llms_version`, `llms_version_repo`, `group_docs`, `docs_title`,
  `source_label`, `pages_in_section`, `file_label`.
- The large social card's alt text, when the site sets no `socialImageAlt`:
  `social_image_alt`.

The scripts read the strings they show from one JSON block, `theme-strings`,
which `layouts/_partials/theme-strings.html` writes into each page. The scripts
have no English of their own. The one exception is the version selector, which
runs on the pages of old versions that have no block: it keeps a short English
fallback, and `tools/check-strings.mjs` checks that it equals `en.toml`.

`make example` builds the example in Spanish too, and `tools/check-strings.mjs`
checks it. For each language other than English, every key of `en.toml` must
have a value that is not the English one, unless the key is listed in
`SAME_IN_SPANISH` on purpose. The labels of the home page, the 404 page,
llms.txt, a page with a pager, a code page (the sample and copy labels) and a
page with breadcrumbs must be in the page. The `theme-strings` block must have
a value for each of its keys. Every key that a template asks for must be in
`en.toml`. A site with no file for its language, and one with a partial file,
are built too: the first must show English, the second must show its
apostrophes once.

## Update the theme

The repo pins a commit of the theme. To take a newer one:

```sh
git -C site/themes/docs-theme fetch
git -C site/themes/docs-theme checkout <commit>
git add site/themes/docs-theme
git commit -m "Update docs-theme"
```

## Work on the theme

- `make example` builds the site in `exampleSite/` as CI does, four times:
  with all the params, with no version and no repo (`bare.toml`), with a tag
  prefix (`prefix.toml`), and with every search tag off (`off.toml`). Hugo
  fails on a warning, the highlighter runs with `--strict`, the outputs must
  be there, a template must not print a format error, and
  `tools/check-seo.mjs` checks the search tags: a title and one h1, a
  canonical URL or `noindex`, JSON-LD that parses with the fields Google
  requires, breadcrumbs that match it, and a sitemap with no `noindex` page.
  `make example-serve` serves the first one.
- Put Dart Sass on `PATH` or pass `DART_SASS=<its folder>`.
- `make example` and `make example-serve` use the checkout itself as the
  theme, through a link in `exampleSite/.themes/` and `HUGO_THEMESDIR`, so
  the clone folder can have any name. A plain `hugo --source exampleSite`
  finds the theme with `themesDir = "../.."`, which needs the folder named
  `docs-theme`.
- The grammar is `highlight/agentica.tmLanguage.json`, a copy of the
  agc-tmlanguage commit in the `grammar` field of `highlight/package.json`.
  The `grammarChanges` field says what differs from that commit. To update it,
  copy `syntaxes/agentica.tmLanguage.json` from agc-tmlanguage, set `grammar`
  to its commit, update or remove `grammarChanges`, and run `make example`.

## License

MIT, see [LICENSE](LICENSE). `highlight/agentica.tmLanguage.json` comes from
agc-tmlanguage (Apache-2.0, `highlight/LICENSE`), and the icons in
`assets/icons/lucide/` are Lucide's (ISC, see their LICENSE).
