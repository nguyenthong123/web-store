// NỘI DUNG MỚI HOÀN TOÀN CHO SCRIPT.JS - CẬP NHẬT DROPDOWN GIÁ TOÀN CỤC

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const popularProductsGrid = document.getElementById('popular-products-grid');
    const globalPriceSelectorContainer = document.getElementById('global-price-selector-container');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartNotificationBadge = document.getElementById('cart-notification-badge');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    const cartTotalElement = document.getElementById('cart-total');
    const notificationIcon = document.getElementById('notification-icon');
    const closeCartButton = document.getElementById('close-cart-button');
    const body = document.body;
    const searchInput = document.querySelector('.search-bar input');


    // --- Data ---
    let allProductsData = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // --- Helper Functions ---
    const getCurrentUser = () => {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    };

    const formatVND = (amount) => {
        const numericAmount = parseInt(amount, 10);
        if (isNaN(numericAmount)) return 'Liên hệ';
        return numericAmount.toLocaleString('vi-VN') + ' đ';
    };
    
    const saveCart = () => {
        localStorage.setItem('cart', JSON.stringify(cart));
    };


    // --- Core Functions ---
    async function fetchProducts() {
        try {
            const response = await fetch('./gia_web_dura.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            allProductsData = data;
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm:', error);
        }
    }
    
    function createGlobalPriceSelector() {
        const currentUser = getCurrentUser();
        const userType = currentUser ? currentUser.phan_loai : 'guest';

        if ((userType === 'Nhà Máy Tôn' || userType === 'Cửa Hàng') && allProductsData.length > 0) {
            const priceKeys = new Set();
            
            // =================================================================
            // === THAY ĐỔI Ở ĐÂY: Thêm các tùy chọn giá mới vào dropdown ===
            // =================================================================
            priceKeys.add('Giá chủ nhà');
            priceKeys.add('Giá Thầu Thợ');
            priceKeys.add('giá niêm yết');
            // =================================================================

            // Lấy tất cả các loại gói giá duy nhất từ tất cả sản phẩm
            allProductsData.forEach(product => {
                for (const key in product) {
                    if (key.startsWith('gói')) {
                        priceKeys.add(key);
                    }
                }
            });

            // Tạo dropdown
            let optionsHtml = '';
            priceKeys.forEach(key => {
                const cleanKey = key.replace(/ Tháng \d+"/i, ''); // Làm sạch tên hiển thị
                optionsHtml += `<option value="${key}">${cleanKey}</option>`;
            });

            const selectorHtml = `
                <label for="package-select">Chọn báo giá:</label>
                <select id="package-select">
                    ${optionsHtml}
                </select>
            `;
            
            globalPriceSelectorContainer.innerHTML = selectorHtml;
            globalPriceSelectorContainer.style.display = 'flex';

            // Thêm sự kiện để cập nhật giá khi chọn
            document.getElementById('package-select').addEventListener('change', (event) => {
                const selectedKey = event.target.value;
                updateAllProductPrices(selectedKey);
            });
        }
    }

    function updateAllProductPrices(priceKey) {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const productId = card.dataset.productId;
            const productData = allProductsData.find(p => p.id_san_pham === productId);
            const priceElement = card.querySelector('.price');
            
            if (productData && priceElement) {
                const price = productData[priceKey];
                priceElement.textContent = formatVND(price);
            }
        });
    }

    function renderPopularProducts(productsToRender = allProductsData) {
        if (!popularProductsGrid) return;
        popularProductsGrid.innerHTML = '';

        if (!productsToRender || productsToRender.length === 0) {
            popularProductsGrid.innerHTML = '<div class="no-results"><p>Không tìm thấy sản phẩm.</p></div>';
            return;
        }

        const currentUser = getCurrentUser();
        const userType = currentUser ? currentUser.phan_loai : 'guest';

        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.dataset.productId = product["id_san_pham"];

            let priceHtml = '';
            
            if (userType === 'Nhà Máy Tôn' || userType === 'Cửa Hàng') {
                priceHtml = `<div class="price">${formatVND(product["giá niêm yết"])}</div>`;
            } else if (userType === 'Thầu Thợ') {
                priceHtml = `<div class="price">${formatVND(product["Giá Thầu Thợ"])}</div>`;
            } else {
                priceHtml = `<div class="price">${formatVND(product["Giá chủ nhà"])}</div>`;
            }

            // Lấy ID sản phẩm từ file gia_web_dura.json
const productId = product["id_san_pham"]; 

productCard.innerHTML = `
    // Sửa href ở đây để trỏ đến trang chi tiết với đúng id
    <a href="product/index.html?id=${productId}" class="product-link">
        <img src="${product["image sản phẩm"]}" alt="${product["Tên sản phẩm"]}" loading="lazy">
    </a>
    <h4>${product["Tên sản phẩm"]}</h4>
                <div class="size">Kích thước: ${product["kích thước"]}</div>
                ${priceHtml}
                <button class="add-to-cart-btn" data-product-id="${product["id_san_pham"]}">Thêm vào giỏ</button>
            `;
            popularProductsGrid.appendChild(productCard);
        });

        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', handleAddToCartClick);
        });
    }
    
    function handleAddToCartClick(event) {
        const productId = event.target.dataset.productId;
        const productToAdd = allProductsData.find(p => p["id_san_pham"] === productId);
        if (!productToAdd) return;
        
        const currentUser = getCurrentUser();
        const userType = currentUser ? currentUser.phan_loai : 'guest';

        let priceKey = "Giá chủ nhà"; 
        if (userType === 'Thầu Thợ') {
            priceKey = "Giá Thầu Thợ";
        } else if (userType === 'Nhà Máy Tôn' || userType === 'Cửa Hàng') {
            const select = document.getElementById('package-select');
            const selectedPriceKey = select ? select.value : 'giá niêm yết';
            priceKey = selectedPriceKey;
        }

        const price = productToAdd[priceKey];
        if (price === undefined || price === null) {
            alert('Sản phẩm này cần báo giá riêng. Vui lòng liên hệ.');
            return;
        }
        
        const productForCart = {
            id: productToAdd["id_san_pham"],
            name: productToAdd["Tên sản phẩm"],
            image: productToAdd["image sản phẩm"],
            size: productToAdd["kích thước"],
            price: parseInt(price, 10)
        };
        
        addToCart(productForCart);
    }
    
    // --- Cart Management & Search (Giữ nguyên không đổi) ---
    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart();
        updateCartDisplay();
        updateNotificationBadge();
    }

    function updateQuantity(productId, change) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(cartItem => cartItem.id !== productId);
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
                cartItemElement.innerHTML = `
                    <div class="product-info">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="item-details">
                            <h5>${item.name}</h5>
                            <div class="size">Size: ${item.size}</div>
                            <div class="price">${formatVND(item.price)}</div>
                        </div>
                    </div>
                    <div class="quantity-controls">
                        <button class="minus-btn" aria-label="Giảm số lượng">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="plus-btn" aria-label="Tăng số lượng">+</button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItemElement);
            });

            cartItemsContainer.querySelectorAll('.minus-btn').forEach(btn => btn.addEventListener('click', e => updateQuantity(e.target.closest('.cart-item').dataset.productId, -1)));
            cartItemsContainer.querySelectorAll('.plus-btn').forEach(btn => btn.addEventListener('click', e => updateQuantity(e.target.closest('.cart-item').dataset.productId, 1)));
        }
        updateTotals();
    }

    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        cartSubtotalElement.textContent = formatVND(subtotal);
        cartTotalElement.textContent = formatVND(subtotal);
    }

    function updateNotificationBadge() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartNotificationBadge.textContent = totalItems;
        cartNotificationBadge.style.display = totalItems > 0 ? 'block' : 'none';
    }
    
    function toggleCart(show) {
        if (show) {
            cartSidebar.classList.add('visible');
            body.classList.add('cart-open');
        } else {
            cartSidebar.classList.remove('visible');
            body.classList.remove('cart-open');
        }
    }
    
    if (notificationIcon) notificationIcon.addEventListener('click', () => toggleCart(true));
    if (closeCartButton) closeCartButton.addEventListener('click', () => toggleCart(false));

    function searchProducts(searchTerm) {
        const normalizedSearch = searchTerm.toLowerCase().trim();
        if (!normalizedSearch) {
            renderPopularProducts(allProductsData);
            return;
        }
        const filteredProducts = allProductsData.filter(p => 
            p["Tên sản phẩm"].toLowerCase().includes(normalizedSearch) ||
            (p["kích thước"] && p["kích thước"].toLowerCase().includes(normalizedSearch))
        );
        renderPopularProducts(filteredProducts);
    }
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => searchProducts(e.target.value), 300);
        });
    }

    // --- Initialization ---
    async function initializeApp() {
        await fetchProducts();
        renderPopularProducts();
        createGlobalPriceSelector();
        updateCartDisplay();
        updateNotificationBadge();
    }

    initializeApp();
});
