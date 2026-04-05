// ============================================================
// ZENITHTAIL — script.js
// ============================================================

// 1. MODULE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore, doc, setDoc, getDoc, addDoc,
    collection, query, where, getDocs, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. FIREBASE CONFIG & INIT
const firebaseConfig = {
    apiKey: "AIzaSyAPIBH3ZyKjsth-Nk1qbHS6UNR5CVxV79k",
    authDomain: "zenithtail.firebaseapp.com",
    projectId: "zenithtail",
    storageBucket: "zenithtail.firebasestorage.app",
    messagingSenderId: "293020299978",
    appId: "1:293020299978:web:a8a32c67c9839452a0ba33",
    measurementId: "G-1NJ1CS271N"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 3. APP STATE
let currentUser = null;
let cart = [];
let activeCategory = 'all';
let detailSwiper = null;
let currentDetailQty = 1;
let selectedSize = null;

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
    const pages = ['home-page', 'login-page', 'detail-page', 'checkout-page', 'thankyou-page', 'account-page', 'admin-page'];
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
    if (pageId === 'checkout-page') populateCheckoutSummary();
    if (pageId === 'admin-page') loadAdminStats();

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

function renderGrid() {
    const grid = document.getElementById('main-grid');
    if (!grid) return;

    const filtered = activeCategory === 'all'
        ? products
        : products.filter(p => p.category === activeCategory);

    grid.innerHTML = filtered.length === 0
        ? `<p class="text-center text-muted py-5">No products in this category yet.</p>`
        : filtered.map(p => {
            const discount = Math.round((1 - p.price / p.old) * 100);
            return `
            <div class="col-11 col-sm-6 col-md-4">
                <div class="product-card shadow-sm" onclick="showPage('detail-page', ${p.id})">
                    <div class="product-img-box">
                        <span class="product-badge">${p.badge}</span>
                        <img src="images/${p.prefix}1.jpeg" alt="${p.title}" loading="lazy"
                             onerror="this.src='https://via.placeholder.com/400x400?text=ZenithTail'">
                        <span class="sold-badge">${p.sold.toLocaleString('en-IN')} sold</span>
                    </div>
                    <div class="p-3 text-center">
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
                        <button class="btn btn-primary w-100 rounded-pill small fw-bold">View Details →</button>
                    </div>
                </div>
            </div>`;
        }).join('');
}

window.filterProducts = (category) => {
    activeCategory = category;

    // Update pill styles
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.toggle('active', pill.id === `pill-${category}`);
    });

    renderGrid();

    // Scroll to shop section
    const section = document.getElementById('shop-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    if (shouldSync) syncCartToFirebase();
}

function populateCheckoutSummary() {
    const summaryEl = document.getElementById('checkout-summary-items');
    const totalEl = document.getElementById('checkout-total-display');
    if (!summaryEl) return;

    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    summaryEl.innerHTML = cart.map(i =>
        `<div class="d-flex justify-content-between mb-1">
            <span>${i.title} × ${i.qty}</span>
            <span class="fw-bold">₹${i.price * i.qty}</span>
         </div>`
    ).join('');

    if (totalEl) totalEl.textContent = `₹${total}`;
}

// ============================================================
// 10. CHECKOUT  (single authoritative definition)
// ============================================================

window.handleFinalOrder = async (event) => {
    event.preventDefault();

    if (cart.length === 0) {
        showToast('Your bag is empty!', 'danger');
        return;
    }

    const name    = document.getElementById('custName').value.trim();
    const phone   = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const total   = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    // Build WhatsApp URL BEFORE any async work so the browser allows window.open
    const msgText =
        `*NEW ORDER — ZENITHTAIL* 🐾\n` +
        `*Name:* ${name}\n` +
        `*Phone:* +91${phone}\n` +
        `*Address:* ${address}\n\n` +
        `*Items:*\n` +
        cart.map(i => `• ${i.title} ×${i.qty} — ₹${i.price * i.qty}`).join('\n') +
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
            total: `₹${total}`,
            date: new Date(),
            status: 'Processing'
        };

        await addDoc(collection(db, 'orders'), orderData);

        // Clear cart & form
        cart = [];
        updateCartDisplay(false);
        document.getElementById('custName').value = '';
        document.getElementById('custPhone').value = '';
        document.getElementById('custAddress').value = '';

        // Clear saved cart in Firebase
        if (currentUser) {
            await setDoc(doc(db, 'users', currentUser.uid), { activeCart: [] }, { merge: true });
        }

        showPage('thankyou-page');
    } catch (err) {
        console.error('Order error:', err);
        showToast('Could not save order. Please check your connection.', 'danger');
    } finally {
        hideSpinner();
    }
};

// ============================================================
// 11. FIREBASE DATA SYNC
// ============================================================

async function syncCartToFirebase() {
    if (!currentUser) return;
    try {
        await setDoc(doc(db, 'users', currentUser.uid), { activeCart: cart }, { merge: true });
    } catch (e) {
        console.error('Cart sync error:', e);
    }
}

async function loadSavedCart() {
    if (!currentUser) return;
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().activeCart?.length) {
            cart = userDoc.data().activeCart;
            updateCartDisplay(false);
        }
    } catch (e) {
        console.error('Cart load error:', e);
    }
}

