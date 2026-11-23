# Docs theme: design

This file sets the design rules of the theme, the look of every agentica-lang
docs site. Paths are from the root of this repo. Each section names its source
files. If this file and the code disagree, the code is right: fix this file in
the same change.

## Visual Theme & Atmosphere

Source: `hugo.toml`, `layouts/`.

- Purpose and voice: docs for the Agentica language and its tools. Simple words,
  short sentences, and examples with short comments do the work.
- Look: plain and flat. One red accent. No web fonts.
- Icons: four Lucide icons in `assets/icons/lucide/`. Other icons are
  inline SVG.

## Color Palette & Roles

Source: `assets/scss/_tokens.scss`. Light values are on `:root`. Dark
values are in the `dark` mixin. They apply when the reader picks dark, or when
the system prefers dark and the reader has not picked light.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--bg` | `#ffffff` | `#0f1217` | page and header |
| `--fg` | `#1f2328` | `#e6edf3` | text |
| `--muted` | `#59636e` | `#9198a1` | captions, labels, tree toggles |
| `--border` | `#d8dee4` | `#2d333b` | rules, box edges, drawer edge |
| `--code-bg` | `#f6f8fa` | `#161b22` | code, buttons, hover |
| `--mark-bg` | `#fdf1f1` | `#2a1a1c` | current page, selected search hit |
| `--accent` | `#b4232a` | `#ff7b72` | brand mark, current page, errors |
| `--link` | `#0b5cad` | `#6cb6ff` | links, pager titles, focus ring |
| `--search-hit-bg` | `#fff3b0` | `#5c4a00` | search match |
| `--search-hit-fg` | `#1f2328` | `#fff8d6` | search match text |
| `--syn-keyword` | `#cf222e` | `#ff7b72` | keywords |
| `--syn-string` | `#0a3069` | `#a5d6ff` | strings |
| `--syn-number` | `#0550ae` | `#79c0ff` | numbers |
| `--syn-name` | `#8250df` | `#d2a8ff` | function and builtin names |
| `--syn-type` | `#953800` | `#ffa657` | types and constants |
| `--syn-comment` | `#656d76` | `#8b949e` | comments, in italic |

- `--shadow`: light `0 6px 18px rgb(31 35 40 / 12%)`, dark
  `0 6px 18px rgb(0 0 0 / 45%)`. Used by the drawer, the search panel and the
  page menu.
- `--scrim`: light `rgb(31 35 40 / 45%)`, dark `rgb(0 0 0 / 60%)`. The layer
  behind the open drawer.
- Contrast: `--fg`, `--muted`, `--link` and `--accent` are at least 4.5:1 on
  `--bg`, `--code-bg` and `--mark-bg` in both themes, and each `--syn-*` token
  is at least 4.5:1 on `--bg` and `--code-bg`. Recheck when one changes.
- Highlighted code uses the `--syn-*` tokens: TextMate for `agentica` blocks,
  Chroma for other languages (`assets/scss/_code.scss`).

## Typography Rules

Source: `_tokens.scss`, `_base.scss`, `_content.scss`, `_code.scss`.

- `--font` is the system UI stack (`system-ui`, `-apple-system`, `Segoe UI`,
  Roboto, Arial). `--mono` is the system monospace stack (`ui-monospace`,
  Menlo, Consolas).
- Body text is 1rem with a line height of 1.65. Headings have a line height of
  1.25.
- Headings: h1 2.1rem, h2 1.5rem with a rule under it, h3 1.2rem, h4 1.05rem.
  At 50rem and below, h1 is 1.7rem and h2 is 1.3rem.
- Small text (labels, tree, TOC, pager, footer) is 0.75rem to 0.95rem. Each
  partial sets its own size; there is no size token.
- Code blocks keep their line breaks and scroll sideways. They do not wrap,
  except signature blocks and prose blocks (see Code blocks and samples).

## Layout, Spacing & Radius

Source: `_tokens.scss`, `_layout.scss`, `_header.scss`, `_content.scss`.

- Spacing: `--gutter` (1rem) is the side gutter of the header, tree, footer and
  drawer. Other spacing is rem literals: the page body has 2rem 2.5rem 4rem
  padding wide, and 1.25rem `--gutter` 3rem at 50rem and below.
