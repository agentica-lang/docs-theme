# Builds the example site with the theme, as CI does: Hugo (a warning fails), then the highlighter.

.PHONY: example example-serve clean

DART_SASS ?= $(HOME)/.local/opt/dart-sass
export PATH := $(DART_SASS):$(PATH)

highlight/node_modules: highlight/package.json highlight/package-lock.json
	npm ci --prefix highlight --ignore-scripts --no-audit --no-fund
	touch $@

example: highlight/node_modules
	@command -v sass >/dev/null || { echo "The theme needs Dart Sass: put its sass on PATH or in $(DART_SASS)" >&2; exit 1; }
	hugo --cleanDestinationDir --source exampleSite --panicOnWarning
	node highlight/highlight.mjs --strict exampleSite/public
	@# The outputs come from the theme's hugo.toml: a site without `_merge = "deep"` has none of them.
	@for f in search.json llms.txt llms-full.txt index.md guide/code/index.md; do \
	  test -s exampleSite/public/$$f || { echo "exampleSite/public/$$f is missing" >&2; exit 1; }; \
	done
	@# A Go format error in a template (printf of a missing param) prints %!s(<nil>) and no warning.
	@! grep -rl '%!' exampleSite/public || { echo "a template printed a format error" >&2; exit 1; }

example-serve:
	hugo server --source exampleSite

clean:
	rm -rf exampleSite/public exampleSite/resources highlight/node_modules
