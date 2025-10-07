// PHIÊN BẢN SCRIPT.JS HOÀN THIỆN - TƯƠNG THÍCH VỚI HEADER ĐỘNG

// Bọc toàn bộ code trong một hàm lớn để tránh xung đột
function mainApp() {
    // --- DOM Elements ---
    // Di chuyển các khai báo vào trong sau khi DOM đã sẵn sàng
    const popularProductsGrid = document.getElementById('popular-products-grid');
    const shippingInput = document.getElementById('shipping-input');
    const globalPriceSelectorContainer = document.getElementById('global-price-selector-container');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartNotificationBadge = document.getElementById('cart-notification-badge');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    const cartTotalElement = document.getElementById('cart-total');
    const notificationIcon = document.getElementById('notification-icon');
    const closeCartButton = document.getElementById('close-cart-button');
    const body = document.body;
    const searchInput = document.querySelector('.search-bar-new input');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserEmail = document.getElementById('dropdown-user-email');
    const logoutButton = document.querySelector('.logout-item a');

    // --- Data & Config ---
    let allProductsData = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const QUANTITY_STEP = 0.5;
    const MINIMUM_QUANTITY = 0.5;

    // --- Helper Functions ---
    const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser'));
    const formatVND = (amount) => { /* ... */ };
    const saveCart = () => localStorage.setItem('cart', JSON.stringify(cart));
    
    // --- Logic cho các thành phần ---
    function setupApplicationTabs() { /* ... */ }
    function updateProfileDropdown() { /* ... */ }
    async function fetchProducts() { /* ... */ }
    function renderPopularProducts(productsToRender) { /* ... */ }
    function createGlobalPriceSelector() { /* ... */ }
    function updateAllProductPrices(priceKey) { /* ... */ }
    function handleAddToCartClick(event) { /* ... */ }
    function addToCart(product) { /* ... */ }
    function updateQuantity(productId, change) { /* ... */ }
    function updateCartDisplay() { /* ... */ }
    function updateTotals() { /* ... */ }
    function updateNotificationBadge() { /* ... */ }
    function toggleCart(show) { /* ... */ }
    function searchProducts(searchTerm) { /* ... */ }

    // --- Initialization ---
    async function initializeApp() {
        setupApplicationTabs();
        updateProfileDropdown();
        await fetchProducts();
        renderPopularProducts();
        createGlobalPriceSelector();
        updateCartDisplay();
        updateNotificationBadge();

        if (shippingInput) {
            shippingInput.addEventListener('input', () => {
                let value = shippingInput.value.replace(/\./g, '');
                if (!isNaN(value) && value.length > 0) {
                    shippingInput.value = parseInt(value, 10).toLocaleString('vi-VN');
                }
                updateTotals();
            });
        }
    }

    // --- Gắn các Event Listeners chính ---
    if (notificationIcon) notificationIcon.addEventListener('click', () => toggleCart(true));
    if (closeCartButton) closeCartButton.addEventListener('click', () => toggleCart(false));
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            alert('Bạn đã đăng xuất.');
            window.location.reload(); // Tải lại trang để cập nhật giao diện
        });
    }
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => searchProducts(e.target.value), 300);
        });
    }

    // Chạy ứng dụng
    initializeApp();

    // Dán lại toàn bộ các hàm đầy đủ ở đây
    const formatVND = (amount) => { const n = parseFloat(amount); return isNaN(n) ? 'Liên hệ' : n.toLocaleString('vi-VN') + ' đ'; };
    function setupApplicationTabs() { const c = document.querySelector('.app-tabs-container'); if (!c) return; const l = c.querySelectorAll('.app-tab-link'), p = document.querySelectorAll('.app-tab-pane'); l.forEach(link => { link.addEventListener('click', () => { l.forEach(i => i.classList.remove('active')); p.forEach(i => i.classList.remove('active')); link.classList.add('active'); const t = document.getElementById(link.dataset.tab); if (t) t.classList.add('active'); }); }); }
    function updateProfileDropdown() { const u = getCurrentUser(); if (u) { if (dropdownUserName) dropdownUserName.textContent = `Chào, ${u.name}!`; if (dropdownUserEmail) dropdownUserEmail.textContent = u.mail; const t = u.phan_loai.toLowerCase(), r = ['ad mind', 'nhà máy tôn', 'cửa hàng']; if (r.includes(t)) { const m = document.getElementById('profile-dropdown-menu'); if (m) { const d = m.querySelector('.divider'); if (!m.querySelector('.report-link') && d) { const li = document.createElement('li'); li.className = 'report-link'; li.innerHTML = `<a href="report.html"><i class="ri-file-list-3-line"></i> Báo cáo</a>`; d.insertAdjacentElement('afterend', li); } if (!m.querySelector('.dashboard-link')) { const li = document.createElement('li'); li.className = 'dashboard-link'; li.innerHTML = `<a href="dashboard-analytics.html"><i class="ri-bar-chart-2-line"></i> Phân tích</a>`; const rl = m.querySelector('.report-link'); if (rl) rl.insertAdjacentElement('afterend', li); else if (d) d.insertAdjacentElement('afterend', li); } } } } }
    async function fetchProducts() { try { const r = await fetch('./gia_web_dura.json'); if (!r.ok) throw new Error('Network response was not ok'); allProductsData = await r.json(); } catch (e) { console.error('Lỗi tải sản phẩm:', e); if (popularProductsGrid) popularProductsGrid.innerHTML = '<p>Lỗi tải dữ liệu.</p>'; } }
    function renderPopularProducts(productsToRender = allProductsData) { if (!popularProductsGrid) return; popularProductsGrid.innerHTML = ''; if (!productsToRender || productsToRender.length === 0) { popularProductsGrid.innerHTML = '<div class="no-results"><p>Không tìm thấy.</p></div>'; return; } const u = getCurrentUser(); const t = u ? u.phan_loai.toLowerCase() : 'guest'; productsToRender.forEach(p => { const card = document.createElement('div'); card.className = 'product-card'; const uid = p["id_san_pham"], gid = p["group_id"]; card.dataset.productId = uid; let priceHtml = ''; if (t === 'nhà máy tôn' || t === 'cửa hàng') { priceHtml = `<div class="price">${formatVND(p["giá niêm yết"])}</div>`; } else if (t === 'thầu thợ') { priceHtml = `<div class="price">${formatVND(p["Giá Thầu Thợ"])}</div>`; } else { priceHtml = `<div class="price">${formatVND(p["Giá chủ nhà"])}</div>`; } card.innerHTML = `<a href="product/index.html?id=${gid}" class="product-link"><img src="${p["image sản phẩm"]}" alt="${p["Tên sản phẩm"]}"></a><h4>${p["Tên sản phẩm"]}</h4><div class="size">Kích thước: ${p["kích thước"]}</div>${priceHtml}<button class="add-to-cart-btn" data-product-id="${uid}">Thêm vào giỏ</button>`; popularProductsGrid.appendChild(card); }); document.querySelectorAll('.add-to-cart-btn').forEach(b => b.addEventListener('click', handleAddToCartClick)); }
    function createGlobalPriceSelector() { if (!globalPriceSelectorContainer) return; const u = getCurrentUser(); const t = u ? u.phan_loai.toLowerCase() : 'guest'; if ((t === 'nhà máy tôn' || t === 'cửa hàng') && allProductsData.length > 0) { const keys = new Set(['Giá chủ nhà', 'Giá Thầu Thợ', 'giá niêm yết']); allProductsData.forEach(p => { for (const k in p) { if (k.startsWith('gói')) keys.add(k); } }); let opts = ''; keys.forEach(k => { opts += `<option value="${k}">${k.replace(' Tháng 10"', '')}</option>`; }); globalPriceSelectorContainer.innerHTML = `<label for="package-select">Chọn báo giá:</label><select id="package-select">${opts}</select>`; globalPriceSelectorContainer.style.display = 'flex'; const sel = document.getElementById('package-select'); if (sel) sel.addEventListener('change', (e) => updateAllProductPrices(e.target.value)); } }
    function updateAllProductPrices(priceKey) { document.querySelectorAll('.product-card').forEach(c => { const pid = c.dataset.productId; const pData = allProductsData.find(p => p.id_san_pham === pid); const el = c.querySelector('.price'); if (pData && el) el.textContent = formatVND(pData[priceKey]); }); }
    function handleAddToCartClick(event) { const pid = event.target.dataset.productId; const pAdd = allProductsData.find(p => p["id_san_pham"] === pid); if (!pAdd) return; const u = getCurrentUser(); const t = u ? u.phan_loai.toLowerCase() : 'guest'; let pKey = "Giá chủ nhà"; if (t === 'thầu thợ') pKey = "Giá Thầu Thợ"; else if (t === 'nhà máy tôn' || t === 'cửa hàng') { const s = document.getElementById('package-select'); pKey = s ? s.value : 'giá niêm yết'; } const price = pAdd[pKey]; if (price == null) { alert('Sản phẩm cần báo giá riêng.'); return; } const pCart = { id: pAdd["id_san_pham"], name: pAdd["Tên sản phẩm"], image: pAdd["image sản phẩm"], size: pAdd["kích thước"], price: parseInt(price, 10) }; addToCart(pCart); }
    function addToCart(product) { const item = cart.find(i => i.id === product.id); const step = product.name.toLowerCase().includes('vis') ? QUANTITY_STEP : 1; if (item) item.quantity = Math.round((item.quantity + step) * 10) / 10; else { const qty = product.name.toLowerCase().includes('vis') ? MINIMUM_QUANTITY : 1; cart.push({ ...product, quantity: qty }); } saveCart(); updateCartDisplay(); updateNotificationBadge(); }
    function updateQuantity(productId, change) { const item = cart.find(i => i.id === productId); if (item) { const step = item.name.toLowerCase().includes('vis') ? QUANTITY_STEP : 1; const min = item.name.toLowerCase().includes('vis') ? MINIMUM_QUANTITY : 1; let newQty = item.quantity + (change * step); newQty = Math.round(newQty * 10) / 10; if (newQty < min) cart = cart.filter(ci => ci.id !== productId); else item.quantity = newQty; } saveCart(); updateCartDisplay(); updateNotificationBadge(); }
    function updateCartDisplay() { if (!cartItemsContainer) return; cartItemsContainer.innerHTML = ''; if (cart.length === 0) { cartItemsContainer.innerHTML = '<div class="empty-cart-message">Giỏ hàng trống.</div>'; } else { cart.forEach(i => { const el = document.createElement('div'); el.className = 'cart-item'; el.dataset.productId = i.id; el.innerHTML = `<div class="product-info"><img src="${i.image}" alt="${i.name}"><div class="item-details"><h5>${i.name}</h5><div class="size">Size: ${i.size}</div><div class="price">${formatVND(i.price)}</div></div></div><div class="quantity-controls"><button class="minus-btn">-</button><span class="quantity">${i.quantity}</span><button class="plus-btn">+</button></div>`; cartItemsContainer.appendChild(el); }); cartItemsContainer.querySelectorAll('.minus-btn').forEach(b => b.addEventListener('click', e => updateQuantity(e.target.closest('.cart-item').dataset.productId, -1))); cartItemsContainer.querySelectorAll('.plus-btn').forEach(b => b.addEventListener('click', e => updateQuantity(e.target.closest('.cart-item').dataset.productId, 1))); } updateTotals(); }
    function updateTotals() { const sub = cart.reduce((s, i) => s + i.price * i.quantity, 0); let ship = 0; if (shippingInput) ship = parseFloat(shippingInput.value.replace(/\./g, '')) || 0; const total = sub + ship; if (cartSubtotalElement) cartSubtotalElement.textContent = formatVND(sub); if (cartTotalElement) cartTotalElement.textContent = formatVND(total); }
    function updateNotificationBadge() { const total = Math.ceil(cart.reduce((s, i) => s + i.quantity, 0)); if (cartNotificationBadge) { cartNotificationBadge.textContent = total; cartNotificationBadge.style.display = total > 0 ? 'block' : 'none'; } }
    function toggleCart(show) { if (show) { if (cartSidebar) cartSidebar.classList.add('visible'); if (body) body.classList.add('cart-open'); } else { if (cartSidebar) cartSidebar.classList.remove('visible'); if (body) body.classList.remove('cart-open'); } }
    function searchProducts(searchTerm) { const norm = searchTerm.toLowerCase().trim(); if (!norm) { renderPopularProducts(allProductsData); return; } const filtered = allProductsData.filter(p => p["Tên sản phẩm"].toLowerCase().includes(norm) || (p["kích thước"] && p["kích thước"].toLowerCase().includes(norm))); renderPopularProducts(filtered); }
}

// ===============================================================
// === CHẠY APP SAU KHI CẢ TRANG VÀ HEADER ĐÃ ĐƯỢC TẢI ===
// ===============================================================
// Hàm này sẽ đợi cho đến khi một element trong header xuất hiện
function waitForHeaderAndRun(callback) {
    const checkInterval = setInterval(() => {
        // Chúng ta kiểm tra sự tồn tại của #notification-icon
        if (document.getElementById('notification-icon')) {
            clearInterval(checkInterval); // Dừng kiểm tra
            callback(); // Chạy hàm mainApp
        }
    }, 50); // Kiểm tra mỗi 50ms
}

// Thay thế DOMContentLoaded bằng lời gọi hàm mới
waitForHeaderAndRun(mainApp);
