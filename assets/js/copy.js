const clipboard = window.isSecureContext ? navigator.clipboard : undefined;
const buttons = clipboard?.writeText ? document.querySelectorAll(".code-copy") : [];
if (buttons.length) {
  const status = document.createElement("span");
  status.className = "visually-hidden";
  status.setAttribute("role", "status");
  document.body.append(status);
  for (const button of buttons) {
    const text = button.querySelector(".code-copy-text");
    const code = button.closest(".code-block, .sample").querySelector("pre code");
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
    button.hidden = false;
    button.parentElement.hidden = false;
  }
}
