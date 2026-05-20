// ============================================================
// ZENITHTAIL — script.js
// ============================================================

// 1. LOCAL STORAGE HELPERS (no backend required — 100% free)

function lsGet(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function saveCartLocal()  { lsSet('zenith_cart', cart); }
function loadCartLocal()  { cart = lsGet('zenith_cart', []); }

function saveOrderLocal(order) {
    const orders = lsGet('zenith_orders', []);
    orders.unshift({ ...order, id: Date.now().toString(36) + Math.random().toString(36).slice(2,6) });
    lsSet('zenith_orders', orders);
}
function loadOrdersLocal() { return lsGet('zenith_orders', []); }

function saveUserLocal(user) { lsSet('zenith_user', user); currentUser = user; }
function clearUserLocal()    { localStorage.removeItem('zenith_user'); currentUser = null; }

// 3. APP STATE
let currentUser = null;
let cart = [];
let activeCategory = 'all';
let detailSwiper = null;
let currentDetailQty = 1;
let selectedSize = null;
let searchQuery = '';
let sortBy = 'default';
let wishlist = JSON.parse(localStorage.getItem('zenith_wishlist') || '[]');
let appliedDiscount = null;
let allAdminOrders = []; // cache for admin filter

// Discount codes
const DISCOUNT_CODES = {
    'ZENITH10':  { type: 'percent', value: 10, label: '10% off' },
    'WELCOME20': { type: 'percent', value: 20, label: '20% off' },
    'PAWS15':    { type: 'percent', value: 15, label: '15% off' },
    'FLAT50':    { type: 'fixed',   value: 50, label: '₹50 off' }
};

// 4. PRODUCT CATALOGUE
const products = [
    {
        id: 1, prefix: 'q',
        title: "Zenith-Mist 3-in-1 Brush",
        price: 499, old: 999,
        category: 'grooming',
        badge: 'Best Seller',
        rating: 4.8, reviewCount: 312, sold: 892,
        shortDesc: "Spray, brush & detangle in one smooth pass.",
        longDesc: "Our nano-atomization technology releases a fine conditioning mist while you brush, reducing tangles and static — making grooming 3× faster and more enjoyable for your pet. The whisper-quiet motor runs at under 45dB so even nervous pets stay calm. IPX4 waterproof body means easy cleaning. Charges fully in 2 hours via USB-C and lasts up to 60 minutes.",
        features: ['Nano-mist conditioning spray', 'Ultra-quiet <45dB motor', 'USB-C rechargeable (2hr full charge)', 'IPX4 waterproof — easy to clean', 'Works on all coat types'],
        images: 4,
        stock: 8
    },
    {
        id: 2, prefix: 'w',
        title: "One-Click Pro-Clean Brush",
        price: 299, old: 699,
        category: 'grooming',
        badge: 'New',
        rating: 4.9, reviewCount: 478, sold: 1340,
        shortDesc: "Captures every strand. Ejects with one click.",
        longDesc: "High-density stainless steel pins penetrate deep to capture even the finest undercoat fur that standard brushes miss. When you're done, a single press of the ejector button clears all collected fur instantly — no more picking hair off the brush by hand. The ergonomic anti-slip handle is designed for extended grooming sessions without hand fatigue. Suitable for dogs and cats of all sizes.",
        features: ['One-click fur ejector button', 'High-density stainless steel pins', 'Ergonomic anti-slip handle', 'Reaches fine undercoat fur', 'For dogs & cats of all sizes'],
        images: 4,
        stock: 14
    },
    {
        id: 3, prefix: 'e',
        title: "ZenithControl Safety Harness",
        price: 599, old: 1250,
        category: 'accessories',
        badge: 'Premium',
        rating: 4.7, reviewCount: 256, sold: 634,
        shortDesc: "No-pull design built for Indian streets.",
        longDesc: "Engineered with dual leash clips — front and back — to completely eliminate pulling. The padded chest and belly panels distribute pressure evenly so your dog walks in comfort, even on long outings. Made from 1680D military-grade ballistic nylon that resists abrasion and extreme weather. Reflective strips on all four sides keep your pet visible during evening walks. Machine washable. Available in sizes S, M, and L.",
        features: ['Dual clip no-pull design (front + back)', 'Military-grade 1680D ballistic nylon', 'Padded chest & belly for comfort', 'Reflective strips on all 4 sides', 'Machine washable — sizes S / M / L'],
        images: 4,
        sizes: ['S', 'M', 'L'],
        stock: 11
    },
    {
        id: 4, prefix: 'r',
        title: "ZenithGrip Pro Hand Trainer",
        price: 249, old: 599,
        category: 'owner',
        badge: 'For Owners',
        rating: 4.6, reviewCount: 184, sold: 521,
        shortDesc: "Build grip strength for confident walks & grooming.",
        longDesc: "Most pet owners don't realise that aching wrists and weak grip are what make walks exhausting and grooming sessions a struggle. The ZenithGrip Pro uses progressive-resistance carbon steel springs (15–40 kg adjustable) housed in an anti-slip TPR grip — the same material used in professional physiotherapy equipment. Stronger hands mean firmer leash control on pulls, steadier hold during nail trims, and less fatigue during long brushing sessions. Comes with a printed 4-week Pet-Owner Strength Programme card. Cheaper grippers under ₹100 use brittle coil springs that lose tension within weeks — ZenithGrip Pro is rated for 500,000 repetitions.",
        features: [
            'Adjustable resistance 15–40 kg (carbon steel spring)',
            'Anti-slip TPR ergonomic handles — no hand fatigue',
            'Rated 500,000 reps — built to outlast budget grippers',
            'Includes 4-week Pet-Owner Strength Programme card',
            'Designed for leash control, grooming & nail-trim grip'
        ],
        images: 4,
        stock: 20
    },
    {
        id: 5, prefix: 't',
        title: "ZenithGrip Combo — Hand + Finger Trainer",
        price: 349, old: 799,
        category: 'owner',
        badge: 'Combo Deal',
        rating: 4.8, reviewCount: 97, sold: 214,
        shortDesc: "Full hand & finger strength in one combo pack.",
        longDesc: "The ultimate strength combo for serious pet owners. The Hand Gripper provides heavy progressive resistance (15–40 kg, carbon steel spring) to build overall palm and wrist strength — critical for controlling strong dogs on a leash. The Finger Gripper individually trains each finger with targeted ring resistance, dramatically improving your grip on grooming tools, leash handles, and nail-trim equipment. Together they deliver a complete hand workout that cheaper single grippers simply can't match. Perfect for pet parents who want faster results and better control without buying two separate products.",
        features: [
            'Includes both Hand Gripper & Finger Gripper',
            'Hand gripper: 15–40 kg adjustable carbon steel spring',
            'Finger gripper: individual finger resistance rings',
            'Anti-slip TPR handles on both pieces',
            'Better value combo — save vs. buying separately'
        ],
        images: 2,
        stock: 15
    }
];

// 4b. CUSTOMER REVIEWS
const productReviews = {
    1: [
        { name: "Priya S.", city: "Bangalore", rating: 5, text: "My golden retriever absolutely loves this! The mist feature is amazing — he used to run away from brushes but now he sits still and enjoys it. Worth every rupee!", date: "2 days ago", avatar: "P", color: "#DEAD6F" },
        { name: "Rahul M.", city: "Mumbai", rating: 5, text: "Bought for my husky — total game changer! Detangles so easily and the mist keeps his coat shiny. USB-C charging is super convenient.", date: "1 week ago", avatar: "R", color: "#5b8dee" },
        { name: "Ananya K.", city: "Delhi", rating: 4, text: "Really good product. My cat was nervous at first but now she loves grooming time. The quiet motor makes all the difference for anxious pets.", date: "2 weeks ago", avatar: "A", color: "#43b08c" },
    ],
    2: [
        { name: "Vikram T.", city: "Hyderabad", rating: 5, text: "The one-click ejector is pure genius! No more picking fur off the brush by hand. Works perfectly on my lab's thick coat. Highly recommend.", date: "3 days ago", avatar: "V", color: "#e05252" },
        { name: "Sneha P.", city: "Pune", rating: 5, text: "Affordable and super effective. Collects way more fur than my old brush. My house is so much cleaner now! Great quality for the price.", date: "1 week ago", avatar: "S", color: "#9c6bd6" },
        { name: "Arjun N.", city: "Chennai", rating: 5, text: "Best grooming brush I've used for my indie dog. Easy to clean, very comfortable to hold, and the pins don't scratch the skin at all.", date: "3 weeks ago", avatar: "A", color: "#43b08c" },
    ],
    3: [
        { name: "Meera R.", city: "Kolkata", rating: 5, text: "My border collie was a nightmare on walks — always pulling hard. The ZenithControl Harness changed everything. He walks so calmly now with the front clip!", date: "1 day ago", avatar: "M", color: "#DEAD6F" },
        { name: "Saurabh G.", city: "Ahmedabad", rating: 5, text: "Outstanding quality. The reflective strips are great for night walks. My dog seems very comfortable — he doesn't try to wriggle out like his old harness.", date: "5 days ago", avatar: "S", color: "#5b8dee" },
        { name: "Divya L.", city: "Jaipur", rating: 4, text: "Great harness! Size M fits my beagle perfectly. The chest padding is really soft and he doesn't resist wearing it at all. Very happy with this purchase.", date: "2 weeks ago", avatar: "D", color: "#43b08c" },
    ],
    4: [
        { name: "Kavitha R.", city: "Bangalore", rating: 5, text: "My arm used to ache after every walk with my husky. After 3 weeks with the ZenithGrip I barely feel the pull anymore. The resistance card is a nice touch — actually followed it!", date: "4 days ago", avatar: "K", color: "#DEAD6F" },
        { name: "Suresh M.", city: "Chennai", rating: 5, text: "Bought this for better grip during nail trims — my lab never stays still. Huge difference after two weeks. Quality feels much better than the cheap ones on other sites.", date: "1 week ago", avatar: "S", color: "#5b8dee" },
        { name: "Pooja A.", city: "Pune", rating: 4, text: "Good solid build, the spring resistance is noticeably stronger than cheaper brands. My wrist pain during grooming has reduced a lot. Worth paying a bit more for the quality.", date: "3 weeks ago", avatar: "P", color: "#43b08c" },
    ],
    5: [
        { name: "Nisha T.", city: "Delhi", rating: 5, text: "Brilliant combo! The finger gripper is something I didn't know I needed — my fingers used to cramp during nail trims. Both pieces are solid quality and the combo price is great.", date: "2 days ago", avatar: "N", color: "#DEAD6F" },
        { name: "Rohit K.", city: "Hyderabad", rating: 5, text: "Got both pieces and use them daily before morning walks with my rottweiler. My grip strength has noticeably improved in just two weeks. Way better value than buying separately.", date: "5 days ago", avatar: "R", color: "#5b8dee" },
        { name: "Lakshmi V.", city: "Bangalore", rating: 5, text: "Love this combo! The hand gripper is great for overall strength and the finger gripper really helped with holding the leash steady during pulls. Highly recommend for large dog owners.", date: "2 weeks ago", avatar: "L", color: "#43b08c" },
    ]
};

// ============================================================
// 5. UI HELPERS
// ============================================================

function starHtml(rating, size = '0.75rem') {
    const full = Math.floor(rating);
    const half = (rating - full) >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i++) {
        if (i < full) html += `<i class="bi bi-star-fill text-warning" style="font-size:${size}"></i>`;
        else if (i === full && half) html += `<i class="bi bi-star-half text-warning" style="font-size:${size}"></i>`;
        else html += `<i class="bi bi-star text-warning" style="font-size:${size}"></i>`;
    }
    return html;
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('liveToast');
    const toastMsg = document.getElementById('toast-msg');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.className = `toast align-items-center text-white border-0 bg-${type}`;
    bootstrap.Toast.getOrCreateInstance(toast, { delay: 2500 }).show();
}

