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
- Code blocks: ` ```agentica ` (or `agc`), ` ```signature `, ` ```output ` and
  ` ```input `; `{expect="CODE"}` on an agentica block shows the error code it
  gives.
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
   baseURL = "https://agentica-lang.github.io/my-repo/"
   title = "My repo"
   theme = "docs-theme"
   disableKinds = ["taxonomy", "term", "rss"]

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

Each folder of the content is a section with an `_index.md`. The sidebar and
the pager follow the `weight` in the front matter of each page. When the text of
a page or of the home page starts with a `#` heading (a README mounted as
`content/_index.md`), that heading is the title shown on the page.

## Params

All are optional.

| Param | Default | What it does |
|---|---|---|
| `description` | none | The meta description, and the summary in `llms.txt` |
| `version` | none | A string such as `"1.2.0"`: the version in the header, the footer and `llms.txt`; `HUGO_PARAMS_VERSION` in the environment sets it too. Without it, they show no version |
| `repo` | none | The GitHub repo URL: the footer links to its releases, and with `version` the version links to its release |
| `tagPrefix` | `""` | Put before the version in the release tag: `v` for a tag `v1.2.0` |
| `tagline` | none | Added to the `<title>` of the home page, "Title: tagline", and to the footer when `repoPublic` is false |
| `repoPublic` | `false` | Shows the GitHub link and the page source links; needs `repo` |
| `branch` | `main` | The branch of the page source links |
| `narrow` | `50rem` | The width at and below which the sidebar becomes a drawer |

## Change a template

A file of the site wins over the file of the theme with the same path. To change
one part, copy it from the theme to the same path under `site/layouts/` (or
`site/assets/`) and edit the copy. For example, a site can use its own icon with
`site/layouts/_partials/favicon.html`, add to the home page with
`site/layouts/_partials/home-extra.html` (empty in the theme), and the agentica
site keeps its own `layouts/reference/list.html`. Keep copies few: a copy no
longer gets the theme's fixes.

## Update the theme

The repo pins a commit of the theme. To take a newer one:

```sh
git -C site/themes/docs-theme fetch
git -C site/themes/docs-theme checkout <commit>
git add site/themes/docs-theme
git commit -m "Update docs-theme"
```

## Work on the theme

- `make example` builds the site in `exampleSite/` as CI does, three times:
  with all the params, with no version and no repo (`bare.toml`), and with a
  tag prefix (`prefix.toml`). Hugo fails on a warning, the highlighter runs
  with `--strict`, the outputs must be there, and a template must not print a
  format error. `make example-serve` serves the first one.
- Put Dart Sass on `PATH` or pass `DART_SASS=<its folder>`.
- `exampleSite/hugo.toml` finds the theme with `themesDir = "../.."`, so the
  clone folder must be named `docs-theme`.
- The grammar is `highlight/agentica.tmLanguage.json`, a copy of the
  agc-tmlanguage commit in the `grammar` field of `highlight/package.json`.
  The `grammarChanges` field says what differs from that commit. To update it,
  copy `syntaxes/agentica.tmLanguage.json` from agc-tmlanguage, set `grammar`
  to its commit, update or remove `grammarChanges`, and run `make example`.

## License

MIT, see [LICENSE](LICENSE). `highlight/agentica.tmLanguage.json` comes from
agc-tmlanguage (Apache-2.0, `highlight/LICENSE`), and the icons in
`assets/icons/lucide/` are Lucide's (ISC, see their LICENSE).