- Widths: `--layout-width` (92rem) caps the grid. `--sidebar-width` (16rem) is
  the tree column. `--content-width` (60rem) caps the page column: code blocks,
  tables, headings and the pager. `--prose-width` (50rem, as before) caps
  paragraphs, lists and quotes. `--header` (3.5rem) is the sticky bar. The drawer is `min(20rem, 85vw)` wide.
- Breakpoint: `$narrow` is 50rem, from `params.narrow` in `hugo.toml`. Sass and
  `nav.js` read it. A second one, 30rem, hides the header version and moves
  the version selector into the menu (see Version selector).
- `--target` (2.75rem) is the touch size. The pager links use it at every
  width. At 50rem and below, the tree, the code Copy buttons and the share
  links use it too. `--nav-row` is set on `.sidebar`: 2rem, and `--target` at
  50rem and below. Tree rows are at least that high, and the section toggle is
  that square.
- `--control` (2.25rem) is the height of the header controls at every width:
  the menu button and the theme button are that square, and the search box is
  that high. The two buttons have a 44px hit area: a transparent `::before`
  reaches 4px past each edge, with no visible size. In the `--header` bar they
  leave 9.5px above and below, to the bottom line.
- Radius: `--radius-sm` (4px) for small parts: inline code, tree links, search
  keys, section tags. `--radius` (6px) for buttons, inputs, code blocks, the
  pager, the search panel and the page menu.
- Depth: the page is flat. Borders split the areas. Floating layers use
  `--shadow`, with z-index: page menu 5, scrim 8, drawer 9, header 10, search
  panel 20.
- Phone width: 16px side gutters. Long text wraps. Code and tables scroll in
  their own box, except signature and prose blocks, which wrap. The goal is no
  sideways scroll on the page itself.

## Motion & Focus

Source: `_tokens.scss`, `_layout.scss`, `_header.scss`, `_pager.scss`,
`_search.scss`.

- `--motion-base` (200ms) and `--ease` (`cubic-bezier(0.2, 0, 0, 1)`) drive
  three transitions: the drawer slide, the scrim fade and the section chevron
  turn.
- Reduced motion: `--motion-base` is 0ms under `prefers-reduced-motion: reduce`.
  The drawer and the scrim then switch at once.
- `--focus-ring` is `2px solid var(--link)`. The site's controls draw it on
  `:focus-visible`: the header buttons, the tree, the pager and the page
  actions. The search box draws it on `:focus`. Skip links, heading anchors and
  links in the page body or footer use the browser's default outline. Offsets
  differ by control: 2px, -2px or -1px.

## Components

### Header

Source: `_partials/header.html`, `theme-toggle.html`, `_header.scss`.

- Order: skip links, menu button, brand, version, search, theme button. The
  skip links are "Skip to content" (`#main`), and "Skip to navigation"
  (`#sidebar`), which shows only on a narrow page without JS. A GitHub link
  shows only when `params.repoPublic` is true (false by default).
- A sticky bar, `--header` high, with a `--border` line under it. Its
  controls are `--control` high and centered in it. Their icons are 1.125rem
  (18px).
- Menu button: a native `<button>` with `aria-controls="sidebar"` and
  `aria-expanded`. It shows only with JS, at 50rem and below. Its icon turns
  from menu to x.
- Theme button: JS only. It shows the moon on a light page and the sun on a dark
  one. `theme.js` sets its label and saves the choice under the `theme` key of
  `localStorage`. The head script in `baseof.html` applies a saved choice before
  the body renders. Without a choice, the system setting decides.
- The menu and theme buttons are ghost icon buttons, `--radius` round:
  - Normal: no visible border, a transparent background, the icon in
    `--muted`.
  - Hover (only where the pointer can hover) and active: `--code-bg`
    background, the icon in `--fg`. The menu button keeps that look while the
    drawer is open (`aria-expanded="true"`).
  - Keyboard focus: the focus ring on `:focus-visible`, offset 2px, so a mouse
    click draws no ring.
  - Their border is transparent, not removed: the size stays the same, and
    under `forced-colors: active` the edge shows.
