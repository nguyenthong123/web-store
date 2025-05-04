document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const popularProductsGrid = document.getElementById('popular-products-grid');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartNotificationBadge = document.getElementById('cart-notification-badge');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    const cartTotalElement = document.getElementById('cart-total');
    const notificationIcon = document.getElementById('notification-icon'); // This will be the cart toggle on mobile
    const closeCartButton = document.getElementById('close-cart-button');
    const body = document.body; // To add/remove class for overflow control
    const searchInput = document.querySelector('.search-bar input');

    // --- Product Data ---
    const popularProducts = [
        { 
            id: '03affeb3', 
            name: 'DURAflex 6mm', 
            size: '1m22x2m44', 
            price: 196347, 
            rating: 4.5, 
            imageUrl: 'https://lh3.googleusercontent.com/d/1AvwucuTR5uzIqbRKCpq9Zomoa3CqZRT0',
            productUrl: 'product/sanpham1.html'
        },
        { 
            id: '330d280a', 
            name: 'DURAflex 8mm', 
            size: '1m22x2m44', 
            price: 289649, 
            rating: 4.9, 
            imageUrl: 'https://lh3.googleusercontent.com/d/1AvwucuTR5uzIqbRKCpq9Zomoa3CqZRT0',
            productUrl: 'product/sanpham1.html'
        },
        { id: '5498355b', name: 'DURAflex 12mm', size: '1m22x2m44', price: 449828, rating: 3.9, imageUrl: 'https://lh3.googleusercontent.com/d/1AvwucuTR5uzIqbRKCpq9Zomoa3CqZRT0',
         productUrl: 'product/sanpham1.html'
         },

        { id: '68a4ff7c', name: 'DURAflex 15mm', size: '1m22x2m44', price: 479146, rating: 3.5, imageUrl: 'https://lh3.googleusercontent.com/d/1AvwucuTR5uzIqbRKCpq9Zomoa3CqZRT0'
        , productUrl: 'product/sanpham1.html'

         },

        { id: '0d00e5a0', name: 'DURAflex 16mm', size: '1m22x2m44', price: 520127, rating: 4.9, imageUrl: 'https://lh3.googleusercontent.com/d/1AvwucuTR5uzIqbRKCpq9Zomoa3CqZRT0', productUrl: 'product/sanpham1.html' },

        { id: 'a52e4b51', name: 'DURAflex 18mm', size: '1m22x2m44', price: 612682, rating: 4.9, imageUrl: 'https://lh3.googleusercontent.com/d/1AvwucuTR5uzIqbRKCpq9Zomoa3CqZRT0', productUrl: 'product/sanpham1.html' },

        { id: 'ffb5e8b3', name: ' DURA vis bắn vách', size: '26mm', price: 115000, rating: 4.8, imageUrl: 'https://lh3.googleusercontent.com/d/1c7uX73pN-pFWtU28S6mx0sMtyOa7SOLG', productUrl: 'product/sanpham2.html' },

        { id: '0ca12c6c', name: 'DURA vis bắn Sàn', size: '35mm', price: 115000, rating: 4.8, imageUrl: 'https://lh3.googleusercontent.com/d/1CrHuh05opsLhcnufGgWxw9Rv93DjWQLC', productUrl: 'product/sanpham2.html' },

    
        { id: 'fcf76fc8', name: ' DURAflex  15mm nhỏ', size: '1mx2m', price: 346680, rating: 3.2, imageUrl: 'https://lh3.googleusercontent.com/d/1jwewcToHwM7p9oiNG9Z6kpP-tSh7hSPM', productUrl: 'product/sanpham1.html' }
    ];

    // Thêm hàm định dạng tiền tệ VNĐ
    function formatVND(amount) {
        return amount.toLocaleString('vi-VN') + ' ₫';
    }

    // --- Cart State ---
    let cart = []; // Array to hold cart items: [{ id: '...', quantity: N, price: X, ... }]

    // --- Functions ---

    // Render popular products into the grid
    function renderPopularProducts() {
        popularProductsGrid.innerHTML = ''; // Clear existing content
        popularProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.dataset.productId = product.id;

            const starRatingHTML = Array(5).fill(0).map((_, i) =>
                `<i class="ri-star-fill" style="color: ${i < Math.floor(product.rating) ? '#ffb300' : '#e0e0e0'};"></i>`
            ).join('');

            productCard.innerHTML = `
                <a href="${product.productUrl}" class="product-link">
                    <img src="${product.imageUrl}" alt="${product.name}">
                </a>
                <h4>${product.name}</h4>
                <div class="rating">
                    ${starRatingHTML} (${product.rating})
                </div>
                <div class="price">${formatVND(product.price)}</div>
                <button class="add-to-cart-btn" data-product-id="${product.id}">Add to cart</button>
            `;
            popularProductsGrid.appendChild(productCard);
        });

        // Add event listeners to Add to Cart buttons after they are rendered
        popularProductsGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', handleAddToCartClick);
        });
    }

    // Handle click on Add to Cart button
    function handleAddToCartClick(event) {
        const productId = event.target.dataset.productId;
        const productToAdd = popularProducts.find(p => p.id === productId);

        if (productToAdd) {
            addToCart(productToAdd);
            // On mobile, open the cart sidebar when an item is added
            if (window.innerWidth <= 768) {
                toggleCart(true);
            }
        }
    }

    // Add a product to the cart or increment quantity if it exists
    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 }); // Add new item with quantity 1
        }

        updateCartDisplay();
        updateNotificationBadge();
    }

    // Update quantity of an item in the cart
    function updateQuantity(productId, change) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(item => item.id !== productId); // Remove if quantity is 0 or less
            }
            updateCartDisplay();
            updateNotificationBadge();
        }
    }

    // Render the cart items in the cart sidebar
    function updateCartDisplay() {
        cartItemsContainer.innerHTML = ''; // Clear existing items

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty.</div>';
            cartSubtotalElement.textContent = formatVND(0);
            cartTotalElement.textContent = formatVND(0);
        } else {
            cart.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.classList.add('cart-item');
                cartItemElement.dataset.productId = item.id; // Add data attribute

                cartItemElement.innerHTML = `
                    <img src="${item.imageUrl}" alt="${item.name}">
                    <div class="item-details">
                        <h5>${item.name}</h5>
                        <div class="size">${item.size ? `Size: ${item.size}` : ''}</div>
                        <div class="price">${formatVND(item.price)}</div>
                    </div>
                    <div class="quantity-controls">
                        <button class="decrease-quantity">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="increase-quantity">+</button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItemElement);
            });
             // Add event listeners for quantity controls after items are rendered
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

            updateTotals(); // Recalculate and display totals
        }
    }

    // Calculate and update subtotal and total
    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const total = subtotal;

        cartSubtotalElement.textContent = formatVND(subtotal);
        cartTotalElement.textContent = formatVND(total);
    }

    // Update the notification badge count
    function updateNotificationBadge() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartNotificationBadge.textContent = totalItems;

        if (totalItems > 0) {
            cartNotificationBadge.style.display = 'block'; // Show badge
        } else {
            cartNotificationBadge.style.display = 'none'; // Hide badge
        }
    }

    // Toggle cart sidebar visibility (used for mobile)
    function toggleCart(show) {
        if (show === true) {
            cartSidebar.classList.add('visible');
            body.classList.add('cart-open'); // Add class to body if needed for overflow/layout
        } else if (show === false) {
            cartSidebar.classList.remove('visible');
            body.classList.remove('cart-open'); // Remove class from body
        } else {
            // Toggle based on current state
            cartSidebar.classList.toggle('visible');
            body.classList.toggle('cart-open');
        }
    }

     // Check if currently on a mobile screen size
    function isMobile() {
        return window.innerWidth <= 768; // Match the media query breakpoint
    }

    // --- Event Listeners ---

    // Listen for clicks on the notification icon (mobile only behavior)
    notificationIcon.addEventListener('click', () => {
         if (isMobile()) {
            toggleCart(true); // Open cart on mobile
         } else {
             // On desktop, maybe just scroll to the cart? Or do nothing as it's fixed?
             // For this example, we'll do nothing on desktop as it's always visible
         }
    });

    // Listen for clicks on the close cart button (mobile only behavior)
    closeCartButton.addEventListener('click', () => {
        if (isMobile()) {
             toggleCart(false); // Close cart on mobile
        }
    });

     // Handle initial state and window resizing
    function handleResize() {
        // On desktop, ensure cart is visible and notification doesn't toggle it
        if (!isMobile()) {
            cartSidebar.classList.remove('visible'); // Ensure mobile class is off
            body.classList.remove('cart-open');
            // The cart CSS handles visibility via position/width on desktop
        }
         // Note: The notification icon *always* has the click listener, but
         // the toggleCart function checks isMobile() internally before acting.
    }

    window.addEventListener('resize', handleResize);

    // Hàm tìm kiếm sản phẩm
    function searchProducts(searchTerm) {
        const normalizedSearch = searchTerm.toLowerCase().trim();
        
        if (normalizedSearch === '') {
            renderPopularProducts(); // Hiển thị lại tất cả sản phẩm nếu ô tìm kiếm trống
            return;
        }

        const filteredProducts = popularProducts.filter(product => 
            product.name.toLowerCase().includes(normalizedSearch) ||
            product.size.toLowerCase().includes(normalizedSearch)
        );

        // Render các sản phẩm đã lọc
        popularProductsGrid.innerHTML = '';
        
        if (filteredProducts.length === 0) {
            popularProductsGrid.innerHTML = `
                <div class="no-results">
                    <p>Không tìm thấy sản phẩm "${searchTerm}"</p>
                </div>
            `;
            return;
        }

        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.dataset.productId = product.id;

            const starRatingHTML = Array(5).fill(0).map((_, i) =>
                `<i class="ri-star-fill" style="color: ${i < Math.floor(product.rating) ? '#ffb300' : '#e0e0e0'};"></i>`
            ).join('');

            productCard.innerHTML = `
                <a href="${product.productUrl}" class="product-link">
                    <img src="${product.imageUrl}" alt="${product.name}">
                </a>
                <h4>${product.name}</h4>
                <div class="rating">
                    ${starRatingHTML} (${product.rating})
                </div>
                <div class="price">${formatVND(product.price)}</div>
                <button class="add-to-cart-btn" data-product-id="${product.id}">Add to cart</button>
            `;
            popularProductsGrid.appendChild(productCard);
        });

        // Thêm lại event listeners cho các nút Add to Cart
        popularProductsGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', handleAddToCartClick);
        });
    }

    // Thêm event listener cho thanh tìm kiếm với debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchProducts(e.target.value);
        }, 300); // Đợi 300ms sau khi người dùng ngừng gõ
    });

    // --- Initial Load ---
    renderPopularProducts(); // Display the products
    updateNotificationBadge(); // Initialize the badge (will be 0)
    updateCartDisplay(); // Initialize the cart display (will show empty message)
    handleResize(); // Set initial state based on screen size
});