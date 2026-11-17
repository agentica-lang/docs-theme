# Builds the example site with the theme, as CI does: Hugo (a warning fails), then the highlighter.

.PHONY: example example-serve check-seo clean

DART_SASS ?= $(HOME)/.local/opt/dart-sass
export PATH := $(DART_SASS):$(PATH)

# The example site uses this checkout as its theme, whatever the checkout's folder is named: a link to it, in a themes
# folder that HUGO_THEMESDIR names (it wins over themesDir in exampleSite/hugo.toml).
export HUGO_THEMESDIR := $(CURDIR)/exampleSite/.themes

exampleSite/.themes/docs-theme:
	mkdir -p exampleSite/.themes
	ln -sfn ../.. $@

highlight/node_modules: highlight/package.json highlight/package-lock.json
	npm ci --prefix highlight --ignore-scripts --no-audit --no-fund
	touch $@

# Five builds, OUTPUT:CONFIG: all the params, no version and no repo (bare.toml), a tag prefix (prefix.toml), every
# search tag off (off.toml), and the version selector on (versions.toml). tools/check-seo.mjs checks the search tags of each.
# Each must have the outputs of the theme's hugo.toml (they need `_merge = "deep"`) and no Go format error, which a
# printf of a missing param writes (%!s(<nil>), or %25!s(%3cnil%3e) in a URL) with no Hugo warning.
EXAMPLES := public:hugo.toml public-bare:hugo.toml,bare.toml public-prefix:hugo.toml,prefix.toml public-off:hugo.toml,off.toml \
  public-versions:hugo.toml,versions.toml