- The search box keeps its border: it is an input. Its text is 0.95rem, and
  1rem (16px) at 50rem and below, so a phone does not zoom on focus. Its side
  padding is smaller there.

### Sidebar tree and TOC

Source: `_partials/sidebar.html`, `sidebar-item.html`, `toc.html`,
`_layout.scss`.

- `<nav id="sidebar">` starts with a Home link, then the top pages in weight
  order.
- A section is a `<details>`, open when it is the current page or one of its
  ancestors. The server renders the open state, so no JS is needed.
- Each section has two tab stops: its link and its toggle. The toggle sits over
  the right end of the link row.
- Current page: `aria-current="page"`, with `--mark-bg` background, `--accent`
  text and weight 600. Hover: `--code-bg` background.
- The TOC of the current page (its h2 headings) shows under its link.

### Mobile drawer

Source: `_layout.scss` (50rem and below), `assets/js/nav.js`.

- With JS, the tree is a drawer on the left, under the header, over a scrim. It
  is hidden with `visibility`, not `display`. So the slide runs both ways, and a
  closed tree is out of the tab order.
- Open: focus moves to the tree, and the current page scrolls to the middle.
  `main` and the footer get `inert`. The `nav-open` class on `html` locks page
  scroll.
- Close: Escape, a click on the scrim, or the menu button. Escape and the scrim
  return focus to the menu button. A plain click on a tree link closes the
  drawer. Growing past 50rem closes it.

### Version selector

Source: `assets/versions/selector.js`, `selector.css`,
`_partials/versions.html`.

- Off by default. A site that publishes several versions of its docs turns it
  on with `params.versions.enabled`. With it off, no page loads the two files
  and the build has no `_versions/` folder.
- The site's root (`params.versions.root`, by default the site's own root)
  holds `versions.json`, which the site's build writes, and
  `_versions/selector.{js,css}`, which the theme publishes there: only the
  build whose own root is that root does, so a version folder has no copy.
  Every page of every
  version loads the two files from the root, with no fingerprint and no
  `integrity` hash. So one copy serves all versions, and an old build gets the
  current selector. A page built without the theme can load them too.
- `versions.json` is a list of `{ "version", "path", "latest" }`, in the
  order of the menu. `path` is the version's folder under the root
  (`0.3.0/`); the `latest` one is served at the root itself.
- Progressive enhancement: without JS, or when `versions.json` does not load,
  the header keeps its plain version badge.
- With JS, a `<select>` named "Version" lists the versions:
  - Wider than 30rem: in the header, in place of the version badge, or after
    the brand when there is no badge. `--control` high, 0.85rem text.
  - 30rem and below: the first row of the menu drawer (the element that the
    menu button's `aria-controls` names), as wide as the drawer, `--target`
    high, 1rem (16px) text so a phone does not zoom on focus. A page with no
    menu button shows it in a strip under the header.
  - The header's version badge is hidden while the selector shows.
- Picking a version goes to the same page in it when that page exists (a
  `HEAD` request), else to its home page. An open menu closes first.
- Old version banner: on a page of a version that is not the latest, a
  `role=note` strip under the header, in `--mark-bg`, says so and links the
  same page in the latest version. `dev` gets its own text. The strip is under
  the header, not above it, so the skip links stay the first tab stops.

### Language selector

Source: `_partials/lang-select.html`, `lang-redirect.html`, `_lang.scss`,
`_partials/seo.html`.

- Only a site with two or more languages has it (`hugo.Sites`). The options are
  built at build time, so the page's links are right without JavaScript.
- A `<select>` labelled "Language", like the version selector, with one option
  per language, in the order of the site's languages. An option's value is this
  page in that language when the page has that translation (its
  `AllTranslations`), else that language's home. The current language is the
  selected option. Each option has `lang` and `data-lang-pick`.
- Look and size follow the version selector: `--control` high and 0.85rem text
  above 30rem; under 30rem, as wide as the drawer, `--target` high, 1rem (16px)
  text so a phone does not zoom on focus.
- The header has the select from 30rem up; the menu has it under 30rem. The menu
  order is fixed: the version select first (selector.js puts it at the top of
  the drawer, when the site has versions and runs its script), then the language
  select, then the tree. Without the version select, the language select is the
  first row. The two copies sit in a `role="group"`, not a landmark, and the
  hidden copy is out of the accessibility tree, so a screen reader meets one
  "Language" control.
- Without JavaScript the select is hidden and a `<noscript>` shows the same
  languages as a list of links, the current one marked `aria-current`.
- A change of the select stores the language in `localStorage` as `docs-lang`
  and goes to the option's value (`lang-redirect.html`).
- The redirect is a script at the top of the head, before the first paint. It
  runs only on an arrival from outside the site: a referrer that does not start
  with the site's root (the origin and the first folder of baseURL, the same for
  every version of the site) counts as outside, so a sibling docs site of the
  same origin does too. The stored pick wins when the page has that language;
  with no pick, the browser's first language the site has moves only a reader of
  the default language. A page with no version in the wanted language stays. It
  replaces the history entry (`location.replace`). A Back navigation never
  redirects, and a `pageshow` puts the select back to its own language, so Back
  to a page the reader left by a change does not send them forward again.
