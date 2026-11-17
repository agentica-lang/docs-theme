# Agents

The Hugo theme of the agentica-lang docs sites. Each site (agentica's `site/`,
the landing site, bond, packages) pins a commit of it as a submodule.

## Map

- `layouts/`: the templates. `_partials/` holds the parts, `_markup/` the
  render hooks (code blocks, headings, links).
- `assets/scss/`: the styles, one file per part; `_tokens.scss` has the colors.
- `assets/js/`: one small vanilla JS file per feature.
- `highlight/`: the Node highlighter of agentica blocks, run on the built site.
- `exampleSite/`: the site that `make example` builds and checks.
- `tools/check-seo.mjs`: the check of the search tags.
- `README.md`: how a site uses the theme and its params.
- `DESIGN.md`: the design rules.

## Rules

- Read `DESIGN.md` before any visual change, and keep it true in the same PR.
- `make example` must pass: it builds `exampleSite/` four ways, runs the
  highlighter and `tools/check-seo.mjs`, and greps the output. It needs Hugo
  0.167.0 or newer, Dart Sass (`DART_SASS=<its folder>`) and Node. The clone
  folder must be named `docs-theme`, or set `HUGO_THEMESDIR` to a folder with
  a `docs-theme` link to it.
- A new feature gets a check in the `example` target of the `Makefile`.
- A visible change gets the phone check of `DESIGN.md` and screenshots in the
  PR.
- A change of params or front matter keys updates `README.md`.
- PRs: one change each, merged with a merge commit. No attribution lines in
  commits or PR bodies.
