// PHIÊN BẢN SCRIPT.JS SẠCH - ĐÃ XÓA TẤT CẢ CÁC HÀM BỊ LẶP

function mainApp() {
    // --- DOM Elements ---
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
    const formatVND = (amount) => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) return 'Liên hệ';
        return numericAmount.toLocaleString('vi-VN') + ' đ';
    };
    const saveCart = () => localStorage.setItem('cart', JSON.stringify(cart));
    
    // --- Application Tabs Logic ---
    function setupApplicationTabs() {
        const tabContainer = document.querySelector('.app-tabs-container');
        if (!tabContainer) return;
        const tabLinks = tabContainer.querySelectorAll('.app-tab-link');
        const tabPanes = document.querySelectorAll('.app-tab-pane');
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                tabLinks.forEach(item => item.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                link.classList.add('active');
                const targetPane = document.getElementById(link.dataset.tab);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }

    // --- Dynamic Dropdown Menu Logic ---
    function updateProfileDropdown() {
        const currentUser = getCurrentUser();
        if (currentUser) {
            if (dropdownUserName) dropdownUserName.textContent = `Chào, ${currentUser.name}!`;
            if (dropdownUserEmail) dropdownUserEmail.textContent = currentUser.mail;
            const userType = currentUser.phan_loai.toLowerCase();
            const allowedRoles = ['ad mind', 'nhà máy tôn', 'cửa hàng'];
            if (allowedRoles.includes(userType)) {
                const dropdownMenuUl = document.getElementById('profile-dropdown-menu');
                if (dropdownMenuUl) {
                    const divider = dropdownMenuUl.querySelector('.divider');
                    if (!dropdownMenuUl.querySelector('.report-link') && divider) {
                        const reportLi = document.createElement('li');
                        reportLi.classList.add('report-link');
                        reportLi.innerHTML = `<a href="report.html"><i class="ri-file-list-3-line"></i> Báo cáo Đơn hàng</a>`;
                        divider.insertAdjacentElement('afterend', reportLi);
                    }
                    if (!dropdownMenuUl.querySelector('.dashboard-link')) {
                        const dashboardLi = document.createElement('li');
                        dashboardLi.classList.add('dashboard-link');
                        dashboardLi.innerHTML = `<a href="dashboard-analytics.html"><i class="ri-bar-chart-2-line"></i> Phân tích</a>`;
                        const reportLink = dropdownMenuUl.querySelector('.report-link');
                        if (reportLink) reportLink.insertAdjacentElement('afterend', dashboardLi);
                        else if (divider) divider.insertAdjacentElement('afterend', dashboardLi);
                    }
                }
            }
        }
    }

    // --- Core Functions ---
    async function fetchProducts() {
        try {
            const response = await fetch('./gia_web_dura.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allProductsData = await response.json();
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm:', error);
            if(popularProductsGrid) popularProductsGrid.innerHTML = '<p>Lỗi tải dữ liệu sản phẩm.</p>';
        }
    }

    function renderPopularProducts(productsToRender = allProductsData) {
        if (!popularProductsGrid) return;
        popularProductsGrid.innerHTML = '';
        if (!productsToRender || productsToRender.length === 0) {
            popularProductsGrid.innerHTML = '<div class="no-results"><p>Không tìm thấy sản phẩm.</p></div>';
            return;
        }
        const currentUser = getCurrentUser();
        const userType = currentUser ? currentUser.phan_loai.toLowerCase() : 'guest';
        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            const uniqueProductId = product["id_san_pham"];
            const groupId = product["group_id"];
            productCard.dataset.productId = uniqueProductId;
            
            let priceHtml = '';
            if (userType === 'nhà máy tôn' || userType === 'cửa hàng') {
                priceHtml = `<div class="price">${formatVND(product["giá niêm yết"])}</div>`;
            } else if (userType === 'thầu thợ') {
                priceHtml = `<div class="price">${formatVND(product["Giá Thầu Thợ"])}</div>`;
            } else {
                priceHtml = `<div class="price">${formatVND(product["Giá chủ nhà"])}</div>`;
            }

            productCard.innerHTML = `
                <a href="product/index.html?id=${groupId}" class="product-link">
                    <img src="${product["image sản phẩm"]}" alt="${product["Tên sản phẩm"]}" loading="lazy">
                </a>
                <h4>${product["Tên sản phẩm"]}</h4>
                <div class="size">Kích thước: ${product["kích thước"]}</div>
                ${priceHtml}
                <button class="add-to-cart-btn" data-product-id="${uniqueProductId}">Thêm vào giỏ</button>
            `;
            popularProductsGrid.appendChild(productCard);
        });
        document.querySelectorAll('.add-to-cart-btn').forEach(button => button.addEventListener('click', handleAddToCartClick));
    }
    
    function createGlobalPriceSelector() {
        if (!globalPriceSelectorContainer) return;
        const currentUser = getCurrentUser();
        const userType = currentUser ? currentUser.phan_loai.toLowerCase() : 'guest';
        if ((userType === 'nhà máy tôn' || userType === 'cửa hàng') && allProductsData.length > 0) {
            const priceKeys = new Set(['Giá chủ nhà', 'Giá Thầu Thợ', 'giá niêm yết']);
            allProductsData.forEach(product => {
                for (const key in product) { if (key.startsWith('gói')) { priceKeys.add(key); } }
            });
            let optionsHtml = '';
            priceKeys.forEach(key => {
                const cleanKey = key.replace(' Tháng 10"', '');
                optionsHtml += `<option value="${key}">${cleanKey}</option>`;
            });
            globalPriceSelectorContainer.innerHTML = `<label for="package-select">Chọn báo giá:</label><select id="package-select">${optionsHtml}</select>`;
            globalPriceSelectorContainer.style.display = 'flex';
            const packageSelect = document.getElementById('package-select');
            if (packageSelect) {
                packageSelect.addEventListener('change', (event) => updateAllProductPrices(event.target.value));
            }
        }
    }
    
    function updateAllProductPrices(priceKey) {
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = card.dataset.productId;
            const productData = allProductsData.find(p => p.id_san_pham === productId);
            const priceElement = card.querySelector('.price');
            if (productData && priceElement) {
                priceElement.textContent = formatVND(productData[priceKey]);
            }
        });
    }

    function handleAddToCartClick(event) {
        const productId = event.target.dataset.productId;
        const productToAdd = allProductsData.find(p => p["id_san_pham"] === productId);
        if (!productToAdd) return;
        const currentUser = getCurrentUser();
        const userType = currentUser ? currentUser.phan_loai.toLowerCase() : 'guest';
        let priceKey = "Giá chủ nhà";
        if (userType === 'thầu thợ') { priceKey = "Giá Thầu Thợ"; } 
        else if (userType === 'nhà máy tôn' || userType === 'cửa hàng') {
            const select = document.getElementById('package-select');
            priceKey = select ? select.value : 'giá niêm yết';
        }
        const price = productToAdd[priceKey];
        if (price === undefined || price === null) {
            alert('Sản phẩm cần báo giá riêng.'); return;
        }
        const productForCart = { id: productToAdd["id_san_pham"], name: productToAdd["Tên sản phẩm"], image: productToAdd["image sản phẩm"], size: productToAdd["kích thước"], price: parseInt(price, 10) };
        addToCart(productForCart);
    }
    
    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        const step = product.name.toLowerCase().includes('vis') ? QUANTITY_STEP : 1;
        if (existingItem) {
            existingItem.quantity = Math.round((existingItem.quantity + step) * 10) / 10;
        } else {
            const initialQuantity = product.name.toLowerCase().includes('vis') ? MINIMUM_QUANTITY : 1;
            cart.push({ ...product, quantity: initialQuantity });
        }
        saveCart();
        updateCartDisplay();
        updateNotificationBadge();
    }
    
    function updateQuantity(productId, change) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            const step = item.name.toLowerCase().includes('vis') ? QUANTITY_STEP : 1;
            const minQty = item.name.toLowerCase().includes('vis') ? MINIMUM_QUANTITY : 1;
            let newQuantity = item.quantity + (change * step);
            newQuantity = Math.round(newQuantity * 10) / 10;
            if (newQuantity < minQty) {
                cart = cart.filter(cartItem => cartItem.id !== productId);
            } else {
                item.quantity = newQuantity;
            }
        }
        saveCart();
        updateCartDisplay();
        updateNotificationBadge();
    }

    function updateCartDisplay() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty.</div>';
        } else {
            cart.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.classList.add('cart-item');
                cartItemElement.dataset.productId = item.id;
                cartItemElement.innerHTML = `<div class="product-info"><img src="${item.image}" alt="${item.name}"><div class="item-details"><h5>${item.name}</h5><div class="size">Size: ${item.size}</div><div class="price">${formatVND(item.price)}</div></div></div><div class="quantity-controls"><button class="minus-btn">-</button><span class="quantity">${item.quantity}</span><button class="plus-btn">+</button></div>`;
                cartItemsContainer.appendChild(cartItemElement);
            });
            cartItemsContainer.querySelectorAll('.minus-btn').forEach(btn => btn.addEventListener('click', e => updateQuantity(e.target.closest('.cart-item').dataset.productId, -1)));
            cartItemsContainer.querySelectorAll('.plus-btn').forEach(btn => btn.addEventListener('click', e => updateQuantity(e.target.closest('.cart-item').dataset.productId, 1)));
        }
        updateTotals();
    }

    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let shipping = 0;
        if (shippingInput) {
            shipping = parseFloat(shippingInput.value.replace(/\./g, '')) || 0;
        }
        const total = subtotal + shipping;
        if (cartSubtotalElement) cartSubtotalElement.textContent = formatVND(subtotal);
        if (cartTotalElement) cartTotalElement.textContent = formatVND(total);
    }
    
    function updateNotificationBadge() {
        const totalItems = Math.ceil(cart.reduce((sum, item) => sum + item.quantity, 0));
        if (cartNotificationBadge) {
            cartNotificationBadge.textContent = totalItems;
            cartNotificationBadge.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }

    function toggleCart(show) {
        if (show) {
            if (cartSidebar) cartSidebar.classList.add('visible');
            if (body) body.classList.add('cart-open');
        } else {
            if (cartSidebar) cartSidebar.classList.remove('visible');
            if (body) body.classList.remove('cart-open');
        }
    }

    function searchProducts(searchTerm) {
        const normalizedSearch = searchTerm.toLowerCase().trim();
        if (!normalizedSearch) {
            renderPopularProducts(allProductsData);
            return;
        }
        const filteredProducts = allProductsData.filter(p => p["Tên sản phẩm"].toLowerCase().includes(normalizedSearch) || (p["kích thước"] && p["kích thước"].toLowerCase().includes(normalizedSearch)));
        renderPopularProducts(filteredProducts);
    }

    // --- Initialization ---
    async function initializeApp() {
        if (typeof Swiper !== 'undefined') {
            new Swiper('.hero-swiper', {
                loop: true,
                autoplay: { delay: 3000, disableOnInteraction: false },
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            });
        }

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

    // --- Event Listeners ---
    if (notificationIcon) notificationIcon.addEventListener('click', () => toggleCart(true));
    if (closeCartButton) closeCartButton.addEventListener('click', () => toggleCart(false));
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            alert('Bạn đã đăng xuất.');
            window.location.reload();
        });
    }
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => searchProducts(e.target.value), 300);
        });
    }

    initializeApp();
});

function waitForHeaderAndRun(callback) {
    const checkInterval = setInterval(() => {
        if (document.getElementById('notification-icon')) {
            clearInterval(checkInterval);
            callback();
        }
    }, 50);
}

waitForHeaderAndRun(() => {
    // Không cần gọi mainApp() vì code đã nằm trong DOMContentLoaded
});
