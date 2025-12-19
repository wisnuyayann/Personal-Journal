/* ---------------------------
   Utilities
---------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function clampStr(s, n = 140) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1).trim() + "…" : s;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------------------
   Data (EDIT HERE ONLY)
---------------------------- */
const TRIPS = [
  {
    id: "bdg-2024",
    title: "Bandung — Hujan & Kopi",
    location: "Bandung",
    year: 2024,
    cover: "assets/img/cover-1.jpg",
    desc: "Jalan kaki panjang, suasana dingin, dan ritme kota yang bikin pikiran pelan-pelan rapi lagi.",
    tags: ["city", "coffee", "rain"]
  },
  {
    id: "yog-2023",
    title: "Yogyakarta — Pagi yang Pelan",
    location: "Yogyakarta",
    year: 2023,
    cover: "assets/img/cover-2.jpg",
    desc: "Bangun lebih pagi dari biasanya. Menemukan bahwa 'pelan' itu bukan lambat, tapi sadar.",
    tags: ["culture", "walks"]
  },
  {
    id: "bali-2022",
    title: "Bali — Laut yang Tenang",
    location: "Bali",
    year: 2022,
    cover: "assets/img/cover-1.jpg",
    desc: "Bukan tentang itinerary padat. Tentang duduk, dengar ombak, dan berhenti menuntut diri.",
    tags: ["sea", "rest"]
  }
];

const POSTS = [
  {
    id: "ritme",
    title: "Tentang Ritme",
    date: "2025-06-18",
    excerpt: "Konsistensi itu bukan moralitas. Ia desain: kebiasaan kecil yang dibuat terlalu mudah untuk gagal.",
  },
  {
    id: "sunyi",
    title: "Belajar Berteman dengan Sunyi",
    date: "2025-02-03",
    excerpt: "Sunyi bukan musuh. Yang sering menyakitkan itu justru kebisingan yang tidak kita akui.",
  },
  {
    id: "kota",
    title: "Kota, Ingatan, dan Jalan Pulang",
    date: "2024-11-21",
    excerpt: "Ada kota yang tidak kita ingat karena tempatnya—tapi karena versi diri kita di sana.",
  }
];

const PHOTOS = [
  { src: "assets/img/gallery-1.jpg", alt: "Cahaya sore di jendela", caption: "Cahaya sore, sederhana." },
  { src: "assets/img/gallery-2.jpg", alt: "Jalan basah setelah hujan", caption: "Hujan selesai, jalan masih dingin." },
  { src: "assets/img/cover-1.jpg", alt: "Langit senja", caption: "Senja yang tidak perlu dijelaskan." },
  { src: "assets/img/cover-2.jpg", alt: "Sudut kota", caption: "Sudut kota, langkah pelan." }
];

/* ---------------------------
   Footer year
---------------------------- */
function initYear() {
  $$("[data-year]").forEach(el => (el.textContent = String(new Date().getFullYear())));
}

/* ---------------------------
   Theme toggle (localStorage)
---------------------------- */
function initTheme() {
  const root = document.documentElement;
  const toggle = $("[data-theme-toggle]");
  const icon = $("[data-theme-icon]");

  // Default: follow stored value, else prefers-color-scheme, else dark (as set in HTML)
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  else {
    const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
    root.setAttribute("data-theme", prefersLight ? "light" : "dark");
  }

  function syncIcon() {
    const theme = root.getAttribute("data-theme");
    if (icon) icon.textContent = theme === "light" ? "☀" : "☾";
  }
  syncIcon();

  toggle?.addEventListener("click", () => {
    const cur = root.getAttribute("data-theme") === "light" ? "light" : "dark";
    const next = cur === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    syncIcon();
  });
}

/* ---------------------------
   Mobile nav
---------------------------- */
function initNav() {
  const btn = $("[data-nav-toggle]");
  const links = $("[data-nav-links]");
  btn?.addEventListener("click", () => {
    links?.classList.toggle("is-open");
  });

  // Close after click (mobile)
  $$("[data-nav-links] a").forEach(a => {
    a.addEventListener("click", () => links?.classList.remove("is-open"));
  });
}

