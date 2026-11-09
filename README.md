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

The site lives in `site/` of the repo. You need Hugo (extended), Dart Sass and
Node.

1. Add the theme as a submodule:

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

   With `--strict`, the highlighter also fails when the site has no agentica
   block, no signature block, or a color class that no token matched. Use it
   when the site has all of them.

4. In CI, check out the submodules (`actions/checkout` with
   `submodules: true`).

The sidebar and the pager follow the `weight` of each page in its front matter.

## Params

| Param | Default | What it does |
|---|---|---|
| `description` | none | The meta description, and the summary in `llms.txt` |
| `version` | none, required | The version in the header, the footer and `llms.txt`; `HUGO_PARAMS_VERSION` in the environment sets it too |
| `repo` | none | The GitHub repo URL; release links are `<repo>/releases/tag/<version>` |
| `tagline` | none | Added to the home page title and the footer: "Title: tagline" |
| `repoPublic` | `false` | Shows the GitHub link and the page source links |
| `branch` | `main` | The branch of the page source links |
| `narrow` | `50rem` | The width at and below which the sidebar becomes a drawer |

## Change a template

A file of the site wins over the file of the theme with the same path. To
change one part, copy it from the theme to the same path under `site/layouts/`
(or `site/assets/`) and edit the copy. For example, the agentica site keeps
its own `layouts/reference/list.html`. Keep copies few: a copy no longer gets
the theme's fixes.

## Update the theme

The repo pins a commit of the theme. To take a newer one:

```sh
git -C site/themes/docs-theme fetch
git -C site/themes/docs-theme checkout <commit>
git add site/themes/docs-theme
git commit -m "Update docs-theme"
```

## Work on the theme

`make example` builds the site in `exampleSite/` the way CI does: Hugo fails
on a warning, then the highlighter runs with `--strict`. `make example-serve`
serves it. Put Dart Sass on `PATH` or pass `DART_SASS=<its folder>`.

To update the grammar, copy `syntaxes/agentica.tmLanguage.json` from
agc-tmlanguage to `highlight/`, set the `grammar` field of
`highlight/package.json` to its commit, and run `make example`.

## License

MIT, see [LICENSE](LICENSE). `highlight/agentica.tmLanguage.json` is a copy
from agc-tmlanguage (Apache-2.0), and the icons in `assets/icons/lucide/` are
Lucide's (ISC, see their LICENSE).
