const clipboard = window.isSecureContext ? navigator.clipboard : undefined;
for (const root of clipboard?.writeText ? document.querySelectorAll(".share") : []) {
  const button = root.querySelector(".share-copy");
  const text = root.querySelector(".share-copy-text");
  const status = root.querySelector("[role=status]");
  let timer;
  const show = (message) => {
    text.textContent = message;
    status.textContent = message;
    clearTimeout(timer);
    timer = setTimeout(() => {
      text.textContent = "Copy link";
      status.textContent = "";
    }, 2000);
  };
  button.addEventListener("click", () => {
    clipboard.writeText(button.dataset.url).then(() => show("Copied"), () => show("Copy failed"));
  });
  button.closest("li").hidden = false;
}
