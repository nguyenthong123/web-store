
// Thêm hàm này vào đầu file script.js
const getCurrentUser = () => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
};

// Sửa lại toàn bộ hàm renderPopularProducts
function renderPopularProducts(productsToRender = allProductsData) {
    if (!popularProductsGrid) return;
    popularProductsGrid.innerHTML = '';

    if (!productsToRender || productsToRender.length === 0) {
        popularProductsGrid.innerHTML = '<div class="no-results"><p>Không có sản phẩm nào.</p></div>';
        return;
    }

    const currentUser = getCurrentUser();
    let userType = 'chủ nhà'; // Mặc định
    if (currentUser) {
        userType = currentUser.phan_loai; // Lấy loại người dùng nếu đã đăng nhập
    }

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.dataset.productId = product["id_san_pham"];

        let priceHtml = '';

        if (userType === 'Thầu Thợ') {
            const price = product["Giá Thầu Thợ"];
            priceHtml = `<div class="price">${formatVND(price)}</div>`;
        } else if (userType === 'Nhà Máy Tôn') {
            // Tạo một button để hiển thị danh sách giá
            priceHtml = `<button class="view-package-prices-btn" data-product-id="${product["id_san_pham"]}">Xem báo giá</button>`;
        } else { // Mặc định là 'chủ nhà'
            const price = product["Giá chủ nhà"];
            priceHtml = `<div class="price">${formatVND(price)}</div>`;
        }

        productCard.innerHTML = `
            <a href="#" class="product-link">
                <img src="${product["image sản phẩm"]}" alt="${product["Tên sản phẩm"]}" loading="lazy">
            </a>
            <h4>${product["Tên sản phẩm"]}</h4>
            <div class="size">Kích thước: ${product["kích thước"]}</div>
            ${priceHtml} 
            <button class="add-to-cart-btn" data-product-id="${product["id_san_pham"]}">Thêm vào giỏ</button>
        `;

        popularProductsGrid.appendChild(productCard);
    });
    
    // Thêm event listener cho các nút mới (nếu có)
    document.querySelectorAll('.view-package-prices-btn').forEach(button => {
        button.addEventListener('click', event => {
            const productId = event.target.dataset.productId;
            const productData = allProductsData.find(p => p.id_san_pham === productId);
            if(productData){
                let priceList = 'Báo giá cho Nhà Máy Tôn:\n';
                priceList += `Giá niêm yết: ${formatVND(productData['giá niêm yết'])}\n`;
                priceList += `Gói 1 kiện: ${formatVND(productData['gói 1 kiện Tháng 10"'])}/kiện\n`;
                priceList += `Gói 2 kiện: ${formatVND(productData['gói 2 kiện Tháng 10"'])}/kiện\n`;
                priceList += `Gói 4 kiện: ${formatVND(productData['gói 4 kiện'])}/kiện\n`;
                // ... thêm các gói khác ...
                alert(priceList); // Hiển thị alert đơn giản, có thể nâng cấp thành modal đẹp hơn
            }
        });
    });

    // Giữ nguyên event listener cho nút "Thêm vào giỏ"
    popularProductsGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', handleAddToCartClick);
    });
}

// Sửa lại hàm handleAddToCartClick để dùng đúng giá
function handleAddToCartClick(event) {
    const productId = event.target.dataset.productId;
    const productToAdd = allProductsData.find(p => p["id_san_pham"] === productId);

    if (productToAdd) {
        // QUAN TRỌNG: Xác định giá nào sẽ được thêm vào giỏ hàng
        const currentUser = getCurrentUser();
        let priceKey = "Giá chủ nhà"; // Mặc định
        if(currentUser && currentUser.phan_loai === 'Thầu Thợ'){
            priceKey = "Giá Thầu Thợ";
        }
        // Lưu ý: Đối với Nhà Máy Tôn, bạn cần quyết định giá nào sẽ được thêm vào giỏ. 
        // Ở đây tạm lấy giá niêm yết.
        if(currentUser && currentUser.phan_loai === 'Nhà Máy Tôn'){
            priceKey = "giá niêm yết";
        }

        const productWithPrice = {
            ...productToAdd,
            // Thêm một trường 'displayPrice' để giỏ hàng biết dùng giá nào
            displayPrice: productToAdd[priceKey] 
        };
        addToCart(productWithPrice);
        if (window.innerWidth <= 768) {
            toggleCart(true);
        }
    }
}

// Và cuối cùng, sửa lại các hàm trong giỏ hàng để dùng 'displayPrice'
// Ví dụ: updateTotals
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.displayPrice * item.quantity, 0);
    //...
}


// NỘI DUNG MỚI CHO SCRIPT.JS - ĐÃ SỬA LỖI VÀ LẤY ĐÚNG "GIÁ CHỦ NHÀ"



