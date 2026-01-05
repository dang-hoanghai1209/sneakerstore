// script.js
// ============================================================
// Premium Sneaker Store — Homepage Template (Vanilla JS)
// File: script.js
//
// Features added:
// 1) Mobile drawer menu (open/close + ESC)
// 2) Quick View modal (open/close + ESC) + Add to cart from modal
// 3) Cart counter (localStorage) + toast notifications
// 4) Product filtering (chips)
// 5) Search (highlights matching products + scroll to results)
// 6) Best sellers carousel buttons (scroll)
// 7) Countdown timer (real-time; resets when reaches 0)
// 8) Newsletter form validation + toast
// ============================================================

(() => {
    "use strict";
  
    // ---------- Helpers ----------
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  
    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }
  
    function formatStars(rating) {
      // rating may be "4.5" -> show ★★★★☆
      const r = Number(rating) || 0;
      const full = clamp(Math.round(r), 0, 5);
      return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
    }
  
    // ---------- Toast ----------
    const toastsEl = $(".toasts");
    function toast(title, msg = "") {
      if (!toastsEl) return;
  
      const el = document.createElement("div");
      el.className = "toast";
      el.innerHTML = `
        <span class="toast__dot" aria-hidden="true"></span>
        <div>
          <p class="toast__title">${escapeHtml(title)}</p>
          ${msg ? `<p class="toast__msg">${escapeHtml(msg)}</p>` : ""}
        </div>
      `;
      toastsEl.appendChild(el);
  
      // Auto remove
      setTimeout(() => {
        el.style.opacity = "0";
        el.style.transform = "translateY(6px)";
        el.style.transition = "200ms ease";
        setTimeout(() => el.remove(), 220);
      }, 2400);
    }
  
    function escapeHtml(s) {
      return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }
  
    // ---------- Cart (localStorage) ----------
    const CART_KEY = "ss_cart_count";
    const cartCountEl = $("#cartCount");
  
    function getCartCount() {
      return Number(localStorage.getItem(CART_KEY) || "0") || 0;
    }
    function setCartCount(n) {
      const v = clamp(Number(n) || 0, 0, 999);
      localStorage.setItem(CART_KEY, String(v));
      if (cartCountEl) {
        cartCountEl.textContent = String(v);
        cartCountEl.setAttribute("aria-label", `${v} items in cart`);
      }
    }
  
    setCartCount(getCartCount());
  
    function addToCart(productName) {
      const next = getCartCount() + 1;
      setCartCount(next);
      toast("Added to cart", productName ? `${productName} · Cart: ${next}` : `Cart: ${next}`);
    }
  
    // ---------- Mobile Drawer ----------
    const drawer = $("#drawer");
    const menuBtn = $("#menuBtn");
  
    function openDrawer() {
      if (!drawer) return;
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      // focus first link for accessibility
      const firstLink = $(".drawer__link", drawer);
      firstLink?.focus();
    }
  
    function closeDrawer() {
      if (!drawer) return;
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      menuBtn?.focus();
    }
  
    menuBtn?.addEventListener("click", openDrawer);
    $$("[data-drawer-close]", drawer || document).forEach((el) => el.addEventListener("click", closeDrawer));
  
    // Mobile search button (demo)
    $("#mobileSearchBtn")?.addEventListener("click", () => {
      const q = ($("#mq")?.value || "").trim();
      if (!q) return toast("Search", "Type something to search.");
      closeDrawer();
      runSearch(q);
    });
  
    // ---------- Quick View Modal ----------
    const modal = $("#quickView");
    const qvTitle = $("#qvTitle");
    const qvImage = $("#qvImage");
    const qvPrice = $("#qvPrice");
    const qvStars = $("#qvStars");
    const qvCategory = $("#qvCategory");
    const qvAdd = $("#qvAdd");
  
    let currentModalProduct = null;
  
    function openModal(productData) {
      if (!modal) return;
      currentModalProduct = productData;
  
      if (qvTitle) qvTitle.textContent = productData.name;
      if (qvImage) qvImage.src = productData.image;
      if (qvImage) qvImage.alt = `${productData.name} product image`;
      if (qvPrice) qvPrice.textContent = `$${productData.price}`;
      if (qvStars) qvStars.textContent = formatStars(productData.rating);
      if (qvCategory) qvCategory.textContent = productData.categoryLabel;
  
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      qvAdd?.focus();
    }
  
    function closeModal() {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      currentModalProduct = null;
    }
  
    $$("[data-modal-close]", modal || document).forEach((el) => el.addEventListener("click", closeModal));
  
    // Delegate quick view clicks
    const productGrid = $("#productGrid");
    productGrid?.addEventListener("click", (e) => {
      const target = e.target;
      const trigger = target.closest?.("[data-quick-view]");
      if (!trigger) return;
  
      e.preventDefault();
  
      const card = trigger.closest(".product-card");
      if (!card) return;
  
      const name = card.dataset.name || "Product";
      const price = card.dataset.price || "0";
      const rating = card.dataset.rating || "5";
      const image = card.dataset.image || $(".product-card__media img", card)?.src || "";
      const cat = card.dataset.category || "all";
  
      openModal({
        name,
        price,
        rating,
        image,
        category: cat,
        categoryLabel: catLabel(cat),
      });
    });
  
    qvAdd?.addEventListener("click", () => {
      if (!currentModalProduct) return;
      addToCart(currentModalProduct.name);
      closeModal();
    });
  
    // Add-to-cart buttons on cards (delegate)
    productGrid?.addEventListener("click", (e) => {
      const btn = e.target.closest?.("[data-add-to-cart]");
      if (!btn) return;
  
      const card = btn.closest(".product-card");
      const name = card?.dataset?.name || "Product";
      addToCart(name);
    });
  
    // ---------- Filters ----------
    const chipWrap = $(".chips");
    chipWrap?.addEventListener("click", (e) => {
      const btn = e.target.closest?.(".chip");
      if (!btn) return;
  
      const filter = btn.dataset.filter || "all";
      $$(".chip", chipWrap).forEach((c) => c.classList.toggle("is-active", c === btn));
  
      const cards = $$(".product-card", productGrid || document);
      cards.forEach((card) => {
        const cat = card.dataset.category || "all";
        const show = filter === "all" || cat === filter;
        card.classList.toggle("is-hidden", !show);
      });
  
      toast("Filter applied", filter === "all" ? "Showing all products" : `Showing: ${catLabel(filter)}`);
    });
  
    function catLabel(cat) {
      const map = { running: "Running", lifestyle: "Lifestyle", basketball: "Basketball", all: "All" };
      return map[cat] || "Category";
    }
  
    // ---------- Search (highlights + scroll) ----------
    const searchForm = $("#searchForm");
    searchForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = ($("#q")?.value || "").trim();
      if (!q) return toast("Search", "Type a keyword to search.");
      runSearch(q);
    });
  
    function runSearch(query) {
      const q = query.toLowerCase();
      const cards = $$(".product-card", productGrid || document);
      let hits = 0;
  
      // Remove previous inline highlighting
      cards.forEach((card) => {
        card.style.outline = "";
        card.style.outlineOffset = "";
      });
  
      cards.forEach((card) => {
        const name = (card.dataset.name || "").toLowerCase();
        const cat = (card.dataset.category || "").toLowerCase();
        const match = name.includes(q) || cat.includes(q);
  
        // Show matches (and hide non-matches)
        card.classList.toggle("is-hidden", !match);
        if (match) {
          hits += 1;
          card.style.outline = "2px solid rgba(40, 229, 255, 0.45)";
          card.style.outlineOffset = "4px";
        }
      });
  
      // Update chips to "All" visually (search overrides filter)
      $$(".chip", chipWrap || document).forEach((c) => c.classList.remove("is-active"));
      $(".chip[data-filter='all']", chipWrap || document)?.classList.add("is-active");
  
      // Scroll to product section
      $("#new-arrivals")?.scrollIntoView({ behavior: "smooth", block: "start" });
  
      toast("Search results", hits ? `${hits} match(es) for “${query}”` : `No matches for “${query}”`);
    }
  
    // ---------- Carousel buttons ----------
    const carousel = $("#carousel");
    const prev = $("#prevSlide");
    const next = $("#nextSlide");
  
    function scrollCarousel(dir) {
      if (!carousel) return;
      // Scroll by ~1 card width
      const card = $(".mini-card", carousel);
      const step = card ? card.getBoundingClientRect().width + 16 : 280;
      carousel.scrollBy({ left: dir * step, behavior: "smooth" });
    }
  
    prev?.addEventListener("click", () => scrollCarousel(-1));
    next?.addEventListener("click", () => scrollCarousel(1));
  
    // ---------- Countdown (real) ----------
    const cdH = $("#cdHours");
    const cdM = $("#cdMinutes");
    const cdS = $("#cdSeconds");
  
    // Set an end time 6 hours from now (demo). You can replace with a fixed date.
    let saleEndsAt = Date.now() + 6 * 60 * 60 * 1000;
  
    function tickCountdown() {
      const now = Date.now();
      let diff = saleEndsAt - now;
  
      if (diff <= 0) {
        // Reset for demo (another 6 hours)
        saleEndsAt = Date.now() + 6 * 60 * 60 * 1000;
        diff = saleEndsAt - Date.now();
        toast("Flash Sale", "Sale timer refreshed (demo).");
      }
  
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
  
      if (cdH) cdH.textContent = String(hours).padStart(2, "0");
      if (cdM) cdM.textContent = String(minutes).padStart(2, "0");
      if (cdS) cdS.textContent = String(seconds).padStart(2, "0");
    }
  
    if (cdH && cdM && cdS) {
      tickCountdown();
      setInterval(tickCountdown, 1000);
    }
  
    // ---------- Newsletter validation ----------
    const newsletterForm = $("#newsletterForm");
    newsletterForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = ($("#email")?.value || "").trim();
  
      if (!email) return toast("Newsletter", "Please enter your email.");
      if (!isValidEmail(email)) return toast("Newsletter", "Email looks invalid. Try again.");
  
      // Demo success (no backend)
      newsletterForm.reset();
      toast("Subscribed!", "You’ll get early access to new drops.");
    });
  
    function isValidEmail(s) {
      // Simple, practical regex (good enough for UI validation)
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    }
  
    // ---------- Global key handling (ESC closes) ----------
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
  
      // Close modal first if open
      if (modal?.classList.contains("is-open")) return closeModal();
      if (drawer?.classList.contains("is-open")) return closeDrawer();
    });
  
    // ---------- Cart / Account demo buttons ----------
    $("#cartBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      toast("Cart", `You have ${getCartCount()} item(s). (Demo UI)`);
    });
  
    $("#accountBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      toast("Account", "Login / profile (Demo UI)");
    });
  })();
  
