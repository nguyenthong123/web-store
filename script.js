// PHIÊN BẢN SCRIPT.JS SẠCH - ĐÃ SỬA LỖI CÚ PHÁP VÀ DỌN DẸP

document.addEventListener('DOMContentLoaded', () => {

    // --- HÀM KHỞI TẠO CHÍNH ---
    async function initializeApp() {
        // Chạy các hàm không phụ thuộc vào dữ liệu tải về trước
        setupApplicationTabs();
        
        // Tải dữ liệu sản phẩm
        await fetchProducts();

        // Sau khi có dữ liệu, chạy các hàm còn lại
        renderPopularProducts();
        createGlobalPriceSelector();
        updateCartDisplay();
        updateNotificationBadge();
        setupEventListeners();
    }

    // --- CÁC HÀM LOGIC ---
    
    // Hàm này sẽ được gọi sau khi header đã được chèn vào bởi main.js
    function setupEventListeners() {
        const notificationIcon = document.getElementById('notification-icon');
        const closeCartButton = document.getElementById('close-cart-button');
        const logoutButton = document.querySelector('.logout-item a');
        const searchInput = document.querySelector('.search-bar-new input');
        const shippingInput = document.getElementById('shipping-input');

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
        if (shippingInput) {
            shippingInput.addEventListener('input', () => {
                let value = shippingInput.value.replace(/\./g, '');
                if (!isNaN(value) && value.length > 0) {
                    shippingInput.value = parseInt(value, 10).toLocaleString('vi-VN');
                }
                updateTotals();
            });
        }
        
        // Khởi tạo Swiper sau khi mọi thứ đã sẵn sàng
        if (typeof Swiper !== 'undefined') {
            new Swiper('.hero-swiper', {
                loop: true,
                autoplay: { delay: 3000, disableOnInteraction: false },
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            });
        } else {
             console.error('Thư viện Swiper chưa được tải.');
        }

        // Cập nhật thông tin user trên dropdown
        updateProfileDropdown();
    }

    // --- KHAI BÁO BIẾN VÀ CÁC HÀM CÒN LẠI ---

    let allProductsData = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const QUANTITY_STEP = 0.5;
    const MINIMUM_QUANTITY = 0.5;

    const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser'));
    const formatVND = (amount) => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) return 'Liên hệ';
        return numericAmount.toLocaleString('vi-VN') + ' đ';
    };
    const saveCart = () => localStorage.setItem('cart', JSON.stringify(cart));
    
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

    function updateProfileDropdown() {
        const currentUser = getCurrentUser();
        const dropdownUserName = document.getElementById('dropdown-user-name');
        const dropdownUserEmail = document.getElementById('dropdown-user-email');
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
                        reportLi.innerHTML = `<a href="report.html"><i class="ri-file-list-3-line"></i> Báo cáo</a>`;
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

    async function fetchProducts() {
        const popularProductsGrid = document.getElementById('popular-products-grid');
        try {
            const response = await fetch('./gia_web_dura.json');
            if (!response.ok) throw new Error('Network response was not ok');
            allProductsData = await response.json();
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm:', error);
            if (popularProductsGrid) popularProductsGrid.innerHTML = '<p>Lỗi tải dữ liệu sản phẩm.</p>';
        }
    }

    function renderPopularProducts(productsToRender = allProductsData) {
        const popularProductsGrid = document.getElementById('popular-products-grid');
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
            if (userType === 'nhà máy tôn' || userType === 'cửa hàng') { priceHtml = `<div class="price">${formatVND(product["giá niêm yết"])}</div>`; } 
            else if (userType === 'thầu thợ') { priceHtml = `<div class="price">${formatVND(product["Giá Thầu Thợ"])}</div>`; } 
            else { priceHtml = `<div class="price">${formatVND(product["Giá chủ nhà"])}</div>`; }
            productCard.innerHTML = `<a href="product/index.html?id=${groupId}" class="product-link"><img src="${product["image sản phẩm"]}" alt="${product["Tên sản phẩm"]}" loading="lazy"></a><h4>${product["Tên sản phẩm"]}</h4><div class="size">Kích thước: ${product["kích thước"]}</div>${priceHtml}<button class="add-to-cart-btn" data-product-id="${uniqueProductId}">Thêm vào giỏ</button>`;
            popularProductsGrid.appendChild(productCard);
        });
        document.querySelectorAll('.add-to-cart-btn').forEach(button => button.addEventListener('click', handleAddToCartClick));
    }
    
    function createGlobalPriceSelector() {
        const globalPriceSelectorContainer = document.getElementById('global-price-selector-container');
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
                optionsHtml += `<option value="${key}">${key.replace(' Tháng 10"', '')}</option>`;
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
        if (price == null) {
            alert('Sản phẩm cần báo giá riêng.'); return;
        }
        const productForCart = { id: productToAdd["id_san_pham"], name: productToAdd["Tên sản phẩm"], image: productToAdd["image sản phẩm"], size: productToAdd["kích thước"], price: parseInt(price, 10) };
        addToCart(productForCart);
    }
    
    function addToCart(product) {
        const item = cart.find(i => i.id === product.id);
        const step = product.name.toLowerCase().includes('vis') ? QUANTITY_STEP : 1;
        if (item) {
            item.quantity = Math.round((item.quantity + step) * 10) / 10;
        } else {
            const qty = product.name.toLowerCase().includes('vis') ? MINIMUM_QUANTITY : 1;
            cart.push({ ...product, quantity: qty });
        }
        saveCart();
        updateCartDisplay();
        updateNotificationBadge();
    }
    
    function updateQuantity(productId, change) {
        const item = cart.find(i => i.id === productId);
        if (item) {
            const step = item.name.toLowerCase().includes('vis') ? QUANTITY_STEP : 1;
            const min = item.name.toLowerCase().includes('vis') ? MINIMUM_QUANTITY : 1;
            let newQty = item.quantity + (change * step);
            newQty = Math.round(newQty * 10) / 10;
            if (newQty < min) {
                cart = cart.filter(ci => ci.id !== productId);
            } else {
                item.quantity = newQty;
            }
        }
        saveCart();
        updateCartDisplay();
        updateNotificationBadge();
    }

    function updateCartDisplay() {
        const cartItemsContainer = document.getElementById('cart-items-container');
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-message">Giỏ hàng trống.</div>';
        } else {
            cart.forEach(i => {
                const el = document.createElement('div');
                el.className = 'cart-item';
                el.dataset.productId = i.id;
                el.innerHTML = `<div class="product-info"><img src="${i.image}" alt="${i.name}"><div class="item-details"><h5>${i.name}</h5><div class="size">Size: ${i.size}</div><div class="price">${formatVND(i.price)}</div></div></div><div class="quantity-controls"><button class="minus-btn">-</button><span class="quantity">${i.quantity}</span><button class="plus-btn">+</button></div>`;
                cartItemsContainer.appendChild(el);
            });
            cartItemsContainer.querySelectorAll('.minus-btn').forEach(b => b.addEventListener('click', e => updateQuantity(e.target.closest('.cart-item').dataset.productId, -1)));
            cartItemsContainer.querySelectorAll('.plus-btn').forEach(b => b.addEventListener('click', e => updateQuantity(e.target.closest('.cart-item').dataset.productId, 1)));
        }
        updateTotals();
    }

    function updateTotals() {
        const cartSubtotalElement = document.getElementById('cart-subtotal');
        const cartTotalElement = document.getElementById('cart-total');
        const shippingInput = document.getElementById('shipping-input');
        const sub = cart.reduce((s, i) => s + i.price * i.quantity, 0);
        let ship = 0;
        if (shippingInput) ship = parseFloat(shippingInput.value.replace(/\./g, '')) || 0;
        const total = sub + ship;
        if (cartSubtotalElement) cartSubtotalElement.textContent = formatVND(sub);
        if (cartTotalElement) cartTotalElement.textContent = formatVND(total);
    }
    
    function updateNotificationBadge() {
        const cartNotificationBadge = document.getElementById('cart-notification-badge');
        const total = Math.ceil(cart.reduce((s, i) => s + i.quantity, 0));
        if (cartNotificationBadge) {
            cartNotificationBadge.textContent = total;
            cartNotificationBadge.style.display = total > 0 ? 'block' : 'none';
        }
    }

    function toggleCart(show) {
        const cartSidebar = document.getElementById('cart-sidebar');
        const body = document.body;
        if (show) {
            if (cartSidebar) cartSidebar.classList.add('visible');
            if (body) body.classList.add('cart-open');
        } else {
            if (cartSidebar) cartSidebar.classList.remove('visible');
            if (body) body.classList.remove('cart-open');
        }
    }

    function searchProducts(searchTerm) {
        const popularProductsGrid = document.getElementById('popular-products-grid');
        const norm = searchTerm.toLowerCase().trim();
        if (!norm) {
            renderPopularProducts(allProductsData);
            return;
        }
        const filtered = allProductsData.filter(p => p["Tên sản phẩm"].toLowerCase().includes(norm) || (p["kích thước"] && p["kích thước"].toLowerCase().includes(norm)));
        renderPopularProducts(filtered);
    }

    // Chạy ứng dụng
    initializeApp();
});