async function loadUserOrders() {
    if (!currentUser) return;
    const container = document.getElementById('orders-container');
    if (!container) return;

    try {
        const q = query(
            collection(db, 'orders'),
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc')
        );
        const snap = await getDocs(q);

        container.innerHTML = snap.empty
            ? `<p class="text-muted small">No orders yet — go shop! 🐾</p>`
            : snap.docs.map(d => {
                const o = d.data();
                const dateStr = o.date?.toDate ? o.date.toDate().toLocaleDateString('en-IN') : 'N/A';
                return `
                    <div class="p-3 border rounded-3 mb-3">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <div>
                                <span class="fw-bold small">Order #${d.id.slice(0, 6).toUpperCase()}</span>
                                <span class="text-muted small ms-2">${dateStr}</span>
                            </div>
                            <span class="order-badge bg-warning-subtle text-warning">${o.status || 'Processing'}</span>
                        </div>
                        <div class="small text-muted">${o.items?.map(i => `${i.title} ×${i.qty}`).join(', ')}</div>
                        <div class="fw-bold text-primary small mt-1">${o.total}</div>
                    </div>`;
            }).join('');
    } catch (e) {
        console.error('Orders load error:', e);
        container.innerHTML = `<p class="text-muted small">Could not load orders.</p>`;
    }
}

// ============================================================
// 12. AUTH
// ============================================================

window.login = () => {
    const email = document.getElementById('email').value;
    const pass  = document.getElementById('password').value;
    showSpinner();
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => showPage('home-page'))
        .catch(err => { showToast(err.message, 'danger'); hideSpinner(); });
};

window.signup = () => {
    const email = document.getElementById('email').value;
    const pass  = document.getElementById('password').value;
    showSpinner();
    createUserWithEmailAndPassword(auth, email, pass)
        .then(() => { showToast('Account created! Welcome 🐾'); showPage('home-page'); })
        .catch(err => { showToast(err.message, 'danger'); hideSpinner(); });
};

window.loginWithGoogle = () => {
    showSpinner();
    signInWithPopup(auth, provider)
        .then(() => showPage('home-page'))
        .catch(err => { showToast(err.message, 'danger'); hideSpinner(); });
};

window.logout = () => {
    signOut(auth).then(() => {
        cart = [];
        updateCartDisplay(false);
        showPage('home-page');
        showToast('Logged out. See you soon! 🐾');
    });
};

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

async function loadAdminStats() {
    const listEl = document.getElementById('admin-order-list');
    if (listEl) listEl.innerHTML = `<div class="text-muted small">Loading...</div>`;

    try {
        const snap = await getDocs(query(collection(db, 'orders'), orderBy('date', 'desc')));

        let totalRevenue = 0;
        const productCounts = {};
        let html = '';

        snap.forEach(d => {
            const o = d.data();
            const amount = parseInt((o.total || '').replace(/[^0-9]/g, '')) || 0;
            totalRevenue += amount;

            (o.items || []).forEach(item => {
                productCounts[item.title] = (productCounts[item.title] || 0) + (item.qty || 1);
            });

            const dateStr = o.date?.toDate ? o.date.toDate().toLocaleDateString('en-IN') : '';
            html += `
                <div class="d-flex justify-content-between align-items-start border-bottom py-2">
                    <div>
                        <span class="fw-bold">${o.customerName || 'Guest'}</span>
                        <span class="text-muted ms-2 small">${o.customerPhone || ''}</span>
                        <div class="text-muted small">${o.deliveryAddress || ''}</div>
                        <div class="text-muted small">${o.items?.map(i => `${i.title} ×${i.qty}`).join(', ')}</div>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold text-primary">${o.total}</div>
                        <small class="text-muted">${dateStr}</small>
                        <div><span class="order-badge bg-warning-subtle text-warning">${o.status || 'Processing'}</span></div>
                    </div>
                </div>`;
        });

        document.getElementById('admin-total-orders').textContent = snap.size;
        document.getElementById('admin-revenue').textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
        if (listEl) listEl.innerHTML = html || `<p class="text-muted small">No orders yet.</p>`;

        renderAdminChart(productCounts);
    } catch (e) {
        console.error('Admin load error:', e);
        if (listEl) listEl.innerHTML = `<p class="text-muted small">Error loading data.</p>`;
    }
}

let myChart = null;
function renderAdminChart(data) {
    const canvas = document.getElementById('adminChart');
    if (!canvas) return;
    if (myChart) myChart.destroy();

    myChart = new window.Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Units Sold',
                data: Object.values(data),
                backgroundColor: '#DEAD6F',
                borderRadius: 10
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { display: false }, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ============================================================
// 15. AUTH STATE LISTENER
// ============================================================

onAuthStateChanged(auth, async (user) => {
    hideSpinner();
    const loginBtn    = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile');

    if (user) {
        currentUser = user;
        loginBtn?.style && (loginBtn.style.display = 'none');
        if (userProfile) {
            userProfile.style.display = 'block';
            document.getElementById('user-pic').src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'U') + '&background=DEAD6F&color=fff';
        }
        await loadSavedCart();
    } else {
        currentUser = null;
        loginBtn?.style && (loginBtn.style.display = 'block');
        if (userProfile) userProfile.style.display = 'none';
        cart = [];
        updateCartDisplay(false);
    }
});

// ============================================================
// 16. INITIALISE ON DOM READY
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Hero swiper
    new Swiper('.hero-swiper', {
        loop: true,
        autoplay: { delay: 4000, disableOnInteraction: false },
        pagination: { el: '.hero-swiper .swiper-pagination', clickable: true },
        navigation: {
            nextEl: '.hero-swiper .swiper-button-next',
            prevEl: '.hero-swiper .swiper-button-prev'
        },
        effect: 'fade',
        fadeEffect: { crossFade: true }
    });

    renderGrid();
});
