(() => {
  const host = document.getElementById("navbar");
  if (!host) return;

  fetch("navbar.html")
    .then((res) => res.text())
    .then((html) => {
      host.innerHTML = html;
      setActiveNav();
    })
    .catch(() => {
      host.innerHTML = "";
    });

  function setActiveNav() {
    const links = Array.from(host.querySelectorAll(".nav__link"));
    links.forEach((link) => link.classList.remove("is-active"));

    const path = window.location.pathname.toLowerCase();
    const bodyTag = (document.body?.dataset?.tag || "").toLowerCase();

    let active = "home";
    if (bodyTag === "sale") active = "sale";
    if (bodyTag === "new") active = "new";
    if (bodyTag === "best") active = "best";

    if (path.endsWith("/giaysneaker") || path.endsWith("/giaysneaker.html") || path.endsWith("/sneakers")) {
      active = "sneakers";
    }
    if (path.endsWith("/newproducts.html")) active = "new";
    if (path.endsWith("/bestsellers.html")) active = "best";
    if (path.endsWith("/support.html")) active = "support";
    if (path.endsWith("/sale.html")) active = "sale";
    if (path === "/" || path.endsWith("/index.html")) active = "home";

    const activeLink = host.querySelector(`.nav__link[data-nav="${active}"]`);
    activeLink?.classList.add("is-active");
  }
})();