- `hreflang` in the head (`seo.html`): one link per translation, the page itself
  included, and `x-default` to the default language's page; `og:locale` and
  `og:locale:alternate` take each language's `params.ogLocale`. Only a page with
  two or more translations has them.
- Versions: the version selector keeps the language (`selector.js` reads the
  stored pick, else the page's language, and the version's `languages`); a
  version with no page in that language shows the English page, then the
  version's home.
- Translation notice (`page-notice.html`, a site's copy): a
  `.translation-notice` box above the content, with a `--border` line, `--muted`
  text and `--radius`. It is as wide as the content and does not scroll
  sideways.

### Pager

Source: `_partials/pager.html`, `nav-order.html`, `_pager.scss`.

- Previous and Next links end each page. Their order is the tree flattened depth
  first (`nav-order.html`), so the pager follows the sidebar.
- The home page is not in that order, so the pager starts at its first child. A
  page outside the tree gets no pager.
- Wide: two columns. Next stays on the right, even when it is alone. At 50rem
  and below: one column, Next aligned left. The pager is hidden in print.

### Code blocks and samples

Source: `_markup/render-codeblock.html`, `_code.scss`.

- `input` and `output` blocks are samples: dashed boxes labeled Input or Output.
  The labels are i18n keys in `i18n/en.toml`.
- A prose block is text for a reader to paste, not a program: a prompt for a
  coding agent. It is a ```` ```prompt ```` fence, labeled Prompt like the
  samples, in a solid box like code. It keeps its line breaks and wraps long
  lines at every width (`white-space: pre-wrap`, `overflow-wrap: anywhere`),
  so it never scrolls sideways. It is not a program, so a test that runs the
  examples of a site skips it, as it skips signature blocks.
- `expect="CODE"` adds an accent box under the code. It says "Does not compile",
  or "Runtime error" for `RUNTIME-` codes, and shows `error[CODE]`.
- Code and tables scroll sideways in their own box. The exception is a signature
  block: a ```` ```signature ```` fence, one `Name(...) -> Type` per line.
  `render-codeblock.html` wraps it in `div.signature`, and `_code.scss` lets it
  wrap at any character, each line hanging one step. `highlight.mjs` colors it
  with the classes of the code blocks: module (`m`), function (`nf`), parameter
  names (`s`), types (`nc`) and `->` (`k`). It is not a program, so a test that
  runs the examples of a site skips it. Output, diagnostics and imports stay
  `text` and keep scrolling.
- Copy button (`copy.js`, `_code.scss`): every code block, prompt, signature
  block and input sample has a "Copy" button that copies the text of its
  block. Output samples and the error box have none. The button sits in a row
  above the block, on the right, with the label (Prompt, Input) on the left
  when there is one. So it never covers the code, at 390px too. It looks like
  the page actions (`--code-bg`, `--border`, `--radius`, focus ring), is
  `--target` high at 50rem and below, and works in light and dark. Its labels
  are i18n keys in `i18n/en.toml`. Its name says what it copies ("Copy code",
  "Copy prompt"). A `role=status` region announces "Copied" or "Copy failed",
  and the text goes back after 2s. Like "Copy link", it shows only with JS and
  a clipboard. Hidden in print. `copy.js` builds the button, and the bar of a
  block with no label, from a `data-code-copy` attribute on the block. The
  HTML has no button text, so "Copy" never reaches a page's summary, its
  description or the search index.

### Footer

Source: `_partials/footer.html`, `_footer.scss`.

- Centered, `--muted`, under a `--border` line. Lines: the version and release
  links; the page source and GitHub links (`repoPublic`), or the title and
  tagline; then a link to the org home ("Agentica home", the `organization`
  URL), left out on the org home's own site.

### Search, page actions and headings

- Search (`search.js`, `_search.scss`): plain JS; the index loads on the first
  focus. `/` focuses the box unless focus is in a text field. Ctrl+K and Cmd+K
  focus it in any case. Arrow keys and Enter pick a result. Escape closes the
  list, then clears the box, then leaves it.
- Page actions (`page-actions.js`, `_actions.scss`): a "Copy page" button and a
  menu (View Source, Open in ChatGPT, Open in Claude). JS only. Without a
  clipboard, the copy items are removed. Escape closes the menu.
- Headings (`_markup/render-heading.html`): each heading below h1 has a `#`
  link, shown on hover or focus.
- Share links (`_partials/share.html`, `share.js`, `_share.scss`): at the end
  of a post, under a rule, a row of buttons that wraps: X, LinkedIn,
  Hacker News, Reddit, Bluesky (text, no logos, new tab) and "Copy link". They
  look like the page actions and are `--target` high at 50rem and below.
  "Copy link" shows only with JS and a clipboard. Hidden in print.

## Accessibility

- Native first: `<button>` for controls, `<details>` and `<summary>` for the
  tree, `<a>` for links.
- Targets are at least 24px square everywhere. On narrow pages the tree rows
  are `--target` (2.75rem). The header controls are `--control` (36px) at
  every width; the menu and theme buttons reach 44px through their `::before`.
  The breadcrumb and footer links are at least 24px high. Links inside running
  text, such as heading anchors, are exempt.
- Forced colors: the chevron is a mask. Under `forced-colors: active` it uses
  `CanvasText`, and focus outlines stay. Reduced motion: see Motion & Focus.
- Without JS the page works: the content comes first, the tree is a list, and
  the system color setting applies. The menu button, theme button, search,
  page actions, "Copy link" and the code copy buttons stay hidden. The version
  selector does not show; the version badge does.

## Rules for Changes

- Reuse tokens. Add one only when a value repeats or changes with the theme. A
  color token needs a light value on `:root` and a dark value in the `dark`
  mixin, in the same change. Check each color, shadow and scrim in both themes.
- Colors live in `_tokens.scss`. The `themeColor` param in `hugo.toml` copies
  the light and dark `--bg`, so it must change with them. The chevron mask in
  `_layout.scss` uses black, which sets only the shape.
- No runtime dependency. Hugo, Dart Sass and the Node highlighter run at build
  time (`Makefile`). The browser loads only the built CSS and JS. No CDN, web
  font or outside script. The one exception is the favicon:
  `_partials/favicon.html` links the org icons of www.agentica-lang.com by
  absolute URL, so every project site shows the same icon.
- Vanilla JS: one small file per feature in `assets/js/`, bundled by Hugo's
  `js.Build`, loaded with `defer` and an `integrity` hash. No framework and no
  library. The one exception is the version selector (`assets/versions/`),
  which every version loads from the site's root, so it has a fixed name and
  no hash.
- Phone check: check a visible change at 390px wide, in light and dark, with
  headless Chromium and device emulation (a 390x900 viewport, as Playwright
  sets it): `--window-size` does not go below 500px. The page has no sideways
  scroll, and a long line in a prose block wraps. Put the screenshots in the
  PR.
- `make example` must pass. It runs Hugo with `--panicOnWarning`, then the
  highlighter with `--strict`. CI runs it on every PR.
- Describe the current state here. Progress goes in the PR body. Update this
  file in the same PR as the change it describes, or, for a new design, in a
  PR of its own just before the code.
- Content rules (prose wrap, fences, links) belong to each site's repo.
