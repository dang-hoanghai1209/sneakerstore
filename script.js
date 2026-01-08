(() => {
    "use strict";
  
    // ---------- Helpers ----------
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  
    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    const vndFormatter = new Intl.NumberFormat("vi-VN");
    function formatVnd(value) {
      const n = Number(value) || 0;
      return `${vndFormatter.format(n)}đ`;
    }
    function formatVndPlain(value) {
      const n = Number(value) || 0;
      return `${vndFormatter.format(n)}đ`;
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
  
    // ---------- Cart (API) ----------
    const CART_KEY = "ss_cart_count";
    const CART_ID_KEY = "cartId";
    const cartCountEl = $("#cartCount");
    const cartCountDesktopEl = $("#cartCountDesktop");
  
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
      if (cartCountDesktopEl) {
        cartCountDesktopEl.textContent = String(v);
        cartCountDesktopEl.setAttribute("aria-label", `${v} items in cart`);
      }
    }
  
    setCartCount(getCartCount());

    function logApiError(context, res, data) {
      const status = res?.status;
      const message = data?.error?.message || data?.error || data?.message || "Unknown error";
      console.error(`[Cart] ${context} failed`, { status, message, body: data });
    }

    async function getOrCreateCartId() {
      const existing = localStorage.getItem(CART_ID_KEY);
      if (existing) return existing;

      try {
        const res = await fetch("/api/cart", { method: "POST" });
        const data = await res.json();
        if (!res.ok || data?.ok === false) {
          logApiError("create cart", res, data);
          return null;
        }
        const cartId = data?.data?.cart_id;
        if (cartId) {
          localStorage.setItem(CART_ID_KEY, cartId);
          return cartId;
        }
      } catch (err) {
        console.error("[Cart] create cart failed", err);
        return null;
      }
      return null;
    }

    async function fetchCart() {
      const cartId = await getOrCreateCartId();
      if (!cartId) return null;
      const res = await fetch(`/api/cart/${cartId}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) {
        logApiError("get cart", res, data);
        return null;
      }
      return data;
    }

    async function syncCartCount() {
      try {
        const data = await fetchCart();
        const count = Number(data?.data?.totals?.count || 0);
        setCartCount(count);
      } catch (err) {
        // Keep last known count on error
      }
    }

    getOrCreateCartId().then(syncCartCount);
  
    async function addToCart(productId, productName) {
      if (!productId) {
        toast("Cart", "Missing product id.");
        return;
      }

      const cartId = await getOrCreateCartId();
      if (!cartId) {
        toast("Cart", "Cart unavailable.");
        return;
      }

      try {
        const res = await fetch(`/api/cart/${cartId}/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId, qty: 1 }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.ok === false) {
          logApiError("add item", res, data);
          throw new Error(data?.error?.message || "Add to cart failed");
        }
        const count = Number(data?.data?.totals?.count || 0);
        setCartCount(count);
        toast("Cart", productName || "Added to cart.");
      } catch (err) {
        console.error("[Cart] add item failed", err);
        toast("Cart", "Unable to add item.");
      }
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
      if (!q) return toast("Tìm kiếm", "Nhập từ khóa để tìm.");
      closeDrawer();
      runSearch(q);
    });
  
    // ---------- Quick View Modal ----------
    const modal = $("#quickView");
    const qvTitle = $("#qvTitle");
    const qvImage = $("#qvImage");
    const qvPrice = $("#qvPrice");
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
  
    const productGrid = $("#productGrid");

    const imageIdMap = {
      "Group 14.png": "p1",
      "Group 15.png": "p2",
      "Group 16.png": "p3",
      "Group 17.png": "p4",
      "Group 18.png": "p5",
      "Group 19.png": "p6",
      "Group 20.png": "p7",
      "Group 21.png": "p8",
      "Group 1.png": "p9",
      "Group 3.png": "p10",
      "Group 7.png": "p11",
      "Group 2.png": "p12",
      "Group 5.png": "p13",
      "Group 6.png": "p14",
      "Group 8.png": "p15",
      "Group 4.png": "p8",
    };

    function normalizeProductActions() {
      const cards = $$(".product-card");
      cards.forEach((card) => {
        if (!card.dataset.productId) {
          const img = $(".product-card__media img", card);
          const src = img?.getAttribute("src") || "";
          const file = src.split("/").pop();
          if (file && imageIdMap[file]) {
            card.dataset.productId = imageIdMap[file];
          }
        }

        const productId = card.dataset.productId || "";
        const media = $(".product-card__media", card);
        if (media) {
          media.dataset.action = "quick-view";
          media.dataset.id = productId;
        }

        $$("[data-add-to-cart]", card).forEach((btn) => {
          btn.dataset.action = "add-to-cart";
          btn.dataset.id = productId;
        });

        $$("[data-quick-view]", card).forEach((btn) => {
          btn.dataset.action = "quick-view";
          btn.dataset.id = productId;
        });
      });
    }

    normalizeProductActions();

    document.addEventListener("click", (e) => {
      const actionEl = e.target.closest?.("[data-action]");
      if (!actionEl) return;

      const action = actionEl.dataset.action || "";
      if (action !== "quick-view" && action !== "add-to-cart") return;

      if (action === "quick-view") e.preventDefault();

      const card = actionEl.closest(".product-card");
      if (!card) return;

      const name = card.dataset.name || "Product";
      const price = card.dataset.price || "0";
      const image = card.dataset.image || $(".product-card__media img", card)?.src || "";
      const cat = card.dataset.category || "all";
      const productId = actionEl.dataset.id || card.dataset.productId || "";

      if (action === "quick-view") {
        openModal({
          name,
          price,
          image,
          category: cat,
          productId,
          categoryLabel: catLabel(cat),
        });
        return;
      }

      if (action === "add-to-cart") {
        addToCart(productId, name);
      }
    });

    qvAdd?.addEventListener("click", () => {
      if (!currentModalProduct) return;
      addToCart(currentModalProduct.productId, currentModalProduct.name);
      closeModal();
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
  
      // Scroll to product section
      $("#newproducts")?.scrollIntoView({ behavior: "smooth", block: "start" });
  
      toast("Search results", hits ? `${hits} match(es) for “${query}”` : `No matches for “${query}”`);
    }


    // ---------- Cart page (API) ----------
    const cartPage = document.body?.dataset?.tag === "cart";
    if (cartPage) {
      const cartItemsEl = $("#cartItems");
      const cartSubtotalEl = $("#cartSubtotal");
      const cartTotalEl = $("#cartTotal");
      const checkoutBtn = $("#checkoutBtn");

      function renderCart(cart, totals) {
        const items = cart?.items || [];

        if (!items.length) {
          if (cartItemsEl) {
            cartItemsEl.innerHTML = `
              <article class="product-card cart-item">
                <div class="product-card__body">
                  <h3 class="product-card__title">Giỏ hàng trống</h3>
                  <p class="muted">Hãy chọn thêm sản phẩm bạn yêu thích.</p>
                </div>
              </article>
            `;
          }
          if (cartSubtotalEl) cartSubtotalEl.textContent = formatVndPlain(0);
          if (cartTotalEl) cartTotalEl.textContent = formatVndPlain(0);
          if (checkoutBtn) {
            checkoutBtn.setAttribute("aria-disabled", "true");
          }
          return;
        }

        if (checkoutBtn) {
          checkoutBtn.removeAttribute("aria-disabled");
        }

        if (cartItemsEl) {
          cartItemsEl.innerHTML = items
            .map((item) => {
              const name = escapeHtml(item.name || "Sản phẩm");
              const imageUrl = item.image_url || "images/Group 9.png";
              const price = formatVndPlain(item.price || 0);
              const lineTotal = formatVndPlain(item.line_total || 0);

              return `
                <article class="product-card cart-item" data-item-id="${escapeHtml(item.id)}">
                  <div class="cart-item__media">
                    <img src="${escapeHtml(imageUrl)}" alt="${name}" loading="lazy" />
                  </div>
                  <div class="product-card__body cart-item__body">
                    <div class="cart-item__top">
                      <h3 class="product-card__title">${name}</h3>
                      <button class="btn btn--small btn--ghost" type="button" data-cart-action="remove" data-item-id="${escapeHtml(item.id)}">Xóa</button>
                    </div>
                    <div class="cart-item__meta">
                      <span class="price-now">${price}</span>
                      <span class="muted">x</span>
                      <span class="muted">Tạm tính: ${lineTotal}</span>
                    </div>
                    <div class="cart-item__controls">
                      <div class="cart-qty">
                        <button class="btn btn--small btn--ghost" type="button" data-cart-action="qty-dec" data-item-id="${escapeHtml(item.id)}">-</button>
                        <input class="cart-qty__input" type="number" min="1" value="${item.quantity}" data-cart-action="qty-input" data-item-id="${escapeHtml(item.id)}" />
                        <button class="btn btn--small btn--ghost" type="button" data-cart-action="qty-inc" data-item-id="${escapeHtml(item.id)}">+</button>
                      </div>
                      <strong>${lineTotal}</strong>
                    </div>
                  </div>
                </article>
              `;
            })
            .join("");
        }

        if (cartSubtotalEl) cartSubtotalEl.textContent = formatVndPlain(totals?.subtotal || 0);
        if (cartTotalEl) cartTotalEl.textContent = formatVndPlain(totals?.total || 0);
      }

      async function updateCartItem(itemId, qty) {
        const cartId = await getOrCreateCartId();
        if (!cartId) {
          toast("Gi? h?ng", "Kh?ng th? t?o gi? h?ng.");
          return;
        }

        try {
          const res = await fetch(`/api/cart/${cartId}/items/${itemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qty }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || data?.ok === false) {
            logApiError("update item", res, data);
            toast("Gi? h?ng", "Kh?ng th? c?p nh?t s? l??ng.");
            return;
          }
          setCartCount(Number(data?.data?.totals?.count || 0));
          renderCart(data?.data?.cart, data?.data?.totals);
        } catch (err) {
          console.error("[Cart] update item failed", err);
          toast("Gi? h?ng", "Kh?ng th? c?p nh?t s? l??ng.");
        }
      }

      async function removeCartItem(itemId) {
        const cartId = await getOrCreateCartId();
        if (!cartId) {
          toast("Gi? h?ng", "Kh?ng th? t?o gi? h?ng.");
          return;
        }

        try {
          const res = await fetch(`/api/cart/${cartId}/items/${itemId}`, { method: "DELETE" });
          const data = await res.json().catch(() => null);
          if (!res.ok || data?.ok === false) {
            logApiError("remove item", res, data);
            toast("Gi? h?ng", "Kh?ng th? x?a s?n ph?m.");
            return;
          }
          setCartCount(Number(data?.data?.totals?.count || 0));
          renderCart(data?.data?.cart, data?.data?.totals);
        } catch (err) {
          console.error("[Cart] remove item failed", err);
          toast("Gi? h?ng", "Kh?ng th? x?a s?n ph?m.");
        }
      }

      document.addEventListener("click", (e) => {
        const actionEl = e.target.closest?.("[data-cart-action]");
        if (!actionEl) return;

        const action = actionEl.dataset.cartAction;
        const itemId = actionEl.dataset.itemId || actionEl.closest("[data-item-id]")?.dataset.itemId;
        if (!itemId) return;

        if (action === "qty-inc" || action === "qty-dec") {
          const input = $(`.cart-qty__input[data-item-id="${itemId}"]`);
          const current = Number(input?.value || 1);
          const next = clamp(current + (action === "qty-inc" ? 1 : -1), 1, 99);
          if (input) input.value = String(next);
          updateCartItem(itemId, next);
        }

        if (action === "remove") {
          removeCartItem(itemId);
        }
      });

      document.addEventListener("change", (e) => {
        const input = e.target.closest?.(".cart-qty__input");
        if (!input) return;
        const itemId = input.dataset.itemId;
        if (!itemId) return;
        const next = clamp(Number(input.value || 1), 1, 99);
        input.value = String(next);
        updateCartItem(itemId, next);
      });

      checkoutBtn?.addEventListener("click", (e) => {
        if (checkoutBtn.getAttribute("aria-disabled") === "true") {
          e.preventDefault();
          toast("Gi? h?ng", "Gi? h?ng ?ang tr?ng.");
        }
      });

      fetchCart().then((data) => {
        renderCart(data?.data?.cart, data?.data?.totals);
        setCartCount(Number(data?.data?.totals?.count || 0));
      });
    }

    // ---------- Checkout page (API) ----------
    const checkoutPage = document.body?.dataset?.tag === "checkout";
    if (checkoutPage) {
      const form = $("#checkoutForm");
      const subtotalEl = $("#checkoutSubtotal");
      const totalEl = $("#checkoutTotal");

      async function loadCheckoutSummary() {
        const data = await fetchCart();
        if (!data) return;
        if (subtotalEl) subtotalEl.textContent = formatVndPlain(data?.data?.totals?.subtotal || 0);
        if (totalEl) totalEl.textContent = formatVndPlain(data?.data?.totals?.total || 0);
      }

      form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const cartId = await getOrCreateCartId();
        if (!cartId) {
          toast("Thanh toán", "Không thể tạo giỏ hàng.");
          return;
        }

        const cartSnapshot = await fetchCart();
        if (!cartSnapshot || Number(cartSnapshot?.data?.totals?.count || 0) === 0) {
          toast("Thanh toán", "Giỏ hàng đang trống.");
          return;
        }

        const name = $("#checkoutName")?.value?.trim() || "";
        const phone = $("#checkoutPhone")?.value?.trim() || "";
        const address = $("#checkoutAddress")?.value?.trim() || "";
        const note = $("#checkoutNote")?.value?.trim() || "";
        const paymentMethod = $("input[name=\"paymentMethod\"]:checked")?.value || "COD";

        try {
          const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cart_id: cartId,
              shipping: { name, phone, address },
              note: note || undefined,
              payment_method: paymentMethod,
            }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || data?.ok === false) {
            const status = res?.status;
            console.error("[Checkout] create order failed", { status, body: data });
            toast("Thanh toán", data?.error?.message || "Không thể tạo đơn hàng.");
            return;
          }

          const orderId = data?.data?.order_id || "";
          window.location.href = `order-success.html?orderId=${encodeURIComponent(orderId)}`;
        } catch (err) {
          console.error("[Checkout] create order failed", err);
          toast("Thanh toán", "Không thể tạo đơn hàng.");
        }
      });

      loadCheckoutSummary();
    }

    // ---------- Order success ----------
    const orderSuccessPage = document.body?.dataset?.tag === "order-success";
    if (orderSuccessPage) {
      const orderId = new URLSearchParams(window.location.search).get("orderId");
      const orderIdEl = $("#orderId");
      if (orderIdEl) orderIdEl.textContent = orderId || "---";
    }

    // ---------- Brand filter (navbar + chips) ----------
    const brandLinks = $$("[data-brand-filter]");
    const brandTokens = {
      nike: ["nike"],
      adidas: ["adidas"],
      puma: ["puma"],
      converse: ["converse"],
      asics: ["asics"],
      "new-balance": ["new balance", "new-balance", "newbalance", "nb"],
    };

    function cardMatchesBrand(card, brand) {
      if (brand === "all") return true;
      const dataBrand = (card.dataset.brand || "").toLowerCase();
      if (dataBrand) return dataBrand === brand;
      const name = (card.dataset.name || "").toLowerCase();
      const tokens = brandTokens[brand] || [brand];
      return tokens.some((token) => name.includes(token));
    }

    function applyBrandFilter(brand) {
      const cards = $$(".product-card", productGrid || document);
      cards.forEach((card) => {
        const match = cardMatchesBrand(card, brand);
        card.classList.toggle("is-hidden", !match);
      });

      brandLinks.forEach((link) => {
        const linkBrand = (link.dataset.brandFilter || "").toLowerCase();
        if (linkBrand === brand) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      if (brand !== "all") {
        toast("Filter", `Brand: ${brand}`);
      } else {
        toast("Filter", "All brands");
      }

      $("#newproducts")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    brandLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const brand = (link.dataset.brandFilter || "all").toLowerCase();
        applyBrandFilter(brand);
      });
    });

    // ---------- Sneaker page filters ----------
    const sneakerPage = $("[data-sneaker-page]");
    if (sneakerPage) {
      const tagButtons = $$(".filter-btn[data-tag]");
      const brandButtons = $$(".filter-btn[data-brand]");
      const priceButtons = $$(".filter-btn[data-price]");

      const brandLabelMap = {
        nike: "Nike",
        adidas: "Adidas",
        puma: "Puma",
        converse: "Converse",
        asics: "Asics",
        "new-balance": "New Balance",
      };

      const formatVndPlain = (value) => `${vndFormatter.format(Number(value) || 0)}d`;

      let activeTag = (tagButtons.find((btn) => btn.classList.contains("is-active"))?.dataset.tag || "").toLowerCase();
      let activeBrand = (brandButtons.find((btn) => btn.classList.contains("is-active"))?.dataset.brand || "").toLowerCase();
      let activePrice = (priceButtons.find((btn) => btn.classList.contains("is-active"))?.dataset.price || "").toLowerCase();

      const urlBrand = new URLSearchParams(window.location.search).get("brand");
      if (urlBrand) {
        activeBrand = urlBrand.toLowerCase();
      }

      function setActiveButton(buttons, value, attr) {
        buttons.forEach((btn) => {
          const btnValue = (btn.dataset[attr] || "").toLowerCase();
          const isActive = btnValue === value;
          btn.classList.toggle("is-active", isActive);
          if (isActive) {
            btn.setAttribute("aria-current", "true");
          } else {
            btn.removeAttribute("aria-current");
          }
        });
      }

      function buildQuery() {
        const params = new URLSearchParams();
        if (activeTag) params.set("tag", activeTag);
        if (activeBrand) params.set("brand", activeBrand);
        if (activePrice) {
          const parts = activePrice.split("-").map((n) => Number(n));
          if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
            params.set("price_min", String(parts[0]));
            params.set("price_max", String(parts[1]));
          }
        }
        return params.toString();
      }

      function renderProducts(items) {
        if (!productGrid) return;
        if (!items.length) {
          productGrid.innerHTML = '<article class="product-card col-12"><div class="product-card__body"><h3 class="product-card__title">Không tìm thấy sản phẩm</h3><p class="muted">Vui lòng thử bộ lọc khác.</p></div></article>';
          return;
        }

        productGrid.innerHTML = items.map((item) => {
          const name = escapeHtml(item.name || "Giày sneaker");
          const price = Number(item.price || 0);
          const compareAt = Number(item.compare_at || 0);
          const hasSale = compareAt > price;
          const brand = (item.brand || "").toLowerCase();
          const category = item.is_sale ? "sale" : item.is_new ? "new" : item.is_best ? "best" : (item.category || "");
          const imageUrl = item.image_url || "";
          const rating = Number(item.rating || 0);
          const cardClass = `product-card col-3 col-md-6 col-sm-12${hasSale ? " is-sale" : ""}`;

          return `
            <article class="${cardClass}"
              data-category="${escapeHtml(category)}"
              data-product-id="${escapeHtml(String(item.id || item.product_id || ""))}"
              data-name="${name}"
              data-brand="${escapeHtml(brand)}"
              data-price="${price}"
              data-rating="${rating}"
              data-image="${escapeHtml(imageUrl)}">
              <a class="product-card__media" href="#" data-quick-view data-action="quick-view" data-id="${escapeHtml(String(item.id || item.product_id || ""))}" aria-label="Xem nhanh ${name}">
                <img src="${escapeHtml(imageUrl)}" alt="${name}" loading="lazy" />
                ${hasSale ? '<span class="product-card__badge product-card__badge--sale">SALE</span>' : ""}
                <span class="quick-view" aria-hidden="true">Xem nhanh</span>
              </a>
              <div class="product-card__body">
                <h3 class="product-card__title">Giày ${name}</h3>
                <p class="product-card__desc">Giày ${name}.</p>
                <div class="product-card__price-row">
                  ${hasSale ? `<span class="price-old">${formatVndPlain(compareAt)}</span>` : ""}
                  <span class="price-now">${formatVndPlain(price)}</span>
                </div>
                <div class="product-card__actions">
                  <button class="btn btn--small btn--primary" type="button" data-add-to-cart data-action="add-to-cart" data-id="${escapeHtml(String(item.id || item.product_id || ""))}">Thêm vào giỏ</button>
                  <button class="btn btn--small btn--ghost" type="button" data-quick-view data-action="quick-view" data-id="${escapeHtml(String(item.id || item.product_id || ""))}">Chi tiết</button>
                </div>
              </div>
            </article>
          `;
        }).join("");
      }

      async function fetchProducts() {
        const query = buildQuery();
        const url = query ? `/api/products?${query}` : "/api/products";
        try {
          const res = await fetch(url);
          const data = await res.json();
          const items = data?.data?.items || data?.items || [];
          renderProducts(items);
        } catch (err) {
          renderProducts([]);
        }

        setActiveButton(tagButtons, activeTag, "tag");
        setActiveButton(brandButtons, activeBrand, "brand");
        setActiveButton(priceButtons, activePrice, "price");

        const titleEl = $("#sneakerTitle");
        const crumbEl = $("#sneakerBreadcrumb");
        if (activeBrand) {
          const label = brandLabelMap[activeBrand] || activeBrand;
          if (titleEl) titleEl.textContent = `Giày sneaker - ${label}`;
          if (crumbEl) crumbEl.textContent = label;
        } else {
          if (titleEl) titleEl.textContent = "Tất cả sản phẩm";
          if (crumbEl) crumbEl.textContent = "Giày sneaker";
        }
      }

      tagButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          activeTag = (btn.dataset.tag || "").toLowerCase();
          fetchProducts();
        });
      });

      brandButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          activeBrand = (btn.dataset.brand || "").toLowerCase();
          fetchProducts();
        });
      });

      priceButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          activePrice = (btn.dataset.price || "").toLowerCase();
          fetchProducts();
        });
      });

      fetchProducts();
    }

    // ---------- Sale page (backend) ----------
    const salePage = $("body[data-tag=\"sale\"]");
    if (salePage && !sneakerPage) {
      const tagButtons = $$(".filter-btn[data-tag]");
      const brandButtons = $$(".filter-btn[data-brand]");
      const priceButtons = $$(".filter-btn[data-price]");
      const formatVndPlain = (value) => `${vndFormatter.format(Number(value) || 0)}d`;
      let activeTag = (tagButtons.find((btn) => btn.classList.contains("is-active"))?.dataset.tag || "sale").toLowerCase();
      let activeBrand = (brandButtons.find((btn) => btn.classList.contains("is-active"))?.dataset.brand || "").toLowerCase();
      let activePrice = (priceButtons.find((btn) => btn.classList.contains("is-active"))?.dataset.price || "").toLowerCase();

      function setActiveButton(buttons, value, attr) {
        buttons.forEach((btn) => {
          const btnValue = (btn.dataset[attr] || "").toLowerCase();
          const isActive = btnValue === value;
          btn.classList.toggle("is-active", isActive);
          if (isActive) {
            btn.setAttribute("aria-current", "true");
          } else {
            btn.removeAttribute("aria-current");
          }
        });
      }

      function renderProducts(items) {
        if (!productGrid) return;
        if (!items.length) {
          productGrid.innerHTML =
            '<article class="product-card col-12"><div class="product-card__body"><h3 class="product-card__title">Không tìm thấy sản phẩm</h3><p class="muted">Vui lòng thử bộ lọc khác.</p></div></article>';
          return;
        }

        productGrid.innerHTML = items
          .map((item) => {
            const name = escapeHtml(item.name || "Giày sneaker");
            const price = Number(item.price || 0);
            const compareAt = Number(item.compare_at || 0);
            const hasSale = compareAt > price;
            const brand = (item.brand || "").toLowerCase();
            const category = item.is_sale ? "sale" : item.is_new ? "new" : item.is_best ? "best" : item.category || "";
            const imageUrl = item.image_url || "";
            const rating = Number(item.rating || 0);
            const cardClass = `product-card col-3 col-md-6 col-sm-12${hasSale ? " is-sale" : ""}`;

            return `
              <article class="${cardClass}"
                data-category="${escapeHtml(category)}"
                data-product-id="${escapeHtml(String(item.id || item.product_id || ""))}"
                data-name="${name}"
                data-brand="${escapeHtml(brand)}"
                data-price="${price}"
                data-rating="${rating}"
                data-image="${escapeHtml(imageUrl)}">
                <a class="product-card__media" href="#" data-quick-view data-action="quick-view" data-id="${escapeHtml(String(item.id || item.product_id || ""))}" aria-label="Xem nhanh ${name}">
                  <img src="${escapeHtml(imageUrl)}" alt="${name}" loading="lazy" />
                  ${hasSale ? '<span class="product-card__badge product-card__badge--sale">SALE</span>' : ""}
                  <span class="quick-view" aria-hidden="true">Xem nhanh</span>
                </a>
                <div class="product-card__body">
                  <h3 class="product-card__title">Giày ${name}</h3>
                  <p class="product-card__desc">Giày ${name}.</p>
                  <div class="product-card__price-row">
                    ${hasSale ? `<span class="price-old">${formatVndPlain(compareAt)}</span>` : ""}
                    <span class="price-now">${formatVndPlain(price)}</span>
                  </div>
                  <div class="product-card__actions">
                    <button class="btn btn--small btn--primary" type="button" data-add-to-cart data-action="add-to-cart" data-id="${escapeHtml(String(item.id || item.product_id || ""))}">Thêm vào giỏ</button>
                    <button class="btn btn--small btn--ghost" type="button" data-quick-view data-action="quick-view" data-id="${escapeHtml(String(item.id || item.product_id || ""))}">Chi tiết</button>
                  </div>
                </div>
              </article>
            `;
          })
          .join("");
      }

      async function fetchSaleProducts() {
        const params = new URLSearchParams();
        params.set("tag", activeTag || "sale");
        if (activeBrand) params.set("brand", activeBrand);
        if (activePrice) {
          const parts = activePrice.split("-").map((n) => Number(n));
          if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
            params.set("price_min", String(parts[0]));
            params.set("price_max", String(parts[1]));
          }
        }
        const url = `/api/products?${params.toString()}`;
        try {
          const res = await fetch(url);
          const data = await res.json();
          const items = data?.data?.items || data?.items || [];
          renderProducts(items);
        } catch (err) {
          renderProducts([]);
        }

        setActiveButton(tagButtons, activeTag, "tag");
        setActiveButton(brandButtons, activeBrand, "brand");
        setActiveButton(priceButtons, activePrice, "price");
      }

      tagButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          activeTag = (btn.dataset.tag || "sale").toLowerCase();
          fetchSaleProducts();
        });
      });

      brandButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          activeBrand = (btn.dataset.brand || "").toLowerCase();
          fetchSaleProducts();
        });
      });

      priceButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          activePrice = (btn.dataset.price || "").toLowerCase();
          fetchSaleProducts();
        });
      });

      fetchSaleProducts();
    }

    // ---------- New/Best pages (backend) ----------
    const listingTag = document.body?.dataset?.tag || "";
    if ((listingTag === "new" || listingTag === "best") && !sneakerPage && !salePage) {
      const tagButtons = $$(".filter-btn[data-tag]");
      const brandButtons = $$(".filter-btn[data-brand]");
      const priceButtons = $$(".filter-btn[data-price]");
      const formatVndPlain = (value) => `${vndFormatter.format(Number(value) || 0)}d`;
      let activeTag = listingTag;
      let activeBrand = (brandButtons.find((btn) => btn.classList.contains("is-active"))?.dataset.brand || "").toLowerCase();
      let activePrice = (priceButtons.find((btn) => btn.classList.contains("is-active"))?.dataset.price || "").toLowerCase();

      function setActiveButton(buttons, value, attr) {
        buttons.forEach((btn) => {
          const btnValue = (btn.dataset[attr] || "").toLowerCase();
          const isActive = btnValue === value;
          btn.classList.toggle("is-active", isActive);
          if (isActive) {
            btn.setAttribute("aria-current", "true");
          } else {
            btn.removeAttribute("aria-current");
          }
        });
      }

      function renderProducts(items) {
        if (!productGrid) return;
        if (!items.length) {
          productGrid.innerHTML =
            '<article class="product-card col-12"><div class="product-card__body"><h3 class="product-card__title">Không tìm thấy sản phẩm</h3><p class="muted">Vui lòng thử bộ lọc khác.</p></div></article>';
          return;
        }

        productGrid.innerHTML = items
          .map((item) => {
            const name = escapeHtml(item.name || "Giay sneaker");
            const price = Number(item.price || 0);
            const compareAt = Number(item.compare_at || 0);
            const hasSale = compareAt > price;
            const brand = (item.brand || "").toLowerCase();
            const category = item.is_sale ? "sale" : item.is_new ? "new" : item.is_best ? "best" : item.category || "";
            const imageUrl = item.image_url || "";
            const rating = Number(item.rating || 0);
            const cardClass = `product-card col-3 col-md-6 col-sm-12${hasSale ? " is-sale" : ""}`;

            return `
              <article class="${cardClass}"
                data-category="${escapeHtml(category)}"
                data-product-id="${escapeHtml(String(item.id || item.product_id || ""))}"
                data-name="${name}"
                data-brand="${escapeHtml(brand)}"
                data-price="${price}"
                data-rating="${rating}"
                data-image="${escapeHtml(imageUrl)}">
                <a class="product-card__media" href="#" data-quick-view data-action="quick-view" data-id="${escapeHtml(String(item.id || item.product_id || ""))}" aria-label="Xem nhanh ${name}">
                  <img src="${escapeHtml(imageUrl)}" alt="${name}" loading="lazy" />
                  ${hasSale ? '<span class="product-card__badge product-card__badge--sale">SALE</span>' : ""}
                  <span class="quick-view" aria-hidden="true">Xem nhanh</span>
                </a>
                <div class="product-card__body">
                  <h3 class="product-card__title">Giay ${name}</h3>
                  <p class="product-card__desc">Giay ${name}.</p>
                  <div class="product-card__price-row">
                    ${hasSale ? `<span class="price-old">${formatVndPlain(compareAt)}</span>` : ""}
                    <span class="price-now">${formatVndPlain(price)}</span>
                  </div>
                  <div class="product-card__actions">
                    <button class="btn btn--small btn--primary" type="button" data-add-to-cart data-action="add-to-cart" data-id="${escapeHtml(String(item.id || item.product_id || ""))}">Thêm vào giỏ</button>
                    <button class="btn btn--small btn--ghost" type="button" data-quick-view data-action="quick-view" data-id="${escapeHtml(String(item.id || item.product_id || ""))}">Chi tiết</button>
                  </div>
                </div>
              </article>
            `;
          })
          .join("");
      }

      async function fetchListingProducts() {
        const params = new URLSearchParams();
        params.set("tag", activeTag || listingTag);
        if (activeBrand) params.set("brand", activeBrand);
        if (activePrice) {
          const parts = activePrice.split("-").map((n) => Number(n));
          if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
            params.set("price_min", String(parts[0]));
            params.set("price_max", String(parts[1]));
          }
        }
        const url = `/api/products?${params.toString()}`;
        try {
          const res = await fetch(url);
          const data = await res.json();
          const items = data?.data?.items || data?.items || [];
          renderProducts(items);
        } catch (err) {
          renderProducts([]);
        }

        setActiveButton(tagButtons, activeTag, "tag");
        setActiveButton(brandButtons, activeBrand, "brand");
        setActiveButton(priceButtons, activePrice, "price");
      }

      tagButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          activeTag = (btn.dataset.tag || listingTag).toLowerCase();
          fetchListingProducts();
        });
      });

      brandButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          activeBrand = (btn.dataset.brand || "").toLowerCase();
          fetchListingProducts();
        });
      });

      priceButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          activePrice = (btn.dataset.price || "").toLowerCase();
          fetchListingProducts();
        });
      });

      fetchListingProducts();
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

    // ---------- Banner slider ----------
    const bannerTrack = $("#bannerTrack");
    const bannerPrev = $("#bannerPrev");
    const bannerNext = $("#bannerNext");
    const bannerDots = $$("[data-banner-dot]");
    const bannerSlides = bannerTrack ? $$(".banner__slide", bannerTrack) : [];
    let bannerIndex = 0;
    let bannerTimer = null;

    function setBanner(index) {
      if (!bannerTrack || !bannerSlides.length) return;
      bannerIndex = (index + bannerSlides.length) % bannerSlides.length;
      bannerTrack.style.transform = `translateX(-${bannerIndex * 100}%)`;
      bannerDots.forEach((dot, i) => dot.classList.toggle("is-active", i === bannerIndex));
    }

    function nextBanner() {
      setBanner(bannerIndex + 1);
    }

    function startBannerAuto() {
      if (!bannerSlides.length) return;
      if (bannerTimer) clearInterval(bannerTimer);
      bannerTimer = setInterval(nextBanner, 5000);
    }

    bannerPrev?.addEventListener("click", () => {
      setBanner(bannerIndex - 1);
      startBannerAuto();
    });

    bannerNext?.addEventListener("click", () => {
      setBanner(bannerIndex + 1);
      startBannerAuto();
    });

    bannerDots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const idx = Number(dot.dataset.bannerDot || "0");
        setBanner(idx);
        startBannerAuto();
      });
    });

    setBanner(0);
    startBannerAuto();
  
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
  
    const newsletterForm = $("#newsletterForm");
    newsletterForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = ($("#email")?.value || "").trim();
  
      if (!email) return toast("Newsletter", "Please enter your email.");
      if (!isValidEmail(email)) return toast("Newsletter", "Email looks invalid. Try again.");

      newsletterForm.reset();
      toast("Subscribed!", "You’ll get early access to new drops.");
    });
  
    function isValidEmail(s) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    }
  
 
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
  
   
      if (modal?.classList.contains("is-open")) return closeModal();
      if (drawer?.classList.contains("is-open")) return closeDrawer();
    });
  

    $("#cartBtn")?.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const data = await fetchCart();
        const count = Number(data?.data?.totals?.count || 0);
        setCartCount(count);
        window.location.href = "cart.html";
      } catch (err) {
        console.error("[Cart] open cart failed", err);
        toast("Cart", "Unable to load cart.");
      }
    });

    $("#cartBtnDesktop")?.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const data = await fetchCart();
        const count = Number(data?.data?.totals?.count || 0);
        setCartCount(count);
        window.location.href = "cart.html";
      } catch (err) {
        console.error("[Cart] open cart failed", err);
        toast("Cart", "Unable to load cart.");
      }
    });

    $("#accountBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      toast("Account", "Login / profile (Demo UI)");
    });

    $("#accountBtnDesktop")?.addEventListener("click", (e) => {
      e.preventDefault();
      toast("Account", "Login / profile (Demo UI)");
    });
  })();
