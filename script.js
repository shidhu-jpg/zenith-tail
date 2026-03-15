 const products = [
    { 
        id: 1, prefix: 'q', title: "Zenith-Mist 3-in-1 Brush", price: 499, old: 999, 
        longDesc: "The Zenith-Mist uses nano-atomization technology to release a gentle steam-like mist that softens fur instantly. This eliminates painful pulling and removes 95% more trapped dander." 
    },
    { 
        id: 2, prefix: 'w', title: "One-Click Pro-Clean Brush", price: 299, old: 699, 
        longDesc: "The ZenithTail Pro-Clean features a precision-engineered plate that slides forward with one click, ejecting all the fur directly into the bin." 
    },
    { 
        id: 3, prefix: 'e', title: "ZenithControl Safety Harness", price: 599, old: 1250, 
        longDesc: "Stop the choking and neck strain. Our No-Pull design distributes pressure evenly across the chest. Made with military-grade nylon." 
    }
];

let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    if(document.querySelector('.hero-swiper')) {
        new Swiper(".hero-swiper", { loop: true, autoplay: { delay: 3000 } });
    }
    renderGrid();
});

function renderGrid() {
    const grid = document.getElementById('main-grid');
    if(!grid) return;
    grid.innerHTML = products.map(p => `
        <div class="col-6 col-md-4">
            <div class="product-card" onclick="showPage('detail', ${p.id})">
                <div class="product-img-box"><img src="images/${p.prefix}1.jpeg"></div>
                <div class="p-2 text-center">
                    <h6 class="text-truncate mb-1" style="font-size:0.85rem">${p.title}</h6>
                    <span class="fw-bold small">₹${p.price}</span>
                    <button class="btn btn-primary btn-sm w-100 mt-2" style="font-size:0.75rem">View Detail</button>
                </div>
            </div>
        </div>`).join('');
}

function showPage(pageId, pid = null) {
    const home = document.getElementById('home-page');
    const detail = document.getElementById('detail-page');
    const thankyou = document.getElementById('thankyou-page');

    // Force Reset
    home.style.display = 'none';
    detail.style.display = 'none';
    thankyou.style.display = 'none';

    if (pageId === 'home') {
        home.style.display = 'block';
    } else if (pageId === 'thankyou') {
        thankyou.style.display = 'block';
    } else if (pageId === 'detail') {
        detail.style.display = 'block';
        const p = products.find(i => i.id === pid);
        if(!p) return;

        const slides = [1,2,3,4].map(n => `<div class="swiper-slide"><img src="images/${p.prefix}${n}.jpeg" class="w-100"></div>`).join('');
        
        document.getElementById('detail-content').innerHTML = `
            <div class="col-md-6">
                <div class="swiper detail-swiper border rounded-4 overflow-hidden">
                    <div class="swiper-wrapper">${slides}</div>
                    <div class="swiper-pagination"></div>
                </div>
            </div>
            <div class="col-md-6">
                <h2 class="fw-bold mt-2">${p.title}</h2>
                <h3 class="text-primary mb-3">₹${p.price} <small class="text-muted text-decoration-line-through fs-6">₹${p.old}</small></h3>
                <div class="mb-4 text-muted small">${p.longDesc}</div>
                <div class="d-flex align-items-center gap-3 mb-4 bg-white p-2 rounded-pill border d-inline-flex">
                    <button class="qty-btn" onclick="adjustDetailQty(-1)">-</button>
                    <span id="detail-qty" class="fw-bold px-2">1</span>
                    <button class="qty-btn" onclick="adjustDetailQty(1)">+</button>
                </div>
                <button class="btn btn-primary w-100 py-3 shadow" onclick="addToCart(${p.id})">ADD TO BAG</button>
            </div>`;
        
        new Swiper(".detail-swiper", { pagination: { el: ".swiper-pagination" }, autoplay: { delay: 3000 } });
    }
    window.scrollTo(0,0);
}

function adjustDetailQty(val) {
    const el = document.getElementById('detail-qty');
    let current = parseInt(el.innerText);
    if (current + val >= 1) el.innerText = current + val;
}

function addToCart(pid) {
    const item = products.find(i => i.id === pid);
    const qty = parseInt(document.getElementById('detail-qty').innerText);
    const existing = cart.find(c => c.id === pid);
    if (existing) { existing.qty += qty; } else { cart.push({...item, qty: qty}); }
    updateCartDisplay();
    bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('cartMenu')).show();
}

function updateCartDisplay() {
    document.getElementById('cart-count').innerText = cart.reduce((a, b) => a + b.qty, 0);
    let total = 0;
    const list = document.getElementById('cart-items');
    list.innerHTML = cart.length === 0 ? `<p class="text-center text-muted">Bag is empty</p>` : 
        cart.map((i, idx) => {
            total += i.price * i.qty;
            return `<div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <div style="width: 55%;"><div class="small fw-bold">${i.title}</div><div class="text-primary small">₹${i.price * i.qty}</div></div>
                <div class="d-flex align-items-center gap-2">
                    <button class="qty-btn" onclick="changeCartQty(${idx}, -1)">-</button>
                    <span class="small fw-bold px-1">${i.qty}</span>
                    <button class="qty-btn" onclick="changeCartQty(${idx}, 1)">+</button>
                </div>
            </div>`;
        }).join('');
    document.getElementById('cart-total').innerText = `₹${total}`;
}

function changeCartQty(idx, val) {
    cart[idx].qty += val;
    if (cart[idx].qty < 1) cart.splice(idx, 1);
    updateCartDisplay();
}

function handleCheckout() {
    if (!document.getElementById('cName').value || !document.getElementById('cPhone').value) {
        alert("Please enter Name and Phone.");
        return;
    }
    bootstrap.Offcanvas.getInstance(document.getElementById('cartMenu')).hide();
    cart = [];
    updateCartDisplay();
    showPage('thankyou');
}