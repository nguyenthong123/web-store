// NỘI DUNG MỚI HOÀN TOÀN CHO SCRIPT.JS - HỖ TRỢ SỐ LƯỢNG THẬP PHÂN & PHÍ VẬN CHUYỂN

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const popularProductsGrid = document.getElementById('popular-products-grid');
    // ... (các element khác giữ nguyên) ...
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartNotificationBadge = document.getElementById('cart-notification-badge');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    const cartTotalElement = document.getElementById('cart-total');
    const notificationIcon = document.getElementById('notification-icon');
    const closeCartButton = document.getElementById('close-cart-button');
    const body = document.body;
    const searchInput = document.querySelector('.search-bar input');

    // --- Data & Config ---
    let allProductsData = [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // =================================================================
    // === CẤU HÌNH MỚI: Phí vận chuyển và bước nhảy số lượng ===
    // =================================================================
    const SHIPPING_FEE = 30000; // Ví dụ: phí vận chuyển là 30,000 đ
    const QUANTITY_STEP = 0.5;   // Bước nhảy cho số lượng (ví dụ: 0.5 kg)
    const MINIMUM_QUANTITY = 0.5; // Số lượng tối thiểu có thể đặt
    // =================================================================

    // --- Helper Functions ---
    const getCurrentUser = () => {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    };

    const formatVND = (amount) => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) return 'Liên hệ';
        return numericAmount.toLocaleString('vi-VN') + ' đ';
    };
    
    const saveCart = () => {
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    // --- Core Functions ---
    // ... (các hàm fetchProducts, renderPopularProducts, createGlobalPriceSelector giữ nguyên) ...
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

    function renderPopularProducts(productsToRender = allProductsData) {
        // ... (Nội dung hàm này giữ nguyên, không cần thay đổi) ...
    }

    // --- Cart Management (ĐÃ CẬP NHẬT) ---
    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        
        // Xác định bước nhảy cho sản phẩm này (Vít là 0.5, Tấm là 1)
        const step = product.name.toLowerCase().includes('vis') ? QUANTITY_STEP : 1;

        if (existingItem) {
            existingItem.quantity += step;
        } else {
            // Khi thêm mới, số lượng ban đầu là bước nhảy
            const initialQuantity = product.name.toLowerCase().includes('vis') ? MINIMUM_QUANTITY : 1;
            cart.push({ ...product, quantity: initialQuantity });
        }
        saveCart();
        updateCartDisplay();
        updateNotificationBadge();
    }

    // =================================================================
    // === CẬP NHẬT HÀM NÀY: Hỗ trợ số lượng thập phân ===
    // =================================================================
    function updateQuantity(productId, change) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            // Xác định bước nhảy cho từng loại sản phẩm
            const step = item.name.toLowerCase().includes('vis') ? QUANTITY_STEP : 1;
            const minQty = item.name.toLowerCase().includes('vis') ? MINIMUM_QUANTITY : 1;

            // Tính toán số lượng mới
            let newQuantity = item.quantity + (change * step);
            
            // Làm tròn để tránh sai số dấu phẩy động (ví dụ: 0.5 + 0.5 = 0.99999...)
            newQuantity = Math.round(newQuantity * 10) / 10;
            
            if (newQuantity < minQty) {
                // Nếu số lượng mới nhỏ hơn mức tối thiểu, xóa khỏi giỏ hàng
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

            // Gắn sự kiện tăng/giảm số lượng
            cartItemsContainer.querySelectorAll('.minus-btn').forEach(btn => btn.addEventListener('click', e => updateQuantity(e.target.closest('.cart-item').dataset.productId, -1)));
            cartItemsContainer.querySelectorAll('.plus-btn').forEach(btn => btn.addEventListener('click', e => updateQuantity(e.target.closest('.cart-item').dataset.productId, 1)));
        }
        updateTotals();
    }
    
    // =================================================================
    // === CẬP NHẬT HÀM NÀY: Thêm phí vận chuyển ===
    // =================================================================
    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        let shipping = 0;
        if (subtotal > 0) { // Chỉ tính phí ship khi có hàng trong giỏ
            shipping = SHIPPING_FEE;
        }

        const total = subtotal + shipping;

        // Cập nhật hiển thị trên HTML
        cartSubtotalElement.textContent = formatVND(subtotal);
        document.querySelector('.summary-row .shipping').textContent = formatVND(shipping); // Tìm đúng thẻ span để cập nhật
        cartTotalElement.textContent = formatVND(total);
    }

    function updateNotificationBadge() {
        // Tính tổng số lượng, làm tròn để hiển thị số nguyên
        const totalItems = Math.ceil(cart.reduce((sum, item) => sum + item.quantity, 0));
        cartNotificationBadge.textContent = totalItems;
        cartNotificationBadge.style.display = totalItems > 0 ? 'block' : 'none';
    }
    
    // ... (Các hàm còn lại như toggleCart, searchProducts, initializeApp giữ nguyên)
    function toggleCart(show) { /* ... */ }
    function searchProducts(searchTerm) { /* ... */ }
    async function initializeApp() { /* ... */ }
    
    // Khởi chạy ứng dụng
    initializeApp();
});