/* ---------------------------
   Smooth scroll (for same-page anchors)
---------------------------- */
function initSmoothScroll() {
  $$("[data-smooth-scroll]").forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* ---------------------------
   Hero counters (small JS animation)
---------------------------- */
function initCounters() {
  const counters = $$("[data-count]");
  if (!counters.length) return;

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) {
    counters.forEach(el => (el.textContent = el.dataset.count || "0"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count || "0");
      let cur = 0;
      const step = Math.max(1, Math.floor(target / 35));
      const t = setInterval(() => {
        cur += step;
        if (cur >= target) {
          cur = target;
          clearInterval(t);
        }
        el.textContent = String(cur);
      }, 18);
      io.unobserve(el);
    });
  }, { threshold: 0.25 });

  counters.forEach(el => io.observe(el));
}

/* ---------------------------
   Travel page: render + filters + modal
---------------------------- */
function initTravel() {
  const grid = $("#travel-grid");
  if (!grid) return;

  const selectLoc = $("[data-filter-location]");
  const selectYear = $("[data-filter-year]");
  const inputSearch = $("[data-filter-search]");
  const btnReset = $("[data-filter-reset]");
  const empty = $("#travel-empty");

  const modal = $("[data-modal]");
  const modalImg = $("[data-modal-img]");
  const modalTitle = $("[data-modal-title]");
  const modalMeta = $("[data-modal-meta]");
  const modalDesc = $("[data-modal-desc]");
  const modalTags = $("[data-modal-tags]");

  function unique(arr) { return Array.from(new Set(arr)); }

  function hydrateFilters() {
    const locations = unique(TRIPS.map(t => t.location)).sort();
    const years = unique(TRIPS.map(t => t.year)).sort((a,b) => b - a);

    locations.forEach(loc => {
      const opt = document.createElement("option");
      opt.value = loc;
      opt.textContent = loc;
      selectLoc?.appendChild(opt);
    });

    years.forEach(y => {
      const opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = String(y);
      selectYear?.appendChild(opt);
    });
  }

  function matches(trip) {
    const loc = selectLoc?.value || "all";
    const year = selectYear?.value || "all";
    const q = (inputSearch?.value || "").trim().toLowerCase();

    if (loc !== "all" && trip.location !== loc) return false;
    if (year !== "all" && String(trip.year) !== year) return false;
    if (q) {
      const blob = `${trip.title} ${trip.location} ${trip.year} ${trip.desc} ${trip.tags.join(" ")}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  }

  function cardTemplate(trip) {
    return `
      <article class="card trip-card lift">
        <div class="trip-thumb">
          <img src="${escapeHtml(trip.cover)}" alt="${escapeHtml(trip.title)}" loading="lazy" />
        </div>
        <div class="trip-body">
          <p class="trip-meta">${escapeHtml(trip.location)} • ${escapeHtml(trip.year)}</p>
          <h3 class="trip-title">${escapeHtml(trip.title)}</h3>
          <p class="muted">${escapeHtml(clampStr(trip.desc, 120))}</p>
          <button class="btn btn-ghost" type="button" data-open-trip="${escapeHtml(trip.id)}">Detail</button>
        </div>
      </article>
    `;
  }

  function render() {
    const items = TRIPS.filter(matches);
    grid.innerHTML = items.map(cardTemplate).join("");

    if (empty) empty.hidden = items.length !== 0;

    // bind detail buttons
    $$("[data-open-trip]", grid).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-open-trip");
        const trip = TRIPS.find(t => t.id === id);
        if (!trip) return;

        if (modalImg) {
          modalImg.src = trip.cover;
          modalImg.alt = trip.title;
        }
        if (modalTitle) modalTitle.textContent = trip.title;
        if (modalMeta) modalMeta.textContent = `${trip.location} • ${trip.year}`;
        if (modalDesc) modalDesc.textContent = trip.desc;
        if (modalTags) {
          modalTags.innerHTML = trip.tags.map(t => `<span class="badge">${escapeHtml(t)}</span>`).join("");
        }

        openModal(modal);
      });
    });
  }

  function openModal(m) {
    if (!m) return;
    m.hidden = false;
    document.body.style.overflow = "hidden";
    // focus close button for accessibility
    const closeBtn = $("[data-modal-close]", m);
    closeBtn?.focus();
  }

  function closeModal(m) {
    if (!m) return;
    m.hidden = true;
    document.body.style.overflow = "";
  }

  // Close handlers
  $$("[data-modal-close]").forEach(el => el.addEventListener("click", () => closeModal(modal)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.hidden) closeModal(modal);
  });

  hydrateFilters();
  render();

  [selectLoc, selectYear, inputSearch].forEach(el => el?.addEventListener("input", render));
  btnReset?.addEventListener("click", () => {
    if (selectLoc) selectLoc.value = "all";
    if (selectYear) selectYear.value = "all";
    if (inputSearch) inputSearch.value = "";
    render();
  });
}

/* ---------------------------
   Writing page: render + search
---------------------------- */
function initWriting() {
  const list = $("#writing-list");
  if (!list) return;

  const search = $("[data-writing-search]");
  const reset = $("[data-writing-reset]");
  const empty = $("#writing-empty");

  function matches(p) {
    const q = (search?.value || "").trim().toLowerCase();
    if (!q) return true;
    const blob = `${p.title} ${p.excerpt} ${p.date}`.toLowerCase();
    return blob.includes(q);
  }

  function render() {
    const items = POSTS
      .slice()
      .sort((a,b) => b.date.localeCompare(a.date))
      .filter(matches);

    list.innerHTML = items.map(p => `
      <article class="card post lift">
        <div class="post-meta">${escapeHtml(p.date)}</div>
        <h3 class="post-title">${escapeHtml(p.title)}</h3>
        <p class="post-excerpt">${escapeHtml(clampStr(p.excerpt, 180))}</p>
        <span class="muted" style="font-family:var(--mono);font-size:12px;">
          (opsional) buat halaman detail: posts/${escapeHtml(p.id)}.html
        </span>
      </article>
    `).join("");

    if (empty) empty.hidden = items.length !== 0;
  }

  render();
  search?.addEventListener("input", render);
  reset?.addEventListener("click", () => {
    if (search) search.value = "";
    render();
  });
}

/* ---------------------------
   Gallery page: render + lightbox
---------------------------- */
function initGallery() {
  const grid = $("#gallery-grid");
  if (!grid) return;

  const lb = $("[data-lightbox]");
  const lbImg = $("[data-lightbox-img]");
  const lbCap = $("[data-lightbox-caption]");

  function openLightbox(photo) {
    if (!lb) return;
    if (lbImg) { lbImg.src = photo.src; lbImg.alt = photo.alt || ""; }
    if (lbCap) lbCap.textContent = photo.caption || "";
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("[data-lightbox-close]", lb)?.focus();
  }

  function closeLightbox() {
    if (!lb) return;
    lb.hidden = true;
    document.body.style.overflow = "";
  }

  grid.innerHTML = PHOTOS.map((p, idx) => `
    <div class="photo" role="button" tabindex="0" data-photo-index="${idx}" aria-label="Buka foto">
      <img src="${escapeHtml(p.src)}" alt="${escapeHtml(p.alt || "Foto")}" loading="lazy" />
    </div>
  `).join("");

  $$("[data-photo-index]", grid).forEach(el => {
    const idx = Number(el.getAttribute("data-photo-index"));
    const photo = PHOTOS[idx];
    el.addEventListener("click", () => openLightbox(photo));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(photo);
      }
    });
  });

  $$("[data-lightbox-close]").forEach(el => el.addEventListener("click", closeLightbox));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lb && !lb.hidden) closeLightbox();
  });
}

/* ---------------------------
   Boot
---------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initYear();
  initTheme();
  initNav();
  initSmoothScroll();
  initCounters();
  initTravel();
  initWriting();
  initGallery();
});