function showSpinner() {
    const el = document.getElementById('spinner-overlay');
    if (el) el.style.display = 'flex';
}

function hideSpinner() {
    const el = document.getElementById('spinner-overlay');
    if (el) el.style.display = 'none';
}

// ============================================================
// 6. PAGE NAVIGATION  (single authoritative definition)
// ============================================================

window.showPage = (pageId, pid = null) => {
    const pages = ['home-page', 'login-page', 'detail-page', 'checkout-page', 'thankyou-page', 'account-page', 'admin-page', 'wishlist-page'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const target = document.getElementById(pageId);
    if (target) target.style.display = 'block';

    if (pageId === 'detail-page' && pid) {
        renderProductDetails(pid);
        // Show mobile buy bar
        const p = products.find(pr => pr.id === pid);
        const bar = document.getElementById('mobile-buy-bar');
        if (bar && p) {
            bar.style.display = 'block';
            const t = document.getElementById('mobile-buy-title');
            const pr = document.getElementById('mobile-buy-price');
            if (t) t.textContent = p.title;
            if (pr) pr.textContent = `₹${p.price}`;
        }
        // hide floating cart when buy bar is showing
        const trigger = document.getElementById('cart-trigger');
        if (trigger) trigger.style.display = 'none';
    } else {
        const bar = document.getElementById('mobile-buy-bar');
        if (bar) bar.style.display = 'none';
        const trigger = document.getElementById('cart-trigger');
        if (trigger) trigger.style.display = 'flex';
    }

    if (pageId === 'account-page') showAccountDashboard();
    if (pageId === 'checkout-page') { appliedDiscount = null; populateCheckoutSummary(); }
    if (pageId === 'admin-page') loadAdminStats();
    if (pageId === 'wishlist-page') renderWishlistPage();

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.goToCheckout = () => {
    if (cart.length === 0) {
        showToast('Your bag is empty!', 'danger');
        return;
    }
    // Close cart offcanvas
    const offcanvasEl = document.getElementById('cartMenu');
    if (offcanvasEl) {
        bootstrap.Offcanvas.getInstance(offcanvasEl)?.hide();
    }
    showPage('checkout-page');
};

window.continueShoppingFromCart = () => {
    const offcanvasEl = document.getElementById('cartMenu');
    if (offcanvasEl) bootstrap.Offcanvas.getInstance(offcanvasEl)?.hide();
    showPage('home-page');
};

// ============================================================
// 7. PRODUCT GRID & FILTERING
// ============================================================

// Most expensive product id gets a discount countdown timer
const TIMER_PRODUCT_ID = 3;

function getTimerEnd() {
    let end = parseInt(localStorage.getItem('zenith_timer_end') || '0');
    if (!end || end < Date.now()) {
        end = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
        localStorage.setItem('zenith_timer_end', end);
    }
    return end;
}

let timerInterval = null;
function startDiscountTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const end = getTimerEnd();
    function tick() {
        const el = document.getElementById(`deal-timer-${TIMER_PRODUCT_ID}`);
        if (!el) { clearInterval(timerInterval); return; }
        const diff = end - Date.now();
        if (diff <= 0) {
            el.textContent = '00:00:00';
            clearInterval(timerInterval);
            return;
        }
        const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        el.textContent = `${h}:${m}:${s}`;
    }
    tick();
    timerInterval = setInterval(tick, 1000);
}

function getFilteredSortedProducts() {
    let list = activeCategory === 'all'
        ? [...products]
        : products.filter(p => p.category === activeCategory);

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.shortDesc.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
    }

    switch (sortBy) {
        case 'price-asc':   list.sort((a, b) => a.price - b.price); break;
        case 'price-desc':  list.sort((a, b) => b.price - a.price); break;
        case 'rating':      list.sort((a, b) => b.rating - a.rating); break;
        case 'discount':    list.sort((a, b) => (b.old - b.price) / b.old - (a.old - a.price) / a.old); break;
        default:            list.sort((a, b) => b.sold - a.sold);
    }
    return list;
}