document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const popularProductsGrid = document.getElementById('popular-products-grid');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartNotificationBadge = document.getElementById('cart-notification-badge');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    const cartTotalElement = document.getElementById('cart-total');
    const notificationIcon = document.getElementById('notification-icon');
    const closeCartButton = document.getElementById('close-cart-button');
    const body = document.body;
    const searchInput = document.querySelector('.search-bar input');

    // --- Product Data ---
    let allProductsData = []; 

    // SỬA 1: Tải đúng file gia_web_dura.json
    async function fetchProductsFromJsonAndCache() {
        try {
            // Đổi tên file ở đây!
            const response = await fetch('./gia_web_dura.json'); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Fetched products:', data);
            allProductsData = data;
            return data;
        } catch (error) {
            console.error('Error loading products:', error);
            return [];
        }
    }

    async function initializeProducts() {
        await fetchProductsFromJsonAndCache();
        renderPopularProducts();
        updateCartDisplay();
        updateNotificationBadge();
    }

    function formatVND(amount) {
        const numericAmount = parseInt(amount, 10);
        if (isNaN(numericAmount)) {
            return '0 đ';
        }
        const formatted = numericAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return formatted + ' đ';
    }

    let cart = []; 

    // SỬA 2: Sửa lại toàn bộ hàm render để khớp với key trong file JSON mới
    function renderPopularProducts(productsToRender = allProductsData) {
        if (!popularProductsGrid) return;
        popularProductsGrid.innerHTML = '';

        if (!productsToRender || productsToRender.length === 0) {
            popularProductsGrid.innerHTML = '<div class="no-results"><p>Không có sản phẩm nào để hiển thị.</p></div>';
            return;
        }

        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.dataset.productId = product["id_san_pham"]; // Cập nhật key ID

            // Dữ liệu của bạn không có rating, nên chúng ta sẽ bỏ phần sao đi
            
            // LẤY GIÁ TỪ CỘT "Giá chủ nhà" - ĐÂY LÀ THAY ĐỔI QUAN TRỌNG NHẤT
            const displayPrice = product["Giá chủ nhà"];

            productCard.innerHTML = `
                <a href="#" class="product-link">
                    <img src="${product["image sản phẩm"]}" alt="${product["Tên sản phẩm"]}" loading="lazy">
                </a>
                <h4>${product["Tên sản phẩm"]}</h4>
                <div class="size">Kích thước: ${product["kích thước"]}</div>
                <div class="price">${formatVND(displayPrice)}</div>
                <button class="add-to-cart-btn" data-product-id="${product["id_san_pham"]}">Thêm vào giỏ</button>
            `;

            popularProductsGrid.appendChild(productCard);
        });

        popularProductsGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', handleAddToCartClick);
        });
    }

    function handleAddToCartClick(event) {
        const productId = event.target.dataset.productId;
        const productToAdd = allProductsData.find(p => p["id_san_pham"] === productId); // Cập nhật key ID

        if (productToAdd) {
            addToCart(productToAdd);
            if (window.innerWidth <= 768) {
                toggleCart(true);
            }
        }
    }
    
    // SỬA 3: Cập nhật hàm addToCart và updateCartDisplay để dùng đúng key
    function addToCart(product) {
        const existingItem = cart.find(item => item["id_san_pham"] === product["id_san_pham"]);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        updateCartDisplay();
        updateNotificationBadge();
    }

    function updateQuantity(productId, change) {
        const item = cart.find(item => item["id_san_pham"] === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(item => item["id_san_pham"] !== productId);
            }
            updateCartDisplay();
            updateNotificationBadge();
        }
    }

    function updateCartDisplay() {
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty.</div>';
            cartSubtotalElement.textContent = formatVND(0);
            cartTotalElement.textContent = formatVND(0);
        } else {
            cart.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.classList.add('cart-item');
                cartItemElement.dataset.productId = item["id_san_pham"];

                cartItemElement.innerHTML = `
                    <img src="${item["image sản phẩm"]}" alt="${item["Tên sản phẩm"]}">
                    <div class="item-details">
                        <h5>${item["Tên sản phẩm"]}</h5>
                        <div class="size">Kích thước: ${item["kích thước"]}</div>
                        <div class="price">${formatVND(item["Giá chủ nhà"])}</div>
                    </div>
                    <div class="quantity-controls">
                        <button class="decrease-quantity">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="increase-quantity">+</button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItemElement);
            });
            
            cartItemsContainer.querySelectorAll('.decrease-quantity').forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = event.target.closest('.cart-item').dataset.productId;
                    updateQuantity(productId, -1);
                });
            });
            
            cartItemsContainer.querySelectorAll('.increase-quantity').forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = event.target.closest('.cart-item').dataset.productId;
                    updateQuantity(productId, 1);
                });
            });

            updateTotals();
        }
    }

    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + item["Giá chủ nhà"] * item.quantity, 0);
        const total = subtotal;

        cartSubtotalElement.textContent = formatVND(subtotal);
        cartTotalElement.textContent = formatVND(total);
    }

    // Các hàm còn lại không cần sửa, giữ nguyên...
    
    function updateNotificationBadge() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartNotificationBadge.textContent = totalItems;
        if (totalItems > 0) cartNotificationBadge.style.display = 'block';
        else cartNotificationBadge.style.display = 'none';
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

    notificationIcon.addEventListener('click', () => toggleCart(true));
    closeCartButton.addEventListener('click', () => toggleCart(false));

    function searchProducts(searchTerm) {
        const normalizedSearch = searchTerm.toLowerCase().trim();
        if (!normalizedSearch) {
            renderPopularProducts(allProductsData);
            return;
        }
        const filteredProducts = allProductsData.filter(product => 
            product["Tên sản phẩm"].toLowerCase().includes(normalizedSearch) ||
            (product["kích thước"] && product["kích thước"].toLowerCase().includes(normalizedSearch))
        );
        renderPopularProducts(filteredProducts);
    }

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchProducts(e.target.value);
        }, 300);
    });

    initializeProducts();
});