example: highlight/node_modules exampleSite/.themes/docs-theme
	@command -v sass >/dev/null || { echo "The theme needs Dart Sass: put its sass on PATH or in $(DART_SASS)" >&2; exit 1; }
	@set -e; for build in $(EXAMPLES); do \
	  out=$${build%%:*}; \
	  echo "hugo --source exampleSite --config $${build#*:} --destination $$out"; \
	  hugo --quiet --cleanDestinationDir --source exampleSite --config $${build#*:} --destination $$out --panicOnWarning; \
	  node highlight/highlight.mjs --strict exampleSite/$$out; \
	  for f in search.json llms.txt llms-full.txt index.md guide/code/index.md; do \
	    test -s exampleSite/$$out/$$f || { echo "exampleSite/$$out/$$f is missing" >&2; exit 1; }; \
	  done; \
	  if grep -rlIE '%!|%25!|<nil>|%3cnil%3e' exampleSite/$$out; then echo "a template printed a format error" >&2; exit 1; fi; \
	  node tools/check-seo.mjs exampleSite/$$out $$(test $$out = public-off && echo --off); \
	done
	@# A one-line def keeps the colors of its body: the `#` of `#{` there is not a comment.
	@grep -q 'class=nf>shade</span>(c: .*<span class=si>#{</span>' exampleSite/public/guide/code/index.html || \
	  { echo "the interpolation in a one-line def is not colored" >&2; exit 1; }
	@# Each build has the release links it should, and only those.
	@grep -q 'releases/tag/0.1.0' exampleSite/public/index.html
	@grep -q 'releases/tag/v0.1.0' exampleSite/public-prefix/index.html
	@if grep -rl 'releases' exampleSite/public-bare; then echo "a build with no version or repo has release links" >&2; exit 1; fi
	@# `search: false` (reference.md) hides the box and its script on that page only.
	@if grep -lE 'search-input|js/search' exampleSite/public/reference/index.html; then echo "a page with search: false has the search box" >&2; exit 1; fi
	@grep -q 'search-input' exampleSite/public/guide/index.html
	@# Search off for the whole site (bare.toml, the string "false"), on for the one page that sets `search: true`.
	@if grep -lE 'search-input|js/search' exampleSite/public-bare/guide/index.html; then echo "search: false of the site does not hide the box" >&2; exit 1; fi
	@grep -q 'search-input' exampleSite/public-bare/guide/search/index.html
	@# The 404 page points to the search box only when it has one.
	@grep -q 'Search for it with the box at the top' exampleSite/public/404.html
	@if grep -q 'Search for it' exampleSite/public-bare/404.html; then echo "the 404 page of a site with no search box mentions it" >&2; exit 1; fi
	@# A section of empty sections (guide/archive) is not in the sitemap; a protocol-relative image gets https.
	@if grep -q 'guide/archive' exampleSite/public/sitemap.xml; then echo "the sitemap lists an empty section" >&2; exit 1; fi
	@grep -qE 'og:image"? content="?https://www.agentica-lang.com/icon-192.png' exampleSite/public-prefix/index.html
	@# A bundle's cover is its large card, a 1200px jpg; the other pages keep the summary card.
	@grep -qE 'og:image"? content="?https://agentica-lang.github.io/docs-theme/blog/first-post/cover_[^"> ]*\.jpg' exampleSite/public/blog/first-post/index.html
	@grep -qE 'og:image:width"? content="?1200"?>' exampleSite/public/blog/first-post/index.html
	@grep -qE 'twitter:card"? content="?summary_large_image"?>' exampleSite/public/blog/first-post/index.html
	@# A page with no image gets the theme's org card, 1200x630, unless the site sets `image` (prefix.toml).
	@grep -qE 'og:image"? content="?https://agentica-lang.github.io/docs-theme/images/social[^"> ]*\.png"?>' exampleSite/public/guide/index.html
	@grep -qE 'og:image:width"? content="?1200"?>' exampleSite/public/guide/index.html
	@grep -qE 'og:image:alt"? content="Agentica: Ruby with static types"' exampleSite/public/guide/index.html
	@grep -qE 'twitter:card"? content="?summary_large_image"?>' exampleSite/public/guide/index.html
	@grep -qE 'twitter:card"? content="?summary"?>' exampleSite/public-prefix/guide/index.html
	@# The footer links the org home.
	@grep -qE '<a href="?https://www.agentica-lang.com/"?>Agentica home</a>' exampleSite/public/guide/index.html
	@# A post (a page with a date) is an article with share links; the other pages are not.
	@grep -qE 'og:type"? content="?article"?>' exampleSite/public/blog/first-post/index.html
	@grep -qE 'article:published_time"? content="?2026-11-17T09:30:00' exampleSite/public/blog/second-post/index.html
	@grep -qE 'article:modified_time"? content="?20[0-9]{2}-' exampleSite/public/blog/second-post/index.html
	@grep -qE 'og:type"? content="?website"?>' exampleSite/public/guide/index.html
	@grep -qF 'href="https://x.com/intent/post?url=https%3A%2F%2Fagentica-lang.github.io%2Fdocs-theme%2Fblog%2Fsecond-post%2F&amp;text=The+second+post+%26+its+card"' exampleSite/public/blog/second-post/index.html
	@if grep -l 'class=share' exampleSite/public/guide/index.html exampleSite/public-bare/blog/first-post/index.html; then echo "share links on a page that is not a post, or with share off" >&2; exit 1; fi
	@# The first `images` entry is the large card; a URL has no size. The site's socialImage, under static/, has one.
	@grep -qE 'og:image"? content="?https://www.agentica-lang.com/social.png"?>' exampleSite/public/blog/second-post/index.html
	@grep -qE 'og:image:alt"? content="The Agentica name on a dark background"' exampleSite/public/blog/second-post/index.html
	@if grep -q 'og:image:width' exampleSite/public/blog/second-post/index.html; then echo "a remote image has a size" >&2; exit 1; fi
	@grep -qE 'og:image"? content="?https://agentica-lang.github.io/docs-theme/social.png"?>' exampleSite/public-bare/guide/index.html
	@grep -qE 'og:image:height"? content="?630"?>' exampleSite/public-bare/guide/index.html
	@grep -qE 'twitter:card"? content="?summary_large_image"?>' exampleSite/public-bare/guide/index.html
	@# A prompt block wraps. copy.js builds a Copy button on each block with data-code-copy: code, signature, input and
	@# prompt blocks, not output samples. The HTML has no button, so no "Copy" in the summaries or the search index.
	@grep -qE '<div class="?code-block prompt"? data-code-copy="?prompt"?><div class="?code-bar"?><span class="?sample-label"?>Prompt</span></div>' exampleSite/public/guide/code/index.html
	@test "$$(grep -oE 'data-code-copy="?code"?[ >]' exampleSite/public/guide/code/index.html | wc -l)" = 3 || \
	  { echo "guide/code: wants data-code-copy on each of its 3 code blocks" >&2; exit 1; }
	@grep -qE 'data-code-copy="?input"?[ >]' exampleSite/public/guide/code/index.html
	@grep -qE 'data-code-copy="?signature"?[ >]' exampleSite/public/reference/index.html
	@if grep -qE 'sample-output"? data-code-copy' exampleSite/public/guide/code/index.html; then echo "an output sample has a Copy button" >&2; exit 1; fi
	@if grep -qw 'Copy' exampleSite/public/search.json; then echo "search.json has the Copy button's text" >&2; exit 1; fi
	@if grep -qE '<button[^>]*code-copy' exampleSite/public/guide/code/index.html; then echo "the HTML has a Copy button; copy.js builds it" >&2; exit 1; fi
	@# A summary over 160 characters becomes a description cut at a word, with an ellipsis.
	@grep -qE 'name="?description"? content="Tom &(amp;)? Jerry[^"]{100,150}…"' exampleSite/public/guide/no-description/index.html
	@grep -qE 'js/copy\.[0-9a-f]+\.js' exampleSite/public/guide/code/index.html
	@if grep -q 'js/copy' exampleSite/public/guide/index.html; then echo "a page with no code block loads copy.js" >&2; exit 1; fi
	@# check-seo follows a sitemap index to the sitemaps of this build and skips those of other sites.
	@mv exampleSite/public-prefix/sitemap.xml exampleSite/public-prefix/sitemap-home.xml
	@printf '<sitemapindex><sitemap><loc>%s</loc></sitemap><sitemap><loc>%s</loc></sitemap></sitemapindex>' \
	  https://agentica-lang.github.io/docs-theme/sitemap-home.xml https://agentica-lang.github.io/other/sitemap.xml > exampleSite/public-prefix/sitemap.xml
	@node tools/check-seo.mjs exampleSite/public-prefix
	@printf '<sitemapindex><sitemap><loc>https://agentica-lang.github.io/other/sitemap.xml</loc></sitemap></sitemapindex>' > exampleSite/public-prefix/sitemap.xml
	@if node tools/check-seo.mjs exampleSite/public-prefix 2>/dev/null; then echo "a sitemap index with no sitemap of the build passes" >&2; exit 1; fi
	@# The version selector loads only when on: its two files under _versions/ and one tag each in every page's head.
	@for b in public public-bare public-prefix public-off; do \
	  if test -e exampleSite/$$b/_versions || grep -rlI '_versions/' exampleSite/$$b; then echo "$$b has the version selector, which is off" >&2; exit 1; fi; \
	done
	@test -s exampleSite/public-versions/_versions/selector.js && test -s exampleSite/public-versions/_versions/selector.css
	@for f in index.html guide/code/index.html 404.html; do \
	  test "$$(grep -oE '(href|src)="?/docs-theme/_versions/selector\.(css|js)' exampleSite/public-versions/$$f | wc -l)" = 2 || \
	    { echo "exampleSite/public-versions/$$f does not load the selector from the root once" >&2; exit 1; }; \
	done
	@# Each version of a site is built with the selector on from the environment, loading it from the root of all versions,
	@# which is not its own: that build publishes no copy.
	@HUGO_PARAMS_VERSIONS_ENABLED=true HUGO_PARAMS_VERSIONS_ROOT=/site hugo --quiet --cleanDestinationDir --source exampleSite \
	  --config hugo.toml --baseURL https://example.org/site/0.1.0/ --destination public-env --panicOnWarning
	@grep -qE 'src="?/site/_versions/selector\.js"? defer' exampleSite/public-env/guide/index.html
	@if test -e exampleSite/public-env/_versions; then echo "a build under the root publishes the selector" >&2; exit 1; fi
	@# A relative link written as a page (`x.md`, `../x/`) that reaches no page warns, so --panicOnWarning fails it.
	@n=$$(hugo --source exampleSite --config hugo.toml,broken.toml --destination public-broken 2>&1 | grep -c 'no page for link'); \
	  test "$$n" = 2 || { echo "expected 2 warnings for exampleSite/broken/links.md, got $$n" >&2; exit 1; }

example-serve: exampleSite/.themes/docs-theme
	hugo server --source exampleSite

# The search tag checks of a built site, for a site's CI: make -C themes/docs-theme check-seo DIR="$PWD/public"
check-seo:
	@test -n "$(DIR)" || { echo "usage: make check-seo DIR=<the built site>" >&2; exit 1; }
	node tools/check-seo.mjs "$(DIR)"

clean:
	rm -rf exampleSite/public exampleSite/public-broken exampleSite/public-bare exampleSite/public-prefix exampleSite/public-off \
	  exampleSite/public-versions exampleSite/public-env exampleSite/resources highlight/node_modules