function renderGrid() {
    const grid = document.getElementById('main-grid');
    if (!grid) return;

    const filtered = getFilteredSortedProducts();

    // Update heading / result count
    const headingEl = document.getElementById('shop-heading');
    const countEl = document.getElementById('shop-result-count');
    if (headingEl) headingEl.textContent = searchQuery ? `Results for "${searchQuery}"` : 'The Premium Collection';
    if (countEl) countEl.textContent = searchQuery || activeCategory !== 'all' ? `${filtered.length} product${filtered.length !== 1 ? 's' : ''}` : '';

    grid.innerHTML = filtered.length === 0
        ? `<div class="col-12 text-center py-5 text-muted">
               <i class="bi bi-search fs-1 d-block mb-3 opacity-25"></i>
               No products found. <button class="btn btn-link p-0" onclick="clearSearch()">Clear search</button>
           </div>`
        : filtered.map(p => {
            const discount = Math.round((1 - p.price / p.old) * 100);
            const inWishlist = wishlist.includes(p.id);
            const timerHtml = p.id === TIMER_PRODUCT_ID ? `
                <div style="background:#fff3cd;border-radius:8px;padding:6px 10px;margin-bottom:10px;font-size:0.72rem;font-weight:700;color:#856404;display:flex;align-items:center;justify-content:center;gap:6px;">
                    <i class="bi bi-alarm-fill"></i> Deal ends in:
                    <span id="deal-timer-${p.id}" style="font-family:monospace;font-size:0.85rem;color:#c0392b;letter-spacing:1px;">--:--:--</span>
                </div>` : '';
            return `
            <div class="col-11 col-sm-6 col-md-4">
                <div class="product-card shadow-sm">
                    <div class="product-img-box" onclick="showPage('detail-page', ${p.id})" style="cursor:pointer;">
                        <span class="product-badge">${p.badge}</span>
                        <img src="images/${p.prefix}1.jpeg" alt="${p.title}" loading="lazy"
                             onerror="this.src='https://via.placeholder.com/400x400?text=ZenithTail'">
                        <span class="sold-badge">${p.sold.toLocaleString('en-IN')} sold</span>
                        <button class="wishlist-btn ${inWishlist ? 'active' : ''}" data-pid="${p.id}"
                                onclick="event.stopPropagation(); toggleWishlist(${p.id}, this)" title="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
                            <i class="bi ${inWishlist ? 'bi-heart-fill' : 'bi-heart'}"></i>
                        </button>
                    </div>
                    <div class="p-3 text-center" onclick="showPage('detail-page', ${p.id})" style="cursor:pointer;">
                        <h5 class="fw-bold mb-1 small">${p.title}</h5>
                        <div class="product-stars mb-1">
                            ${starHtml(p.rating)}
                            <span class="text-muted ms-1" style="font-size:0.7rem;">${p.rating} (${p.reviewCount})</span>
                        </div>
                        <p class="text-muted small mb-2" style="font-size:0.78rem;">${p.shortDesc}</p>
                        <div class="mb-3">
                            <span class="text-primary fw-bold fs-5">₹${p.price}</span>
                            <small class="text-muted text-decoration-line-through ms-2">₹${p.old}</small>
                            <span class="ms-1 badge bg-success-subtle text-success" style="font-size:0.65rem;">${discount}% OFF</span>
                        </div>
                        ${timerHtml}
                        <button class="btn btn-primary w-100 rounded-pill small fw-bold">View Details →</button>
                    </div>
                </div>
            </div>`;
        }).join('');

    if (filtered.some(p => p.id === TIMER_PRODUCT_ID)) {
        startDiscountTimer();
    }
}

