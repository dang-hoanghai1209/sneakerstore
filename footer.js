(() => {
  const host = document.getElementById("footer");
  if (!host) return;

  fetch("footer.html")
    .then((res) => res.text())
    .then((html) => {
      host.innerHTML = html;
    })
    .catch(() => {
      host.innerHTML = "";
    });
})();
