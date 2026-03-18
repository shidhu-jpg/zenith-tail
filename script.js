 // 1. MODULE IMPORTS (Firebase v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
    signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. CONFIGURATION (Ensure these match your Firebase Console)
 // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPIBH3ZyKjsth-Nk1qbHS6UNR5CVxV79k",
  authDomain: "zenithtail.firebaseapp.com",
  projectId: "zenithtail",
  storageBucket: "zenithtail.firebasestorage.app",
  messagingSenderId: "293020299978",
  appId: "1:293020299978:web:a8a32c67c9839452a0ba33",
  measurementId: "G-1NJ1CS271N"
};

// 3. INITIALIZATION
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let cart = [];

const products = [
    { id: 1, prefix: 'q', title: "Zenith-Mist 3-in-1 Brush", price: 499, old: 999, longDesc: "Nano-atomization technology for gentle grooming." },
    { id: 2, prefix: 'w', title: "One-Click Pro-Clean Brush", price: 299, old: 699, longDesc: "Ejects fur with one click. High efficiency." },
    { id: 3, prefix: 'e', title: "ZenithControl Safety Harness", price: 599, old: 1250, longDesc: "No-pull design with military-grade nylon." }
];


 

// --- FIX 1: ADDED THE MISSING RENDER FUNCTION ---
function renderProductDetails(pid) {
    const product = products.find(p => p.id === pid);
    const container = document.getElementById('detail-page'); // Or your detail container ID
    const content = document.getElementById('detail-content'); // Ensure this ID exists in HTML
    
    if (!product || !content) return;

    content.innerHTML = `
        <div class="row g-4">
            <div class="col-md-6">
                <img src="images/${product.prefix}1.jpeg" class="img-fluid rounded-4 shadow-sm">
            </div>
            <div class="col-md-6">
                <h2 class="fw-bold">${product.title}</h2>
                <div class="mb-3">
                    <span class="fs-3 fw-bold text-primary">₹${product.price}</span>
                    <span class="text-decoration-line-through text-muted ms-2">₹${product.old}</span>
                </div>
                <p class="text-muted">${product.longDesc}</p>
                <div class="d-flex align-items-center gap-3 mb-4">
                    <div class="border rounded-pill px-3 py-1">
                        <span id="detail-qty">1</span>
                    </div>
                </div>
                <button class="btn btn-primary btn-lg w-100 rounded-pill shadow" onclick="addToCart(${product.id})">
                    Add to Bag
                </button>
            </div>
        </div>
    `;
}

// ... [Keep Auth and Signup functions] ...

window.showPage = (pageId, pid = null) => {
    const pages = ['home-page', 'login-page', 'detail-page', 'checkout-page', 'thankyou-page', 'account-page', 'admin-page'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById(pageId);
    if (target) target.style.display = 'block';
    
    // This now works because the function exists
    if (pageId === 'detail-page' && pid) renderProductDetails(pid);
    if (pageId === 'account-page') showAccountDashboard();
    if (pageId === 'admin-page') loadAdminStats();
    
    window.scrollTo(0, 0);
};

// --- FIX 2: REPAIRED ORDER STORAGE LOGIC ---
window.handleFinalOrder = async (event) => {
    event.preventDefault();
    const name = document.getElementById('custName').value;
    const total = document.getElementById('cart-total').innerText;
    
    try {
        // Correctly adding a document to the 'orders' collection
        const orderRef = doc(collection(db, "orders")); 
        await setDoc(orderRef, {
            userId: currentUser ? currentUser.uid : "guest",
            customerName: name,
            items: cart,
            total: total,
            date: new Date(),
            status: "Processing"
        });

        const itemDetails = cart.map(i => `• ${i.title} (x${i.qty})`).join('%0A');
        const message = `*NEW ORDER - ZENITHTAIL* 🐾%0A*Name:* ${name}%0A*Items:*%0A${itemDetails}%0A*Total:* ${total}`;
        window.open(`https://api.whatsapp.com/send?phone=919341784664&text=${message}`, '_blank');
        
        window.showPage('thankyou-page');
        cart = [];
        updateCartDisplay();
    } catch (e) {
        console.error("Order Error:", e);
        alert("Could not save order. Please check your connection.");
    }
};

// ... [Keep the rest of your Chart and Dashboard logic] ...






// 4. CORE AUTH & DATA HANDSHAKE
onAuthStateChanged(auth, async (user) => {
    const loginBtn = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile');
    
    if (user) {
        console.log("Verified User:", user.uid);
        currentUser = user;
        if(loginBtn) loginBtn.style.display = 'none';
        if(userProfile) {
            userProfile.style.display = 'block';
            document.getElementById('user-pic').src = user.photoURL || 'images/default-user.png';
        }
        
        // FETCH DATA FROM FIREBASE
        await loadSavedCart();
        await loadUserOrders();
    } else {
        currentUser = null;
        if(loginBtn) loginBtn.style.display = 'block';
        if(userProfile) userProfile.style.display = 'none';
        cart = [];
        updateCartDisplay(false);
    }
});

// 5. GLOBAL WINDOW FUNCTIONS (For HTML Buttons)
window.signup = () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => alert("Account Created!"))
        .catch(err => alert(err.message));
};