window.filterProducts = (category) => {
    activeCategory = category;
    searchQuery = '';
    const ni = document.getElementById('navbar-search');
    const mi = document.getElementById('mobile-search-input');
    if (ni) ni.value = '';
    if (mi) mi.value = '';

    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.id === `pill-${category}`);
    });

    renderGrid();

    const section = document.getElementById('shop-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.handleSearch = (val) => {
    searchQuery = val.trim();
    // Sync both search inputs
    const ni = document.getElementById('navbar-search');
    const mi = document.getElementById('mobile-search-input');
    if (ni && ni.value !== val) ni.value = val;
    if (mi && mi.value !== val) mi.value = val;

    showPage('home-page');
    setTimeout(() => {
        renderGrid();
        const section = document.getElementById('shop-section');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
};

window.clearSearch = () => {
    searchQuery = '';
    const ni = document.getElementById('navbar-search');
    const mi = document.getElementById('mobile-search-input');
    if (ni) ni.value = '';
    if (mi) mi.value = '';
    renderGrid();
};

window.handleSort = (val) => {
    sortBy = val;
    renderGrid();
};

window.toggleMobileSearch = () => {
    const bar = document.getElementById('mobile-search-bar');
    if (!bar) return;
    const visible = bar.style.display !== 'none' && bar.style.display !== '';
    bar.style.display = visible ? 'none' : 'block';
    if (!visible) document.getElementById('mobile-search-input')?.focus();
};

// ============================================================
// 8. PRODUCT DETAIL PAGE
// ============================================================

function renderProductDetails(pid) {
    const p = products.find(prod => prod.id === pid);
    const content = document.getElementById('detail-content');
    if (!p || !content) return;

    selectedSize = null;
    currentDetailQty = 1;

    const discount = Math.round((1 - p.price / p.old) * 100);

    const slides = Array.from({ length: p.images }, (_, i) =>
        `<div class="swiper-slide">
            <img src="images/${p.prefix}${i + 1}.jpeg" alt="${p.title} image ${i + 1}"
                 onerror="this.src='https://via.placeholder.com/500x500?text=ZenithTail'"
                 style="width:100%;height:100%;object-fit:cover;">
         </div>`
    ).join('');

    const thumbs = Array.from({ length: p.images }, (_, i) =>
        `<img src="images/${p.prefix}${i + 1}.jpeg"
              class="rounded-3 border thumb-img"
              width="60" height="60"
              style="object-fit:cover;cursor:pointer;border-width:2px!important;"
              onclick="detailSwiper && detailSwiper.slideTo(${i})"
              alt="thumb ${i + 1}">`
    ).join('');

    const sizeSelector = p.sizes ? `
        <div class="mb-3">
            <div class="fw-bold small mb-2">Size: <span id="selected-size-label" class="text-primary">Select a size</span></div>
            <div class="size-selector">
                ${p.sizes.map(s => `<button class="size-btn" onclick="selectSize('${s}', this)">${s}</button>`).join('')}
            </div>
            <div class="text-muted mt-1" style="font-size:0.72rem;">S = up to 8kg &nbsp;|&nbsp; M = 8–18kg &nbsp;|&nbsp; L = 18–35kg</div>
        </div>` : '';

    const featureItems = p.features.map(f => `<li>${f}</li>`).join('');

    const reviews = (productReviews[p.id] || []).map(r => `
        <div class="detail-review-card">
            <div class="d-flex align-items-center gap-2 mb-2">
                <div class="review-avatar" style="background:${r.color};width:34px;height:34px;font-size:0.8rem;">${r.avatar}</div>
                <div>
                    <div class="fw-bold small">${r.name} <span class="text-muted fw-normal" style="font-size:0.72rem">· ${r.city}</span></div>
                    <div class="detail-review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                </div>
                <span class="ms-auto text-muted" style="font-size:0.72rem;">${r.date}</span>
            </div>
            <p class="small text-muted mb-0" style="line-height:1.6;">${r.text}</p>
        </div>`
    ).join('');

    content.innerHTML = `
        <div class="col-md-6">
            <div class="swiper detail-swiper rounded-4 overflow-hidden shadow-sm">
                <div class="swiper-wrapper">${slides}</div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            </div>
            <div class="d-flex gap-2 mt-3 justify-content-center">${thumbs}</div>
        </div>

        <div class="col-md-6 d-flex flex-column justify-content-start">
            <nav class="text-muted small mb-2" style="font-size:0.75rem;">
                <span style="cursor:pointer" onclick="showPage('home-page')">Home</span>
                <span class="mx-1">/</span>
                <span style="cursor:pointer;text-transform:capitalize" onclick="filterProducts('${p.category}');showPage('home-page')">${p.category}</span>
                <span class="mx-1">/</span>
                <span class="text-dark">${p.title}</span>
            </nav>

            <span class="badge mb-2" style="background:var(--primary);color:white;width:fit-content;font-size:0.7rem;">${p.badge}</span>
            <h2 class="fw-bold mb-1" style="font-size:1.4rem;">${p.title}</h2>

            <div class="d-flex align-items-center gap-2 mb-3">
                <div>${starHtml(p.rating, '0.85rem')}</div>
                <span class="fw-bold small text-primary">${p.rating}</span>
                <span class="text-muted small">(${p.reviewCount} reviews)</span>
                <span class="text-muted" style="font-size:0.72rem;">|</span>
                <span class="text-muted small">${p.sold.toLocaleString('en-IN')} sold</span>
            </div>

            <div class="d-flex align-items-baseline gap-2 mb-1">
                <span class="fs-2 fw-bold text-primary">₹${p.price}</span>
                <span class="text-decoration-line-through text-muted fs-6">₹${p.old}</span>
                <span class="badge bg-success fs-6" style="font-size:0.75rem!important;">${discount}% OFF</span>
            </div>
            <div class="text-success small fw-bold mb-3">You save ₹${p.old - p.price}!</div>

            <div class="urgency-row mb-3">
                <span class="stock-dot"></span>
                <strong>Only ${p.stock} left in stock</strong> — order soon!
                &nbsp;&nbsp;<i class="bi bi-fire text-danger"></i>
                <span class="text-danger fw-bold">47 people</span> bought this in the last 24 hours
            </div>

            ${sizeSelector}

            <div class="d-flex align-items-center gap-3 mb-3">
                <span class="fw-bold small">Qty:</span>
                <div class="qty-control">
                    <button class="qty-btn" onclick="changeDetailQty(-1)">−</button>
                    <span id="detail-qty">1</span>
                    <button class="qty-btn" onclick="changeDetailQty(1)">+</button>
                </div>
            </div>

            <button class="btn btn-primary btn-lg rounded-pill fw-bold mb-2 shadow-sm" onclick="addToCart(${p.id})">
                <i class="bi bi-bag-plus me-2"></i>Add to Bag
            </button>
            <button class="btn btn-success btn-lg rounded-pill fw-bold mb-3" onclick="addToCartAndCheckout(${p.id})">
                <i class="bi bi-lightning-fill me-2"></i>Buy Now
            </button>

            <div class="delivery-info-box mb-3">
                <div class="d-flex align-items-center gap-2 mb-2">
                    <i class="bi bi-geo-alt text-success"></i>
                    <span><strong>Delivery:</strong> 5–7 business days across India</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-cash-coin text-success"></i>
                    <span class="cod-badge-inline"><i class="bi bi-check-circle-fill"></i> Cash on Delivery Available</span>
                    <span class="text-muted" style="font-size:0.72rem;">Pay when it arrives</span>
                </div>
            </div>

            <div class="detail-trust-row mb-4">
                <span><i class="bi bi-shield-check"></i> 100% Genuine</span>
                <span><i class="bi bi-arrow-return-left"></i> 7-Day Returns</span>
                <span><i class="bi bi-lock"></i> Secure Checkout</span>
                <span><i class="bi bi-whatsapp"></i> WhatsApp Support</span>
            </div>

            <div class="mb-3">
                <div class="fw-bold small mb-2">About this product</div>
                <p class="text-muted small" style="line-height:1.7;">${p.longDesc}</p>
                <ul class="feature-list">${featureItems}</ul>
            </div>
        </div>

        <div class="col-12 reviews-section-detail">
            <div class="row g-4 align-items-start">
                <div class="col-md-3">
                    <div class="review-rating-summary">
                        <div class="review-big-number">${p.rating}</div>
                        <div class="my-2">${starHtml(p.rating, '1rem')}</div>
                        <div class="text-muted small">${p.reviewCount} verified reviews</div>
                    </div>
                </div>
                <div class="col-md-9">
                    <h5 class="fw-bold mb-3">Customer Reviews</h5>
                    ${reviews}
                </div>
            </div>
        </div>`;

    if (detailSwiper) {
        detailSwiper.destroy(true, true);
        detailSwiper = null;
    }

    requestAnimationFrame(() => {
        detailSwiper = new Swiper('.detail-swiper', {
            loop: true,
            pagination: { el: '.detail-swiper .swiper-pagination', clickable: true },
            navigation: {
                nextEl: '.detail-swiper .swiper-button-next',
                prevEl: '.detail-swiper .swiper-button-prev'
            }
        });
    });
}

window.selectSize = (size, btn) => {
    selectedSize = size;
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const label = document.getElementById('selected-size-label');
    if (label) label.textContent = `Size ${size} selected`;
};

window.changeDetailQty = (val) => {
    currentDetailQty = Math.max(1, currentDetailQty + val);
    const el = document.getElementById('detail-qty');
    if (el) el.textContent = currentDetailQty;
};

// ============================================================
// 9. CART
// ============================================================

window.addToCart = (pid) => {
    const item = products.find(p => p.id === pid);
    if (!item) return false;

    if (item.sizes && !selectedSize) {
        showToast('Please select a size first!', 'warning');
        document.querySelector('.size-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    const qty = currentDetailQty || 1;
    const cartKey = selectedSize ? `${pid}-${selectedSize}` : `${pid}`;
    const existing = cart.find(c => c.cartKey === cartKey);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ id: item.id, cartKey, title: item.title + (selectedSize ? ` (Size ${selectedSize})` : ''), price: item.price, prefix: item.prefix, qty });
    }

    updateCartDisplay();
    showToast(`${item.title} added to bag! 🐾`);
    bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('cartMenu')).show();
    currentDetailQty = 1;
    const qtyEl = document.getElementById('detail-qty');
    if (qtyEl) qtyEl.textContent = '1';
    return true;
};

window.addToCartAndCheckout = (pid) => {
    const added = window.addToCart(pid);
    if (!added) return;
    setTimeout(() => {
        bootstrap.Offcanvas.getInstance(document.getElementById('cartMenu'))?.hide();
        showPage('checkout-page');
    }, 500);
};

window.changeCartQty = (idx, val) => {
    cart[idx].qty += val;
    if (cart[idx].qty < 1) cart.splice(idx, 1);
    updateCartDisplay();
};

function updateCartDisplay(shouldSync = true) {
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const totalCount = cart.reduce((sum, i) => sum + i.qty, 0);

    // Update both count badges
    ['cart-count', 'cart-count-nav'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = totalCount;
    });

    const list = document.getElementById('cart-items');
    if (list) {
        list.innerHTML = cart.length === 0
            ? `<div class="text-center text-muted py-5">
                   <i class="bi bi-bag-x fs-1 d-block mb-2 opacity-25"></i>
                   Your bag is empty
               </div>`
            : cart.map((item, idx) => `
                <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                    <img src="images/${item.prefix}1.jpeg" width="50" height="50"
                         class="rounded-3 me-2" style="object-fit:cover;" alt="${item.title}">
                    <div class="flex-grow-1">
                        <div class="small fw-bold">${item.title}</div>
                        <div class="text-primary small fw-bold">₹${item.price * item.qty}</div>
                    </div>
                    <div class="d-flex align-items-center gap-1">
                        <button class="qty-btn" onclick="changeCartQty(${idx}, -1)">−</button>
                        <span class="small fw-bold px-1">${item.qty}</span>
                        <button class="qty-btn" onclick="changeCartQty(${idx}, 1)">+</button>
                    </div>
                </div>`).join('');
    }

    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = `₹${total}`;

    if (shouldSync) saveCartLocal();
}

// ============================================================
// WISHLIST
// ============================================================

window.toggleWishlist = (pid, btn) => {
    const idx = wishlist.indexOf(pid);
    if (idx === -1) {
        wishlist.push(pid);
        showToast('Added to wishlist ❤️');
    } else {
        wishlist.splice(idx, 1);
        showToast('Removed from wishlist');
    }
    localStorage.setItem('zenith_wishlist', JSON.stringify(wishlist));
    // Update all wishlist buttons for this product
    document.querySelectorAll(`.wishlist-btn[data-pid="${pid}"]`).forEach(b => {
        b.classList.toggle('active', wishlist.includes(pid));
        b.innerHTML = `<i class="bi ${wishlist.includes(pid) ? 'bi-heart-fill' : 'bi-heart'}"></i>`;
    });
    // Update nav count
    updateWishlistNavCount();
};

function updateWishlistNavCount() {
    const badge = document.getElementById('wishlist-count-nav');
    if (!badge) return;
    if (wishlist.length > 0) {
        badge.textContent = wishlist.length;
        badge.style.display = 'inline';
    } else {
        badge.style.display = 'none';
    }
}

