 const products = [
    { 
        id: 1, prefix: 'q', title: "Zenith-Mist 3-in-1 Brush", price: 499, old: 999, 
        longDesc: "The Zenith-Mist uses nano-atomization technology to release a gentle steam-like mist that softens fur instantly." 
    },
    { 
        id: 2, prefix: 'w', title: "One-Click Pro-Clean Brush", price: 299, old: 699, 
        longDesc: "Ejects all the fur directly into the bin with a single click. High efficiency grooming." 
    },
    { 
        id: 3, prefix: 'e', title: "ZenithControl Safety Harness", price: 599, old: 1250, 
        longDesc: "Stop the choking and neck strain. Made with military-grade nylon for urban pet parents." 
    }
];

let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. AUTO-MOVING BANNER LOGIC
    if(document.querySelector('.hero-swiper')) {
        new Swiper(".hero-swiper", { 
            loop: true, 
            autoplay: { delay: 3500, disableOnInteraction: false }, 
            pagination: { el: ".swiper-pagination", clickable: true } 
        });
    }
    renderGrid();
});

function renderGrid() {
    const grid = document.getElementById('main-grid');
    if(!grid) return;
    grid.innerHTML = products.map(p => `
        <div class="col-11 col-md-4">
            <div class="product-card shadow-sm" onclick="showPage('detail-page', ${p.id})">
                <div class="product-img-box">
                    <img src="images/${p.prefix}1.jpeg">
                </div>
                <div class="p-3 text-center">
                    <h5 class="fw-bold mb-1">${p.title}</h5>
                    <div class="mb-2">
                        <span class="text-primary fw-bold fs-5">₹${p.price}</span>
                        <small class="text-muted text-decoration-line-through ms-2">₹${p.old}</small>
                    </div>
                    <button class="btn btn-primary w-100 rounded-pill">View Details</button>
                </div>
            </div>
        </div>`).join('');
}

// SINGLE SOURCE OF TRUTH FOR PAGE SWITCHING
function showPage(pageId, pid = null) {
    const pages = ['home-page', 'login-page', 'detail-page', 'checkout-page', 'thankyou-page'];
    
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const target = document.getElementById(pageId);
    if (target) {
        target.style.display = 'block';
    }

    if (pageId === 'detail-page' && pid) {
        renderProductDetails(pid);
    }
    window.scrollTo(0, 0);
}

function renderProductDetails(pid) {
    const p = products.find(i => i.id === pid);
    if(!p) return;

    const slides = [1,2,3,4].map(n => `<div class="swiper-slide"><img src="images/${p.prefix}${n}.jpeg" class="w-100"></div>`).join('');
    
    document.getElementById('detail-content').innerHTML = `
        <div class="col-md-6">
            <div class="swiper detail-swiper border rounded-4 overflow-hidden shadow-sm">
                <div class="swiper-wrapper">${slides}</div>
                <div class="swiper-pagination"></div>
            </div>
        </div>
        <div class="col-md-6">
            <h2 class="fw-bold">${p.title}</h2>
            <h3 class="text-primary mb-3">₹${p.price} <small class="text-muted text-decoration-line-through fs-6">₹${p.old}</small></h3>
            <p class="text-muted">${p.longDesc}</p>
            <div class="d-flex align-items-center gap-3 mb-4 bg-light p-2 rounded-pill d-inline-flex border">
                <button class="btn btn-sm" onclick="adjustDetailQty(-1)">-</button>
                <span id="detail-qty" class="fw-bold px-2">1</span>
                <button class="btn btn-sm" onclick="adjustDetailQty(1)">+</button>
            </div>
            <button class="btn btn-primary w-100 py-3 fw-bold shadow" onclick="addToCart(${p.id})">ADD TO BAG</button>
        </div>`;
    
    new Swiper(".detail-swiper", { 
        pagination: { el: ".swiper-pagination" },
        autoplay: { delay: 3000 }
    });
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
    
    list.innerHTML = cart.length === 0 ? `<p class="text-center text-muted py-5">Your bag is empty</p>` : 
        cart.map((i, idx) => {
            total += i.price * i.qty;
            return `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div style="width: 60%;"><div class="small fw-bold">${i.title}</div><div class="text-primary small">₹${i.price * i.qty}</div></div>
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm border" onclick="changeCartQty(${idx}, -1)">-</button>
                    <span class="small fw-bold">${i.qty}</span>
                    <button class="btn btn-sm border" onclick="changeCartQty(${idx}, 1)">+</button>
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

function goToCheckout() {
    if (cart.length === 0) return alert("Bag is empty!");
    bootstrap.Offcanvas.getInstance(document.getElementById('cartMenu')).hide();
    showPage('checkout-page');
}

function handleFinalOrder(event) {
    event.preventDefault();
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const address = document.getElementById('custAddress').value;
    const total = document.getElementById('cart-total').innerText;
    const itemDetails = cart.map(i => `• ${i.title} (x${i.qty})`).join('%0A');

    const message = `*NEW ORDER - ZENITHTAIL* 🐾%0A--------------------------%0A*Name:* ${name}%0A*Phone:* ${phone}%0A*Address:* ${address}%0A--------------------------%0A*Items:*%0A${itemDetails}%0A--------------------------%0A*Total:* ${total}%0A*Payment:* Cash on Delivery%0A--------------------------`;

    const whatsappURL = `https://api.whatsapp.com/send?phone=919341784664&text=${message}`;
    
    showPage('thankyou-page');
    window.open(whatsappURL, '_blank');
    cart = [];
    updateCartDisplay();
}

// ---------------- FIREBASE AUTH SYSTEM ----------------

function signup(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if(!email || !password){
        alert("Enter email and password");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Account created successfully"))
    .catch(err => alert(err.message));
}

function login(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if(!email || !password){
        alert("Enter email and password");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
    .then(() => {
        alert("Login successful");
        showPage('home-page');
    })
    .catch(err => alert(err.message));
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
    .then((result) => {
        console.log("Logged in:", result.user.displayName);
        alert("Welcome to ZenithTail, " + result.user.displayName + "!");
        showPage('home-page'); 
    })
    .catch((error) => {
        console.error("Login Error:", error.message);
        if (error.code === 'auth/operation-not-allowed') {
            alert("Please enable Google Sign-In in Firebase Console!");
        } else {
            alert("Login failed: " + error.message);
        }
    });
}

// Track login state
auth.onAuthStateChanged(user => {
    if(user){
        console.log("User logged in:", user.uid);
    } else {
        console.log("User logged out");
    }
});