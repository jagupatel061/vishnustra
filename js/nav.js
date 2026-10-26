/* Shared top bar for every page. Put <header class="nav" id="nav"></header> in the page
   and set data-page on <body> (home, atlas, portal, room, rishi, mudra, observatory, snap). */
(function () {
  const page = document.body.dataset.page || "home";
  const links = [
    ["home", "index.html", "Home"],
    ["atlas", "index.html#atlas", "Atlas"],
    ["time", "index.html#time", "Time Machine"],
    ["rishi", "rishi.html", "Rishi AI"],
    ["mudra", "mudra.html", "Mudra"],
    ["observatory", "observatory.html", "Observatory"],
    ["portal", "portal.html", "Sky Portal"],
    ["snap", "snap.html", "Snap"],
  ];
  const el = document.getElementById("nav");
  if (!el) return;
  el.innerHTML = `
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="Vishnustra home">
      <svg width="44" height="44" viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="21" fill="none" stroke="#f4c542" stroke-width=".8"/><circle cx="23" cy="23" r="14" fill="none" stroke="#f4c542" stroke-width=".6" stroke-dasharray="1 2.5"/><path d="M23 6 L25 21 L40 23 L25 25 L23 40 L21 25 L6 23 L21 21Z" fill="#f4c542"/></svg>
      <span><span class="brand-name">VISHNUSTRA</span><span class="brand-sub">Ancient wisdom · modern exploration</span></span>
    </a>
    <nav class="nav-links" aria-label="Main">
      ${links.map(([k, href, label]) => `<a href="${href}"${k === page ? ' class="on" aria-current="page"' : ""}>${label}</a>`).join("")}
    </nav>
    <div class="nav-tools">
      <a class="nav-data" href="admin.html">Backend</a>
      <a class="btn nav-room" href="room.html">QR Room</a>
      <button class="circle-btn nav-menu" type="button" aria-label="Menu" aria-expanded="false">☰</button>
    </div>
  </div>
  <nav class="nav-drawer" hidden aria-label="Menu">
    ${links.map(([k, href, label]) => `<a href="${href}">${label}</a>`).join("")}
    <a href="room.html">QR Room</a>
    <a href="admin.html">Backend data</a>
  </nav>`;
  const btn = el.querySelector(".nav-menu"), drawer = el.querySelector(".nav-drawer");
  btn.addEventListener("click", () => {
    drawer.hidden = !drawer.hidden;
    btn.setAttribute("aria-expanded", String(!drawer.hidden));
  });
  drawer.addEventListener("click", (e) => { if (e.target.tagName === "A") drawer.hidden = true; });
})();