function renderWishlistPage() {
    const grid = document.getElementById('wishlist-grid');
    if (!grid) return;

    const wishlistProducts = products.filter(p => wishlist.includes(p.id));

    if (wishlistProducts.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5 text-muted">
                <i class="bi bi-heart fs-1 d-block mb-3 opacity-25"></i>
                <p>Your wishlist is empty.</p>
                <button class="btn btn-primary rounded-pill px-4 fw-bold" onclick="showPage('home-page')">Browse Products</button>
            </div>`;
        return;
    }

    grid.innerHTML = wishlistProducts.map(p => {
        const discount = Math.round((1 - p.price / p.old) * 100);
        return `
            <div class="col-11 col-sm-6 col-md-4">
                <div class="product-card shadow-sm">
                    <div class="product-img-box" onclick="showPage('detail-page', ${p.id})" style="cursor:pointer;">
                        <span class="product-badge">${p.badge}</span>
                        <img src="images/${p.prefix}1.jpeg" alt="${p.title}" loading="lazy">
                        <button class="wishlist-btn active" data-pid="${p.id}"
                                onclick="event.stopPropagation(); toggleWishlist(${p.id}, this); renderWishlistPage()">
                            <i class="bi bi-heart-fill"></i>
                        </button>
                    </div>
                    <div class="p-3 text-center" onclick="showPage('detail-page', ${p.id})" style="cursor:pointer;">
                        <h5 class="fw-bold mb-1 small">${p.title}</h5>
                        <div class="product-stars mb-1">${starHtml(p.rating)}</div>
                        <div class="mb-3">
                            <span class="text-primary fw-bold fs-5">₹${p.price}</span>
                            <small class="text-muted text-decoration-line-through ms-2">₹${p.old}</small>
                            <span class="ms-1 badge bg-success-subtle text-success" style="font-size:0.65rem;">${discount}% OFF</span>
                        </div>
                        <button class="btn btn-primary w-100 rounded-pill small fw-bold">View Details →</button>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// ============================================================
// DISCOUNT CODES
// ============================================================

window.toggleDiscountSection = () => {
    const area = document.getElementById('discount-input-area');
    const chevron = document.getElementById('discount-chevron');
    if (!area) return;
    const visible = area.style.display !== 'none';
    area.style.display = visible ? 'none' : 'block';
    if (chevron) chevron.className = visible ? 'bi bi-chevron-down' : 'bi bi-chevron-up';
};

window.applyDiscount = () => {
    const input = document.getElementById('discount-code');
    const resultEl = document.getElementById('discount-result');
    if (!input || !resultEl) return;

    const code = input.value.trim().toUpperCase();
    const disc = DISCOUNT_CODES[code];

    if (!disc) {
        resultEl.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle me-1"></i>Invalid code. Try ZENITH10, WELCOME20, or PAWS15</span>`;
        appliedDiscount = null;
        populateCheckoutSummary();
        return;
    }

    appliedDiscount = { code, ...disc };
    resultEl.innerHTML = `<span class="text-success fw-bold"><i class="bi bi-check-circle-fill me-1"></i>Code applied! ${disc.label}</span>`;
    showToast(`Discount code applied — ${disc.label}! 🎉`);
    populateCheckoutSummary();
};

function calculateDiscountedTotal(subtotal) {
    if (!appliedDiscount) return subtotal;
    if (appliedDiscount.type === 'percent') return Math.max(0, subtotal - Math.round(subtotal * appliedDiscount.value / 100));
    return Math.max(0, subtotal - appliedDiscount.value);
}

function populateCheckoutSummary() {
    const summaryEl = document.getElementById('checkout-summary-items');
    const totalEl = document.getElementById('checkout-total-display');
    if (!summaryEl) return;

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const finalTotal = calculateDiscountedTotal(subtotal);
    const saving = subtotal - finalTotal;

    let html = cart.map(i =>
        `<div class="d-flex justify-content-between mb-1">
            <span>${i.title} × ${i.qty}</span>
            <span class="fw-bold">₹${i.price * i.qty}</span>
         </div>`
    ).join('');

    if (appliedDiscount) {
        html += `<div class="d-flex justify-content-between mb-1 text-success fw-bold">
            <span><i class="bi bi-tag-fill me-1"></i>Discount (${appliedDiscount.code})</span>
            <span>−₹${saving}</span>
         </div>`;
    }

    summaryEl.innerHTML = html;
    if (totalEl) totalEl.textContent = `₹${finalTotal}`;
}

// ============================================================
// 10. CHECKOUT  (single authoritative definition)
// ============================================================

window.handleFinalOrder = (event) => {
    event.preventDefault();

    if (cart.length === 0) {
        showToast('Your bag is empty!', 'danger');
        return;
    }

    const name    = document.getElementById('custName').value.trim();
    const phone   = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const total    = calculateDiscountedTotal(subtotal);
    const discountLine = appliedDiscount ? `\n*Discount (${appliedDiscount.code}):* −₹${subtotal - total}` : '';

    // Build WhatsApp URL BEFORE any async work so the browser allows window.open
    const msgText =
        `*NEW ORDER — ZENITHTAIL* 🐾\n` +
        `*Name:* ${name}\n` +
        `*Phone:* +91${phone}\n` +
        `*Address:* ${address}\n\n` +
        `*Items:*\n` +
        cart.map(i => `• ${i.title} ×${i.qty} — ₹${i.price * i.qty}`).join('\n') +
        discountLine +
        `\n\n*Total: ₹${total}*`;

    window.open(`https://api.whatsapp.com/send?phone=919341784664&text=${encodeURIComponent(msgText)}`, '_blank');

    showSpinner();

    try {
        const orderData = {
            userId: currentUser ? currentUser.uid : 'guest',
            customerName: name,
            customerPhone: phone,
            deliveryAddress: address,
            items: cart.map(i => ({ id: i.id, title: i.title, price: i.price, qty: i.qty })),
            subtotal: subtotal,
            total: total,
            totalDisplay: `₹${total}`,
            discount: appliedDiscount ? { code: appliedDiscount.code, saving: subtotal - total } : null,
            date: new Date().toISOString(),
            status: 'Processing'
        };

        saveOrderLocal(orderData);

        // Clear cart & form
        cart = [];
        saveCartLocal();
        updateCartDisplay(false);
        document.getElementById('custName').value = '';
        document.getElementById('custPhone').value = '';
        document.getElementById('custAddress').value = '';

        showPage('thankyou-page');
    } catch (err) {
        console.error('Order error:', err);
        showToast('Something went wrong. Please try again.', 'danger');
    } finally {
        hideSpinner();
    }
};

// ============================================================
// 11. LOCAL DATA SYNC (localStorage — no backend needed)
// ============================================================

// ============================================================
// 12. AUTH  (localStorage-based — no backend, 100% free)
// ============================================================

window.loginWithGoogle = () => {
    // Toggle the Google name form
    const form = document.getElementById('google-login-form');
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
};

window.completeGoogleLogin = () => {
    const nameEl  = document.getElementById('google-name');
    const emailEl = document.getElementById('google-email');
    const name  = nameEl?.value.trim();
    const email = emailEl?.value.trim();
    if (!name) { showToast('Please enter your name', 'warning'); return; }

    const uid = 'local_' + (email || name).replace(/\W/g, '').toLowerCase() + '_' + Date.now().toString(36);
    const user = {
        uid,
        displayName: name,
        email: email || '',
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DEAD6F&color=fff&size=64`
    };
    saveUserLocal(user);
    loadCartLocal();
    updateCartDisplay(false);
    applyAuthUI(user);
    showPage('home-page');
    showToast(`Welcome, ${name}! 🐾`);
};

window.login = () => {
    const email = document.getElementById('email').value.trim();
    const pass  = document.getElementById('password').value.trim();
    if (!email || !pass) { showToast('Enter email and password', 'warning'); return; }

    // Check stored accounts
    const accounts = lsGet('zenith_accounts', {});
    if (!accounts[email] || accounts[email].pass !== btoa(pass)) {
        showToast('Email or password incorrect', 'danger');
        return;
    }
    const u = accounts[email];
    const user = { uid: u.uid, displayName: u.name, email, photoURL: u.photoURL };
    saveUserLocal(user);
    loadCartLocal();
    updateCartDisplay(false);
    applyAuthUI(user);
    showPage('home-page');
    showToast(`Welcome back, ${u.name}! 🐾`);
};

window.signup = () => {
    const email = document.getElementById('email').value.trim();
    const pass  = document.getElementById('password').value.trim();
    if (!email || !pass) { showToast('Enter email and password', 'warning'); return; }
    if (pass.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }

    const accounts = lsGet('zenith_accounts', {});
    if (accounts[email]) { showToast('An account with this email already exists', 'warning'); return; }

    const uid = 'local_' + email.replace(/\W/g, '') + '_' + Date.now().toString(36);
    const name = email.split('@')[0];
    const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DEAD6F&color=fff&size=64`;
    accounts[email] = { uid, name, pass: btoa(pass), photoURL };
    lsSet('zenith_accounts', accounts);

    const user = { uid, displayName: name, email, photoURL };
    saveUserLocal(user);
    applyAuthUI(user);
    showPage('home-page');
    showToast('Account created! Welcome 🐾');
};

window.logout = () => {
    cart = [];
    saveCartLocal();
    updateCartDisplay(false);
    clearUserLocal();
    applyAuthUI(null);
    showPage('home-page');
    showToast('Logged out. See you soon! 🐾');
};

function applyAuthUI(user) {
    const loginBtn    = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile');
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userProfile) {
            userProfile.style.display = 'block';
            const pic = document.getElementById('user-pic');
            if (pic) pic.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName||'U')}&background=DEAD6F&color=fff`;
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
    }
}

// ============================================================
// 13. ACCOUNT DASHBOARD
// ============================================================

async function showAccountDashboard() {
    if (!currentUser) {
        showPage('login-page');
        return;
    }

    document.getElementById('dash-user-pic').src = currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.displayName || 'User') + '&background=DEAD6F&color=fff';
    document.getElementById('dash-user-name').textContent = currentUser.displayName || 'Pet Parent';
    document.getElementById('dash-user-email').textContent = currentUser.email;

    const dashCart = document.getElementById('dash-cart-summary');
    if (dashCart) {
        dashCart.innerHTML = cart.length === 0
            ? `<p class="text-muted small mb-0">Your bag is empty.</p>`
            : cart.map(i => `<div class="small mb-1">• ${i.title} ×${i.qty} — <span class="text-primary fw-bold">₹${i.price * i.qty}</span></div>`).join('') +
              `<div class="fw-bold small mt-2 text-primary">Total: ₹${cart.reduce((s, i) => s + i.price * i.qty, 0)}</div>`;
    }

    await loadUserOrders();
}

async function loadUserOrders() {
    if (!currentUser) return;
    const container = document.getElementById('orders-container');
    if (!container) return;

    try {
        const allOrders = loadOrdersLocal();
        const myOrders  = allOrders.filter(o => o.userId === currentUser.uid);

        let totalSpent = 0;
        let orderCount = myOrders.length;

        if (myOrders.length === 0) {
            container.innerHTML = `<p class="text-muted small">No orders yet — go shop! 🐾</p>`;
        } else {
            container.innerHTML = myOrders.map(o => {
                const dateStr = o.date ? new Date(o.date).toLocaleDateString('en-IN') : 'N/A';
                const amount = typeof o.total === 'number' ? o.total : 0;
                totalSpent += amount;
                const status = o.status || 'Processing';
                const statusColors = { Processing: 'warning', Confirmed: 'primary', Shipped: 'info', Delivered: 'success' };
                const statusClass = statusColors[status] || 'secondary';
                return `
                    <div class="p-3 border rounded-3 mb-3">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <div>
                                <span class="fw-bold small">Order #${(o.id||'').slice(0, 6).toUpperCase()}</span>
                                <span class="text-muted small ms-2">${dateStr}</span>
                            </div>
                            <span class="badge bg-${statusClass}-subtle text-${statusClass} rounded-pill px-2">${status}</span>
                        </div>
                        <div class="small text-muted">${o.items?.map(i => `${i.title} ×${i.qty}`).join(', ')}</div>
                        <div class="fw-bold text-primary small mt-1">₹${amount.toLocaleString('en-IN')}</div>
                        ${o.discount ? `<div class="text-success small">Discount applied: ${o.discount.code} (−₹${o.discount.saving})</div>` : ''}
                    </div>`;
            }).join('');

            // Update spending stats
            const countEl = document.getElementById('dash-order-count');
            const spentEl = document.getElementById('dash-total-spent');
            const loyaltyEl = document.getElementById('dash-loyalty-badge');
            if (countEl) countEl.textContent = orderCount;
            if (spentEl) spentEl.textContent = `₹${totalSpent.toLocaleString('en-IN')}`;
            if (loyaltyEl) {
                const tier = totalSpent >= 2000 ? { label: '🥇 Gold Member', cls: 'loyalty-gold' }
                           : totalSpent >= 1000 ? { label: '🥈 Silver Member', cls: 'loyalty-silver' }
                           : { label: '🥉 Bronze Member', cls: 'loyalty-bronze' };
                loyaltyEl.innerHTML = `<span class="loyalty-tier-badge ${tier.cls}">${tier.label}</span>`;
            }
        }
    } catch (e) {
        console.error('Orders load error:', e);
        container.innerHTML = `<p class="text-muted small">Could not load orders.</p>`;
    }
}

// ============================================================
// 14. ADMIN PANEL
// ============================================================

window.accessAdmin = () => {
    const code = prompt('Enter admin code:');
    if (code === '2580') {
        showPage('admin-page');
    } else if (code !== null) {
        showToast('Incorrect code. Access denied.', 'danger');
    }
};

// Chart instances
const adminCharts = {};

function destroyChart(key) {
    if (adminCharts[key]) {
        adminCharts[key].destroy();
        delete adminCharts[key];
    }
}

function loadAdminStats() {
    const listEl = document.getElementById('admin-order-list');
    if (listEl) listEl.innerHTML = `<div class="text-muted py-3 text-center"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading analytics…</div>`;

    allAdminOrders = loadOrdersLocal();
    computeAndRenderAdminStats(allAdminOrders);
}

function computeAndRenderAdminStats(orders) {
    const now = new Date();
    const todayStr = now.toDateString();
    const weekAgo = new Date(now - 7 * 86400000);

    let totalRevenue = 0, weekRevenue = 0, todayOrders = 0;
    const productUnits = {}, productRevenue = {}, statusCounts = {}, customerMap = {};
    const revenueByDay = {};

    // Seed last 30 days
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now - i * 86400000);
        revenueByDay[d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })] = 0;
    }

    orders.forEach(o => {
        const amount = typeof o.total === 'number' ? o.total : parseInt((o.totalDisplay || o.total || '').replace(/[^0-9]/g, '')) || 0;
        const date = o.date ? new Date(o.date) : new Date(0);
        const dateKey = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

        totalRevenue += amount;
        if (date >= weekAgo) weekRevenue += amount;
        if (date.toDateString() === todayStr) todayOrders++;
        if (revenueByDay.hasOwnProperty(dateKey)) revenueByDay[dateKey] += amount;

        const status = o.status || 'Processing';
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        (o.items || []).forEach(item => {
            productUnits[item.title] = (productUnits[item.title] || 0) + (item.qty || 1);
            productRevenue[item.title] = (productRevenue[item.title] || 0) + item.price * (item.qty || 1);
        });

        const uid = o.userId || o.customerPhone || 'guest';
        if (!customerMap[uid]) customerMap[uid] = { name: o.customerName, phone: o.customerPhone, orders: 0, spent: 0 };
        customerMap[uid].orders++;
        customerMap[uid].spent += amount;
    });

    const totalOrders = orders.length;
    const uniqueCustomers = Object.keys(customerMap).length;
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const repeatCustomers = Object.values(customerMap).filter(c => c.orders > 1).length;
    const repeatRate = uniqueCustomers > 0 ? Math.round(repeatCustomers / uniqueCustomers * 100) : 0;

    // Update KPI cards
    document.getElementById('admin-total-orders').textContent = totalOrders;
    document.getElementById('admin-revenue').textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
    document.getElementById('admin-aov').textContent = `₹${aov.toLocaleString('en-IN')}`;
    document.getElementById('admin-customers').textContent = uniqueCustomers;
    document.getElementById('admin-orders-today').textContent = `${todayOrders} today`;
    document.getElementById('admin-revenue-week').textContent = `₹${weekRevenue.toLocaleString('en-IN')} this week`;
    document.getElementById('admin-repeat-rate').textContent = `${repeatRate}% repeat`;

    // Render charts
    renderRevenueChart(revenueByDay);
    renderStatusChart(statusCounts);
    renderAdminChart(productUnits);
    renderRevenueByProductChart(productRevenue);

    // Render orders table
    renderAdminOrderList(orders);

    // Render customer overview
    renderCustomerList(customerMap);
}

function renderRevenueChart(revenueByDay) {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;
    destroyChart('revenue');

    const labels = Object.keys(revenueByDay);
    const data = Object.values(revenueByDay);

    adminCharts.revenue = new window.Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Revenue (₹)',
                data,
                borderColor: '#DEAD6F',
                backgroundColor: 'rgba(222,173,111,0.12)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#DEAD6F',
                borderWidth: 2
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { callback: v => `₹${v}` } },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } }
            }
        }
    });
}

function renderStatusChart(statusCounts) {
    const canvas = document.getElementById('statusChart');
    if (!canvas) return;
    destroyChart('status');

    const labels = Object.keys(statusCounts);
    const colorMap = { Processing: '#ff9800', Confirmed: '#2196f3', Shipped: '#9c27b0', Delivered: '#4caf50' };

    adminCharts.status = new window.Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: labels.map(l => colorMap[l] || '#aaa'),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } }
            },
            cutout: '60%'
        }
    });
}

function renderAdminChart(data) {
    const canvas = document.getElementById('adminChart');
    if (!canvas) return;
    destroyChart('units');

    const shortLabels = Object.keys(data).map(l => l.length > 18 ? l.slice(0, 16) + '…' : l);

    adminCharts.units = new window.Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: shortLabels,
            datasets: [{
                label: 'Units Sold',
                data: Object.values(data),
                backgroundColor: '#DEAD6F',
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { stepSize: 1 } },
                y: { grid: { display: false } }
            }
        }
    });
}

function renderRevenueByProductChart(data) {
    const canvas = document.getElementById('revenueByProductChart');
    if (!canvas) return;
    destroyChart('revProduct');

    const shortLabels = Object.keys(data).map(l => l.length > 18 ? l.slice(0, 16) + '…' : l);
    const colors = ['#DEAD6F', '#5b8dee', '#43b08c', '#e05252', '#9c6bd6'];

    adminCharts.revProduct = new window.Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: shortLabels,
            datasets: [{
                label: 'Revenue (₹)',
                data: Object.values(data),
                backgroundColor: colors,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { callback: v => `₹${v}` } },
                y: { grid: { display: false } }
            }
        }
    });
}

function getStatusBadgeHtml(status) {
    const map = {
        Processing: 'bg-warning-subtle text-warning',
        Confirmed:  'bg-primary-subtle text-primary',
        Shipped:    'bg-purple-subtle text-purple',
        Delivered:  'bg-success-subtle text-success'
    };
    return `<span class="order-status-badge ${map[status] || 'bg-secondary-subtle text-secondary'}">${status || 'Processing'}</span>`;
}

function renderAdminOrderList(orders) {
    const listEl = document.getElementById('admin-order-list');
    if (!listEl) return;

    if (orders.length === 0) {
        listEl.innerHTML = `<p class="text-muted small py-3 text-center">No orders yet.</p>`;
        return;
    }

    listEl.innerHTML = `
        <table class="admin-orders-table w-100">
            <thead>
                <tr>
                    <th>Order ID</th><th>Customer</th><th>Items</th>
                    <th>Total</th><th>Date</th><th>Status</th><th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(o => {
                    const dateStr = o.date ? new Date(o.date).toLocaleDateString('en-IN') : '—';
                    const amount = typeof o.total === 'number' ? `₹${o.total}` : (o.totalDisplay || o.total || '—');
                    const status = o.status || 'Processing';
                    const nextStatuses = { Processing: ['Confirmed', 'Delivered'], Confirmed: ['Shipped', 'Delivered'], Shipped: ['Delivered'] };
                    const actions = (nextStatuses[status] || []).map(s =>
                        `<button class="btn btn-xs admin-status-btn" onclick="updateOrderStatus('${o.id}', '${s}')">${s}</button>`
                    ).join('');
                    return `
                        <tr>
                            <td class="fw-bold text-muted" style="font-size:0.72rem;">#${o.id.slice(0,6).toUpperCase()}</td>
                            <td>
                                <div class="fw-bold">${o.customerName || 'Guest'}</div>
                                <div class="text-muted" style="font-size:0.72rem;">+91 ${o.customerPhone || ''}</div>
                            </td>
                            <td style="font-size:0.75rem;">${(o.items || []).map(i => `${i.title.split(' ').slice(0,2).join(' ')} ×${i.qty}`).join('<br>')}</td>
                            <td class="fw-bold text-primary">${amount}</td>
                            <td class="text-muted" style="font-size:0.75rem;">${dateStr}</td>
                            <td>${getStatusBadgeHtml(status)}</td>
                            <td>${actions || '<span class="text-muted" style="font-size:0.72rem;">Done</span>'}</td>
                        </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

function renderCustomerList(customerMap) {
    const el = document.getElementById('admin-customer-list');
    if (!el) return;

    const customers = Object.values(customerMap).sort((a, b) => b.spent - a.spent);

    if (customers.length === 0) {
        el.innerHTML = `<p class="text-muted small">No customers yet.</p>`;
        return;
    }

    el.innerHTML = `
        <table class="admin-orders-table w-100">
            <thead>
                <tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Tier</th></tr>
            </thead>
            <tbody>
                ${customers.map(c => {
                    const tier = c.spent >= 2000 ? '🥇 Gold' : c.spent >= 1000 ? '🥈 Silver' : '🥉 Bronze';
                    return `<tr>
                        <td class="fw-bold">${c.name || 'Guest'}</td>
                        <td class="text-muted" style="font-size:0.75rem;">${c.phone ? '+91 ' + c.phone : '—'}</td>
                        <td>${c.orders}</td>
                        <td class="fw-bold text-primary">₹${c.spent.toLocaleString('en-IN')}</td>
                        <td>${tier}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

window.filterAdminOrders = () => {
    const statusFilter = document.getElementById('admin-status-filter')?.value || 'all';
    const searchText = (document.getElementById('admin-search-input')?.value || '').toLowerCase();

    let filtered = allAdminOrders;
    if (statusFilter !== 'all') filtered = filtered.filter(o => (o.status || 'Processing') === statusFilter);
    if (searchText) filtered = filtered.filter(o =>
        (o.customerName || '').toLowerCase().includes(searchText) ||
        (o.customerPhone || '').includes(searchText)
    );

    renderAdminOrderList(filtered);
};

window.updateOrderStatus = (orderId, newStatus) => {
    try {
        const orders = lsGet('zenith_orders', []);
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            lsSet('zenith_orders', orders);
        }
        showToast(`Order marked as ${newStatus} ✓`);
        const cached = allAdminOrders.find(o => o.id === orderId);
        if (cached) cached.status = newStatus;
        filterAdminOrders();
    } catch (e) {
        console.error('Status update error:', e);
        showToast('Could not update status.', 'danger');
    }
};

// ============================================================
// 15. GRAND SLAM OFFER — Bundle + Countdown
// ============================================================

window.addBundleToCart = () => {
    // Add both grooming brushes (id 1 and id 2) as the Starter Pack
    [1, 2].forEach(pid => {
        const item = products.find(p => p.id === pid);
        if (!item) return;
        const existing = cart.find(c => c.cartKey === String(pid));
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ id: item.id, cartKey: String(pid), title: item.title, price: item.price, prefix: item.prefix, qty: 1 });
        }
    });
    updateCartDisplay();
    showToast('Complete Grooming Pack added to bag! 🐾');
    bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('cartMenu')).show();
};

function startOfferCountdown() {
    const key = 'zenith_offer_end';
    let end = parseInt(localStorage.getItem(key) || '0');
    if (!end || end < Date.now()) {
        end = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem(key, end);
    }
    function tick() {
        const el = document.getElementById('offer-timer');
        if (!el) return;
        const diff = end - Date.now();
        if (diff <= 0) { el.textContent = '00:00:00'; return; }
        const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        el.textContent = `${h}:${m}:${s}`;
    }
    tick();
    setInterval(tick, 1000);
}

// ============================================================
// 15. PET PERSONALITY QUIZ
// ============================================================

const quizQuestions = [
    {
        q: "What type of pet do you have?",
        emoji: "🐾",
        options: [
            { label: "Dog",   emoji: "🐶", val: "dog" },
            { label: "Cat",   emoji: "🐱", val: "cat" },
            { label: "Both!", emoji: "🐾", val: "both" }
        ]
    },
    {
        q: "How old is your furry friend?",
        emoji: "🎂",
        options: [
            { label: "Puppy / Kitten", emoji: "🐣", val: "puppy",  sub: "Under 2 years" },
            { label: "Young Adult",    emoji: "🦴", val: "young",  sub: "2–5 years" },
            { label: "Senior",         emoji: "🎓", val: "senior", sub: "5+ years" }
        ]
    },
    {
        q: "How's their coat?",
        emoji: "✨",
        options: [
            { label: "Short & Smooth", emoji: "💨", val: "short" },
            { label: "Long & Fluffy",  emoji: "🌊", val: "long" },
            { label: "Dense & Thick",  emoji: "🌿", val: "thick", sub: "Like Labrador / Husky" }
        ]
    },
    {
        q: "Does your pet pull on the leash?",
        emoji: "🦮",
        options: [
            { label: "Yes, always!",  emoji: "😤", val: "always" },
            { label: "Sometimes",     emoji: "😅", val: "sometimes" },
            { label: "Nope, angel!", emoji: "😇", val: "never" }
        ]
    },
    {
        q: "What's most important to you?",
        emoji: "💫",
        options: [
            { label: "Better Grooming",  emoji: "🛁", val: "grooming", sub: "Clean coat & less shedding" },
            { label: "Leash Control",    emoji: "🦮", val: "control",  sub: "No more pulling" },
            { label: "Both equally!",    emoji: "✨", val: "both" }
        ]
    }
];

let quizAnswers = [];
let quizStep = 0;

window.openQuiz = () => {
    quizAnswers = [];
    quizStep = 0;
    const modalEl = document.getElementById('petQuizModal');
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
    renderQuizStep();
};

function renderQuizStep() {
    const q = quizQuestions[quizStep];
    const progress = (quizStep / quizQuestions.length) * 100;

    document.getElementById('quiz-progress-fill').style.width = progress + '%';
    document.getElementById('quiz-step-text').textContent = `Question ${quizStep + 1} of ${quizQuestions.length}`;

    document.getElementById('quiz-body').innerHTML = `
        <span class="quiz-question-emoji">${q.emoji}</span>
        <h4 class="quiz-question-text">${q.q}</h4>
        <div class="quiz-options">
            ${q.options.map(opt => `
                <button class="quiz-option-btn" onclick="selectQuizAnswer('${opt.val}', this)">
                    <span class="quiz-opt-emoji">${opt.emoji}</span>
                    <div>
                        <span class="quiz-opt-label">${opt.label}</span>
                        ${opt.sub ? `<span class="quiz-opt-sub">${opt.sub}</span>` : ''}
                    </div>
                </button>
            `).join('')}
        </div>
    `;
}

window.selectQuizAnswer = (val, btn) => {
    document.querySelectorAll('.quiz-option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    quizAnswers.push(val);
    quizStep++;
    setTimeout(() => {
        if (quizStep >= quizQuestions.length) showQuizResult();
        else renderQuizStep();
    }, 380);
};

function showQuizResult() {
    // Score grooming vs harness
    let g = 0, h = 0;
    const coat = quizAnswers[2];    // 'short' | 'long' | 'thick'
    const pull = quizAnswers[3];    // 'always' | 'sometimes' | 'never'
    const priority = quizAnswers[4]; // 'grooming' | 'control' | 'both'

    if (quizAnswers[0] === 'cat') g += 2; else { g += 1; h += 1; }
    if (coat === 'long' || coat === 'thick') g += 2;
    if (pull === 'always') h += 3; else if (pull === 'sometimes') h += 1;
    if (priority === 'grooming') g += 3;
    else if (priority === 'control') h += 3;
    else { g += 1; h += 1; }

    let pid, personalMsg;
    if (h > g) {
        pid = 3;
        personalMsg = pull === 'always'
            ? "Since your dog pulls hard, the front-clip ZenithControl Harness will transform your walks. No more sore arms or sore neck for your pup!"
            : "The ZenithControl Harness gives you calm, in-control walks. Your dog will love the padded chest comfort too.";
    } else if (coat === 'thick') {
        pid = 2;
        personalMsg = "For a dense, thick coat like your pet's, the Pro-Clean Brush with deep steel pins is the perfect match — reaches the undercoat, then one click ejects all the fur!";
    } else {
        pid = 1;
        personalMsg = coat === 'long'
            ? "For long, fluffy coats, the Zenith-Mist 3-in-1 Brush is ideal — the conditioning mist detangles while you brush, making grooming 3× faster!"
            : "The Zenith-Mist 3-in-1 Brush keeps your pet's coat shiny and tangle-free. The ultra-quiet motor means even nervous pets stay calm.";
    }

    const p = products.find(pr => pr.id === pid);
    const discount = Math.round((1 - p.price / p.old) * 100);

    document.getElementById('quiz-progress-fill').style.width = '100%';
    document.getElementById('quiz-step-text').textContent = 'Your Perfect Match! 🎉';

    document.getElementById('quiz-body').innerHTML = `
        <div class="quiz-result">
            <span class="quiz-result-tag">✨ Personalised just for your pet</span>
            <img src="images/${p.prefix}1.jpeg" alt="${p.title}" class="quiz-result-img">
            <div class="quiz-result-name">${p.title}</div>
            <div class="quiz-result-price">
                <span class="text-primary fw-bold fs-5">₹${p.price}</span>
                <span class="text-muted text-decoration-line-through ms-2">₹${p.old}</span>
                <span class="badge bg-success ms-2">${discount}% OFF</span>
            </div>
            <div class="mb-2">${starHtml(p.rating, '0.95rem')} <span class="small text-muted ms-1">(${p.reviewCount} reviews)</span></div>
            <p class="quiz-result-msg">${personalMsg}</p>
            <div class="d-flex gap-2 justify-content-center flex-wrap">
                <button class="btn btn-primary fw-bold rounded-pill px-4" onclick="quizAddToCart(${pid})">
                    <i class="bi bi-bag-plus me-1"></i> Add to Bag
                </button>
                <button class="btn btn-outline-dark rounded-pill px-4" onclick="quizViewProduct(${pid})">
                    View Product
                </button>
            </div>
            <div class="text-center mt-3">
                <button class="btn btn-link text-muted small p-0" onclick="retakeQuiz()">↩ Retake Quiz</button>
            </div>
        </div>
    `;
}

window.quizAddToCart = (pid) => {
    addToCart(pid);
    bootstrap.Modal.getInstance(document.getElementById('petQuizModal')).hide();
};

window.quizViewProduct = (pid) => {
    bootstrap.Modal.getInstance(document.getElementById('petQuizModal')).hide();
    showPage('detail-page', pid);
};

window.retakeQuiz = () => {
    quizAnswers = [];
    quizStep = 0;
    renderQuizStep();
};

// ============================================================
// 16. AUTH STATE INIT (from localStorage on page load)
// ============================================================

function initAuthState() {
    const savedUser = lsGet('zenith_user', null);
    if (savedUser) {
        currentUser = savedUser;
        loadCartLocal();
        applyAuthUI(savedUser);
        updateCartDisplay(false);
    } else {
        applyAuthUI(null);
    }
}

// ============================================================
// 16. INITIALISE ON DOM READY
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Hero swiper
    new Swiper('.hero-swiper', {
        loop: true,
        autoplay: { delay: 4000, disableOnInteraction: false },
        pagination: { el: '.hero-swiper .swiper-pagination', clickable: true },
        effect: 'fade',
        fadeEffect: { crossFade: true }
    });

    initAuthState();
    renderGrid();
    updateWishlistNavCount();
    startOfferCountdown();
});
