# Builds the example site with the theme, as CI does: Hugo (a warning fails), then the highlighter.

.PHONY: example example-serve clean

DART_SASS ?= $(HOME)/.local/opt/dart-sass
export PATH := $(DART_SASS):$(PATH)

highlight/node_modules: highlight/package.json highlight/package-lock.json
	npm ci --prefix highlight --ignore-scripts --no-audit --no-fund
	touch $@

# Three builds, OUTPUT:CONFIG: all the params, no version and no repo (bare.toml), and a tag prefix (prefix.toml).
# Each must have the outputs of the theme's hugo.toml (they need `_merge = "deep"`) and no Go format error, which a
# printf of a missing param writes (%!s(<nil>), or %25!s(%3cnil%3e) in a URL) with no Hugo warning.
EXAMPLES := public:hugo.toml public-bare:hugo.toml,bare.toml public-prefix:hugo.toml,prefix.toml

example: highlight/node_modules
	@command -v sass >/dev/null || { echo "The theme needs Dart Sass: put its sass on PATH or in $(DART_SASS)" >&2; exit 1; }
	@set -e; for build in $(EXAMPLES); do \
	  out=$${build%%:*}; \
	  echo "hugo --source exampleSite --config $${build#*:} --destination $$out"; \
	  hugo --quiet --cleanDestinationDir --source exampleSite --config $${build#*:} --destination $$out --panicOnWarning; \
	  node highlight/highlight.mjs --strict exampleSite/$$out; \
	  for f in search.json llms.txt llms-full.txt index.md guide/code/index.md; do \
	    test -s exampleSite/$$out/$$f || { echo "exampleSite/$$out/$$f is missing" >&2; exit 1; }; \
	  done; \
	  if grep -rlE '%!|%25!|<nil>|%3cnil%3e' exampleSite/$$out; then echo "a template printed a format error" >&2; exit 1; fi; \
	done
	@# Each build has the release links it should, and only those.
	@grep -q 'releases/tag/0.1.0' exampleSite/public/index.html
	@grep -q 'releases/tag/v0.1.0' exampleSite/public-prefix/index.html
	@if grep -rl 'releases' exampleSite/public-bare; then echo "a build with no version or repo has release links" >&2; exit 1; fi

example-serve:
	hugo server --source exampleSite

clean:
	rm -rf exampleSite/public exampleSite/public-bare exampleSite/public-prefix exampleSite/resources highlight/node_modules