// fetch api vao file
  const API_BASE = "http://localhost:3000";

  async function loadProducts() {
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      const data = await res.json();
  
      renderProducts(data.items);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  }
  
  function renderProducts(products) {
    const grid = document.querySelector("#productGrid");
    if (!grid) return;
  
    grid.innerHTML = products
      .map((p) => {
        const stars = "★★★★★☆☆☆☆☆".slice(5 - Math.round(p.rating || 0), 10 - Math.round(p.rating || 0)); 
        // nếu bạn không cần sao thì bỏ dòng stars
  
        return `
          <article class="product-card" tabindex="0">
            <div class="product-media">
              <img src="${p.image}" alt="${p.name}" loading="lazy" />
              <div class="quickview">Quick view</div>
            </div>
  
            <div class="product-body">
              <h3 class="product-title">${p.name}</h3>
  
              <div class="product-meta">
                <div class="product-price">$${p.price}</div>
                <div class="product-rating" aria-label="Rating ${p.rating} out of 5">
                  ${renderStars(p.rating)}
                </div>
              </div>
  
              <button class="btn add-to-cart" data-id="${p.id}" data-slug="${p.slug}">
                Add to Cart
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }
  
  function renderStars(rating = 0) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
  
    return `
      ${"★".repeat(full)}
      ${half ? "½" : ""}
      ${"☆".repeat(empty)}
    `.trim();
  }  

  /* ========= CATEGORY FILTER (All / Running / Lifestyle / Basketball) =========
   Assumptions:
   - Your filter buttons have class ".chip" (or similar)
   - Each button has either: data-category="running" ... OR its text is "Running"
   - Your products API supports: /api/products?category=running
   - You already have: loadProducts() + renderProducts() from step 2
   - Product grid container id: #productGrid
*/

/** Change this if your backend runs on a different port/domain */
const API_BASE = "http://localhost:3000";

/** Keeps current UI state */
const state = {
  category: "all",
  search: "",      // optional (for later)
  sort: "new",     // optional (for later)
};

/** Build URL with query params */
function buildProductsUrl() {
  const url = new URL(`${API_BASE}/api/products`);
  url.searchParams.set("category", state.category);
  if (state.search) url.searchParams.set("search", state.search);
  if (state.sort) url.searchParams.set("sort", state.sort);
  return url.toString();
}

/** Fetch products from backend and render */
async function loadProducts() {
  try {
    const res = await fetch(buildProductsUrl());
    const data = await res.json();
    renderProducts(data.items || []);
  } catch (err) {
    console.error("❌ Failed to load products:", err);
  }
}

/** Wire up filter chips */
function initCategoryFilters() {
  // ✅ Edit this selector to match your HTML
  // Example: .chip, .filter-chip, .pill, button[data-category]...
  const chips = document.querySelectorAll("[data-category]");

  if (!chips.length) {
    console.warn("⚠️ No category chips found. Add data-category to your filter buttons.");
    return;
  }

  chips.forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = (btn.dataset.category || "all").toLowerCase();
      state.category = cat;

      // Update active UI
      chips.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      // Reload products with new category
      loadProducts();
    });
  });
}

/** On page load */
document.addEventListener("DOMContentLoaded", () => {
  initCategoryFilters();
  loadProducts(); // initial load (all)
});
