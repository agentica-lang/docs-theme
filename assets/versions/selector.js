// The version selector and the old-version banner (DESIGN.md, Version selector). Every page of every version loads
// this one file from the root of the site (_partials/versions.html), so an old build gets the current one. Pages built
// without the theme load it too, so it uses only what they share: `.site-header`, its `.brand` and `.version` links,
// the menu button (`.nav-toggle`, whose aria-controls names the menu) and the tokens of _tokens.scss.
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script || !window.fetch || !window.URL) return;
  var root = new URL("../", script.src);

  // The page's strings (the theme-strings block of baseof.html). A page built before that block has none: English.
  var English = {
    version_label: "Version",
    latest: "(latest)",
    view_in_version: "View this page in {version}",
    version_dev_note: "This is the development documentation: it may describe changes that are not released.",
    version_old_note: "This is the documentation of version {version}, not the latest release."
  };
  var page = {};
  try { page = JSON.parse(document.getElementById("theme-strings").textContent); } catch (e) {}
  function t(key) {
    return page[key] || English[key];
  }

  // selector.css is linked next to this script, so the page is styled when it runs.
  fetch(new URL("versions.json", root).href)
    .then(function (response) { return response.json(); })
    .then(start)
    .catch(function () {});

  // An entry whose folder resolves outside the root (another origin, a `javascript:` URL) is left out.
  function underRoot(v) {
    if (!v || typeof v.version !== "string" || typeof v.path !== "string") return false;
    try {
      var target = new URL(v.path, root);
      return target.origin === root.origin && target.pathname.indexOf(root.pathname) === 0;
    } catch (e) {
      return false;
    }
  }

  function start(list) {
    // A page may load the selector twice (the theme's tags and a pair added by a site's build): only the first runs.
    if (document.documentElement.classList.contains("has-version-select")) return;
    var versions = (Array.isArray(list) ? list : []).filter(underRoot);
    if (!versions.length || location.pathname.indexOf(root.pathname) !== 0) return;
    var latest = versions.filter(function (v) { return v.latest; })[0] || versions[0];
    var rest = location.pathname.slice(root.pathname.length);
    // The root is the latest release; a version's own folder starts with its path.
    var current = versions.filter(function (v) { return rest.indexOf(v.path) === 0; })[0];
    var page = current ? rest.slice(current.path.length) : rest;
    current = current || latest;

    function home(v) {
      return new URL(v.latest ? "" : v.path, root).href;
    }

    function url(v) {
      return new URL((v.latest ? "" : v.path) + page, root).href + location.hash;
    }

    // The menu button, in every release (see menu() below).
    var header = document.querySelector(".site-header");
    var toggle = header && header.querySelector(".nav-toggle");

    // The same page in another version when it exists there, else that version's home page. An open menu is closed
    // first, with the button's own click, so that a page restored from the back-forward cache is not left with the
    // menu open and the page behind it inert.
    function go(v) {
      if (toggle && toggle.getAttribute("aria-expanded") === "true") toggle.click();
      var target = url(v);
      fetch(target.split("#")[0], { method: "HEAD" })
        .then(function (response) { return response.ok ? target : home(v); })
        .catch(function () { return home(v); })
        .then(function (href) { location.assign(href); });
    }

    var select = document.createElement("select");
    select.className = "version-select";
    select.setAttribute("aria-label", t("version_label"));
    versions.forEach(function (v) {
      var option = document.createElement("option");
      option.value = v.version;
      option.textContent = v.version + (v.latest ? " " + t("latest") : "");
      option.selected = v === current;
      select.appendChild(option);
    });
    select.addEventListener("change", function () {
      go(versions.filter(function (v) { return v.version === select.value; })[0]);
    });

    // A strip under the header, for the banner of an old version. The selector sits in it only when it fits nowhere else
    // (see place()). Under the header, not above: the skip links are the first children of the header and must stay
    // the first tab stops.
    var bar = document.createElement("div");
    bar.className = "version-bar";
    if (current !== latest) {
      var note = document.createElement("span");
      var link = document.createElement("a");
      link.href = url(latest);
      link.textContent = t("view_in_version").replace("{version}", latest.version);
      link.addEventListener("click", function (event) {
        event.preventDefault();
        go(latest);
      });
      note.append(
        (current.version === "dev"
          ? t("version_dev_note")
          : t("version_old_note").replace("{version}", current.version)) + " ",
        link,
        "."
      );
      bar.setAttribute("role", "note");
      bar.appendChild(note);
    }

    var badge = header && header.querySelector(".version");
    var brand = header && header.querySelector(".brand");
    var phone = window.matchMedia("(max-width: 30rem)");

    // The menu the button opens, when the button shows: a phone has no room for the selector in the header (the search
    // box and the buttons need it). Every release has the button and its menu; one where the button is hidden has no
    // drawer, and the selector goes to the strip.
    function menu() {
      var target = toggle && document.getElementById(toggle.getAttribute("aria-controls"));
      return target && toggle.getClientRects().length ? target : null;
    }

    function place() {
      var drawer = phone.matches ? menu() : null;
      // Moving a node drops its focus; a reader who is using the selector while the window is resized keeps it.
      var focused = document.activeElement === select;
      select.classList.toggle("in-menu", !!drawer);
      if (drawer) {
        drawer.insertBefore(select, drawer.firstChild);
      } else if (header && !phone.matches) {
        header.insertBefore(select, badge || (brand && brand.nextSibling) || null);
      } else {
        bar.appendChild(select);
      }
      if (!bar.parentNode) {
        if (header) header.parentNode.insertBefore(bar, header.nextSibling);
        else document.body.insertBefore(bar, document.body.firstChild);
      }
      bar.hidden = !bar.children.length;
      if (focused) select.focus();
    }

    // The selector shows the version, so the header's own badge goes (selector.css; some releases show it again on a
    // phone, so the `hidden` attribute would lose to their CSS).
    document.documentElement.classList.add("has-version-select");
    place();
    if (phone.addEventListener) phone.addEventListener("change", place);
    // Back to this page from another version: the browser may restore the page with the old selection.
    window.addEventListener("pageshow", function () { select.value = current.version; });
  }
})();