window.login = () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password)
        .then(() => { showPage('home-page'); })
        .catch(err => alert(err.message));
};

window.loginWithGoogle = () => {
    signInWithPopup(auth, provider)
        .then(() => { showPage('home-page'); })
        .catch(err => alert(err.message));
};

window.logout = () => {
    signOut(auth).then(() => {
        showPage('home-page');
        location.reload(); // Refresh to clear private data
    });
};

// 6. UI & PAGE LOGIC
document.addEventListener('DOMContentLoaded', () => {
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
                <div class="product-img-box"><img src="images/${p.prefix}1.jpeg"></div>
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

window.showPage = (pageId, pid = null) => {
    const pages = ['home-page', 'login-page', 'detail-page', 'checkout-page', 'thankyou-page', 'account-page'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById(pageId);
    if (target) target.style.display = 'block';
    
    if (pageId === 'detail-page' && pid) renderProductDetails(pid);
    if (pageId === 'account-page') showAccountDashboard();
    
    window.scrollTo(0, 0);
};

// 7. CART & ORDER LOGIC
window.addToCart = (pid) => {
    const item = products.find(i => i.id === pid);
    const qty = parseInt(document.getElementById('detail-qty')?.innerText || 1);
    const existing = cart.find(c => c.id === pid);
    if (existing) { existing.qty += qty; } else { cart.push({...item, qty: qty}); }
    updateCartDisplay();
    bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('cartMenu')).show();
};

function updateCartDisplay(shouldSync = true) {
    const countEl = document.getElementById('cart-count');
    if(countEl) countEl.innerText = cart.reduce((a, b) => a + b.qty, 0);
    
    let total = 0;
    const list = document.getElementById('cart-items');
    if(!list) return;
    
    list.innerHTML = cart.length === 0 ? `<p class="text-center text-muted py-5">Your bag is empty</p>` : 
        cart.map((i, idx) => {
            total += i.price * i.qty;
            return `<div class="d-flex justify-content-between align-items-center mb-3">
                <div style="width: 60%;"><div class="small fw-bold">${i.title}</div><div class="text-primary small">₹${i.price * i.qty}</div></div>
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm border" onclick="changeCartQty(${idx}, -1)">-</button>
                    <span class="small fw-bold">${i.qty}</span>
                    <button class="btn btn-sm border" onclick="changeCartQty(${idx}, 1)">+</button>
                </div>
            </div>`;
        }).join('');
    
    const totalEl = document.getElementById('cart-total');
    if(totalEl) totalEl.innerText = `₹${total}`;
    
    if (shouldSync) syncCartToFirebase();
}

window.changeCartQty = (idx, val) => {
    cart[idx].qty += val;
    if (cart[idx].qty < 1) cart.splice(idx, 1);
    updateCartDisplay();
};

// 8. FIREBASE DATA SYNC & DASHBOARD
async function syncCartToFirebase() {
    if (!currentUser) return;
    try {
        await setDoc(doc(db, "users", currentUser.uid), { activeCart: cart }, { merge: true });
    } catch (e) { console.error("Sync Error:", e); }
}

async function loadSavedCart() {
    if (!currentUser) return;
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists() && userDoc.data().activeCart) {
        cart = userDoc.data().activeCart;
        updateCartDisplay(false); 
    }
}

async function loadUserOrders() {
    if (!currentUser) return;
    const q = query(collection(db, "orders"), where("userId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    const container = document.getElementById('orders-container');
    if (!container) return;

    container.innerHTML = querySnapshot.empty ? "<p class='small text-muted'>No orders yet.</p>" : 
        querySnapshot.docs.map(doc => {
            const d = doc.data();
            return `<div class="p-2 border-bottom small d-flex justify-content-between align-items-center">
                <div>
                    <b>Order #${doc.id.slice(0,5)}</b> - ${d.total}<br>
                    <span class="text-muted">${d.items.map(i => i.title).join(", ")}</span>
                </div>
                <span class="badge bg-light text-dark border">${d.status || 'Sent'}</span>
            </div>`;
        }).join('');
}

// THE DASHBOARD HANDLER
async function showAccountDashboard() {
    if (!currentUser) {
        showPage('login-page');
        return;
    }
    
    // Update Profile UI
    document.getElementById('dash-user-pic').src = currentUser.photoURL || 'images/default-user.png';
    document.getElementById('dash-user-name').innerText = currentUser.displayName || 'Pet Parent';
    document.getElementById('dash-user-email').innerText = currentUser.email;

    // Show saved cart summary in dashboard
    const dashCart = document.getElementById('dash-cart-summary');
    if (dashCart) {
        dashCart.innerHTML = cart.length === 0 ? "<p class='text-muted small'>No items saved.</p>" : 
            cart.map(i => `<div class="small mb-1">• ${i.title} (x${i.qty})</div>`).join('');
    }

    await loadUserOrders(); // Refresh orders list
}

window.handleFinalOrder = async (event) => {
    event.preventDefault();
    const name = document.getElementById('custName').value;
    const total = document.getElementById('cart-total').innerText;
    
    if (currentUser) {
        await setDoc(doc(collection(db, "orders")), {
            userId: currentUser.uid,
            customerName: name,
            items: cart,
            total: total,
            date: new Date(),
            status: "Processing"
        });
    }

    const itemDetails = cart.map(i => `• ${i.title} (x${i.qty})`).join('%0A');
    const message = `*NEW ORDER - ZENITHTAIL* 🐾%0A*Name:* ${name}%0A*Items:*%0A${itemDetails}%0A*Total:* ${total}`;
    window.open(`https://api.whatsapp.com/send?phone=919341784664&text=${message}`, '_blank');
    
    showPage('thankyou-page');
    cart = [];
    updateCartDisplay();
};

// 1. Secret Code Logic
window.checkAdminCode = (val) => {
    if(val === "2580") {
        document.getElementById('admin-code').value = ""; // Clear it
        showPage('admin-page');
        loadAdminStats();
    }
}

// 2. Data Visualization Logic
async function loadAdminStats() {
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    
    let totalRevenue = 0;
    let orderCount = querySnapshot.size;
    let productCounts = {}; // For the chart

    const listContainer = document.getElementById('admin-order-list');
    listContainer.innerHTML = "";

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Calculate Revenue (Removing '₹' symbol to parse number)
        const price = parseInt(data.total.replace(/[^0-9]/g, '')) || 0;
        totalRevenue += price;

        // Count products for Chart
        data.items.forEach(item => {
            productCounts[item.title] = (productCounts[item.title] || 0) + item.qty;
        });

        // Add to live stream
        listContainer.innerHTML += `
            <div class="d-flex justify-content-between border-bottom py-2">
                <span>${data.customerName}</span>
                <span class="fw-bold">${data.total}</span>
            </div>`;
    });

    // Update Text Stats
    document.getElementById('admin-total-orders').innerText = orderCount;
    document.getElementById('admin-revenue').innerText = `₹${totalRevenue}`;

    // Render the Chart
    renderAdminChart(productCounts);
}

let myChart = null; // Store chart instance to prevent duplicates
function renderAdminChart(data) {
    const ctx = document.getElementById('adminChart').getContext('2d');
    
    if(myChart) myChart.destroy(); // Clear old chart

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Units Sold',
                data: Object.values(data),
                backgroundColor: '#0d6efd',
                borderRadius: 10
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { display: false } } }
        }
    });
}



  // --- ADMIN ACCESS LOGIC ---
window.accessAdmin = () => {
    console.log("Admin trigger clicked"); // This helps you check if it's working
    
    const code = prompt("Enter Secret Admin Access Code:");

    if (code === "2580") {
        // We use window.showPage to ensure it calls the global version
        if (typeof window.showPage === "function") {
            window.showPage('admin-page');
            
            // This loads the Firebase data for the charts/stats
            if (typeof loadAdminStats === "function") {
                loadAdminStats();
            }
        } else {
            console.error("showPage function not found!");
        }
    } else if (code !== null) {
        alert("Incorrect Code. Access Denied.");
    }
};

// Also ensure showPage is global
window.showPage = (pageId, pid = null) => {
    const pages = ['home-page', 'login-page', 'detail-page', 'checkout-page', 'thankyou-page', 'account-page', 'admin-page'];
    
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const target = document.getElementById(pageId);
    if (target) target.style.display = 'block';
    
    // Logic for product details
    if (pageId === 'detail-page' && pid) {
        if (typeof renderProductDetails === "function") {
            renderProductDetails(pid);
        }
    }
    
    window.scrollTo(0, 0);
};