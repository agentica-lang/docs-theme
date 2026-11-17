const clipboard = window.isSecureContext ? navigator.clipboard : undefined;
const blocks = clipboard?.writeText ? document.querySelectorAll("[data-code-copy]") : [];
const icon =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/>' +
  '<path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"/></svg>';
if (blocks.length) {
  const status = document.createElement("span");
  status.className = "visually-hidden";
  status.setAttribute("role", "status");
  document.body.append(status);
  for (const block of blocks) {
    let bar = block.querySelector(":scope > .code-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "code-bar";
      block.prepend(bar);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy";
    button.setAttribute("aria-label", `Copy ${block.dataset.codeCopy}`);
    button.innerHTML = `${icon}<span class="code-copy-text">Copy</span>`;
    bar.append(button);
    const text = button.querySelector(".code-copy-text");
    const code = block.querySelector("pre code");
    let timer;
    const show = (message) => {
      text.textContent = message;
      status.textContent = message;
      clearTimeout(timer);
      timer = setTimeout(() => {
        text.textContent = "Copy";
        status.textContent = "";
      }, 2000);
    };
    button.addEventListener("click", () => {
      clipboard.writeText(code.textContent.replace(/\n$/, "")).then(() => show("Copied"), () => show("Copy failed"));
    });
  }
}
