

// --- GLOBAL/FILE SCOPE VARIABLES AND FUNCTIONS ---

// --- Cart State ---
let cart = []; // Array to hold cart items: [{ id: '...', quantity: N, priceAtAddToCart: X, ... }]

// Biến để lưu giá được lấy từ file prices.json (hoặc cache)
let productPrices = {}; 

// --- Caching Constants ---
const CACHE_KEY = 'productPricesCache';
const CACHE_TIMESTAMP_KEY = 'productPricesTimestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 giờ

// URL của file JSON giá trên hosting của bạn
// <--- BƯỚC QUAN TRỌNG: THAY THẾ 'prices.json' BẰNG ĐƯỜNG DẪN THỰC TẾ TỚI FILE prices.json TRÊN HOSTING CỦA BẠN -->
const PRICES_JSON_URL = 'prices.json'; // <-- Đảm bảo URL này đúng với vị trí file trên hosting


// Thêm hàm định dạng tiền tệ VNĐ
function formatVND(amount) {
    if (typeof amount !== 'number') {
         return '0 ₫'; 
    }
    return amount.toLocaleString('vi-VN') + ' ₫';
}

// --- Cache Functions ---

// Hàm đọc dữ liệu giá từ localStorage
function loadPricesFromCache() {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (cachedData && cachedTimestamp) {
        const now = Date.now();
        const timestamp = parseInt(cachedTimestamp, 10); // Chuyển timestamp từ string sang number

        // Kiểm tra xem cache còn hợp lệ không (chưa quá CACHE_DURATION)
        if (now - timestamp < CACHE_DURATION) {
            console.log('Loading prices from cache...');
            try {
                // Parse JSON từ string đã lưu
                return JSON.parse(cachedData);
            } catch (e) {
                console.error('Failed to parse cached data:', e);
                // Nếu lỗi parse, coi như cache không hợp lệ
                return null; 
            }
        } else {
            console.log('Cached prices expired.');
            // Nếu cache hết hạn
            return null; 
        }
    }
    console.log('No valid cache found.');
    // Nếu không có cache hoặc cache không hợp lệ/hết hạn
    return null; 
}

// Hàm lưu dữ liệu giá vào localStorage
function savePricesToCache(data) {
    try {
        // Lưu dữ liệu dưới dạng string JSON
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        // Lưu timestamp hiện tại
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log('Prices saved to cache.');
    } catch (e) {
        console.error('Failed to save prices to cache:', e);
        // Xử lý lỗi nếu localStorage đầy hoặc có vấn đề khác
    }
}

// --- Fetch Data from Static JSON File (Async) ---

// Hàm fetch giá từ file prices.json và lưu vào cache
async function fetchPricesFromJsonAndCache() {
     // Chỉ fetch nếu PRICES_JSON_URL đã được cấu hình và không phải giá trị placeholder
    if (PRICES_JSON_URL === 'YOUR_JSON_FILE_URL_HERE' || !PRICES_JSON_URL) {
        console.warn('PRICES_JSON_URL is not configured. Skipping price fetch.');
        return null; // Thoát khỏi hàm nếu URL chưa cấu hình
    }

    console.log(`Attempting to fetch fresh prices from ${PRICES_JSON_URL}...`);
    try {
        const response = await fetch(PRICES_JSON_URL); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} while fetching ${PRICES_JSON_URL}`);
        }
        const fetchedData = await response.json();
        console.log("Prices fetched successfully from JSON:", fetchedData);
        
        savePricesToCache(fetchedData); 
        
        return fetchedData;

    } catch (error) {
        console.error(`Error fetching prices from ${PRICES_JSON_URL}:`, error);
        throw error; 
    }
}

// --- Functions to Update UI (Sử dụng biến productPrices và cart đã được định nghĩa ở trên) ---

// Render popular products into the grid
function renderPopularProducts() {
    // Lấy các phần tử DOM bên trong DOMContentLoaded
    const popularProductsGrid = document.getElementById('popular-products-grid');
    if (!popularProductsGrid) return; // Đảm bảo phần tử tồn tại

    popularProductsGrid.innerHTML = ''; // Clear existing content
    
     if (!popularProducts || popularProducts.length === 0) {
        popularProductsGrid.innerHTML = '<div class="no-results"><p>Không có sản phẩm nào để hiển thị.</p></div>';
        return;
    }

    popularProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.dataset.productId = product.id;

        // --- LẤY GIÁ HIỂN THỊ: Ưu tiên giá từ productPrices, nếu không có dùng giá mặc định ---
        const displayPrice = productPrices && productPrices[product.id] !== undefined 
                             ? productPrices[product.id] 
                             : product.price; 


        const starRatingHTML = Array(5).fill(0).map((_, i) =>
            `<i class="ri-star-fill" style="color: ${i < Math.floor(product.rating) ? '#ffb300' : '#e0e0e0'};"></i>`
        ).join('');

        productCard.innerHTML = `
            <a href="${product.productUrl}" class="product-link">
                <img src="${product.imageUrl}" alt="${product.name}">
            </a>
            <h4>${product.name}</h4>
            <div class="size">${product.size ? `Size: ${product.size}` : ''}</div> 
            <div class="rating">
                ${starRatingHTML} (${product.rating})
            </div>
            <div class="price">${formatVND(displayPrice)}</div> 
            <button class="add-to-cart-btn" data-product-id="${product.id}">Add to cart</button>
        `;
        popularProductsGrid.appendChild(productCard);
    });

    // Add event listeners to Add to Cart buttons after they are rendered
    popularProductsGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
        // Gắn listener trực tiếp gọi hàm handleAddToCartClick đã định nghĩa ở ngoài
        button.addEventListener('click', handleAddToCartClick);
    });
}

// Handle click on Add to Cart button
function handleAddToCartClick(event) {
    const productId = event.target.dataset.productId;
    // Sử dụng mảng popularProducts đã được định nghĩa
    const productToAdd = popularProducts.find(p => p.id === productId); 

    if (productToAdd) {
        const existingItem = cart.find(item => item.id === productToAdd.id);

        // Lấy giá hiện tại của sản phẩm khi thêm vào giỏ
        const priceAtAddToCart = productPrices && productPrices[productToAdd.id] !== undefined 
                                 ? productPrices[productToAdd.id] 
                                 : productToAdd.price;

        if (existingItem) {
            existingItem.quantity++;
            existingItem.priceAtAddToCart = priceAtAddToCart; 
        } else {
            cart.push({ 
                id: productToAdd.id,
                name: productToAdd.name,
                size: productToAdd.size, 
                imageUrl: productToAdd.imageUrl, 
                quantity: 1,
                priceAtAddToCart: priceAtAddToCart 
            }); 
        }

        updateCartDisplay();
        updateNotificationBadge();

        // Kiểm tra và gọi toggleCart
        if (typeof isMobile === 'function' && typeof toggleCart === 'function' && isMobile()) {
            toggleCart(true);
        } else if (window.innerWidth <= 768) { // Fallback nếu isMobile hoặc toggleCart chưa sẵn sàng
             // Logic toggle cart mobile nếu không dùng hàm helper
        }
    }
}

// Update quantity of an item in the cart
function updateQuantity(productId, change) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1); 
        }
        updateCartDisplay();
        updateNotificationBadge();
    }
}

// Render the cart items in the cart sidebar
function updateCartDisplay() {
     // Lấy các phần tử DOM bên trong DOMContentLoaded
    const cartItemsContainer = document.getElementById('cart-items-container');
     const cartSubtotalElement = document.getElementById('cart-subtotal');
     const cartTotalElement = document.getElementById('cart-total');

    if (!cartItemsContainer || !cartSubtotalElement || !cartTotalElement) return;


    cartItemsContainer.innerHTML = ''; // Clear existing items

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty.</div>';
        cartSubtotalElement.textContent = formatVND(0);
        cartTotalElement.textContent = formatVND(0);
    } else {
        cart.forEach(item => {
            const itemDisplayPrice = productPrices && productPrices[item.id] !== undefined 
                                   ? productPrices[item.id] 
                                   : item.priceAtAddToCart; 

            const cartItemElement = document.createElement('div');
            cartItemElement.classList.add('cart-item');
            cartItemElement.dataset.productId = item.id; 

            cartItemElement.innerHTML = `
                <img src="${item.imageUrl}" alt="${item.name}">
                <div class="item-details">
                    <h5>${item.name}</h5>
                    <div class="size">${item.size ? `Size: ${item.size}` : ''}</div> 
                    <div class="price">${formatVND(itemDisplayPrice)}</div> 
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
     // Lấy các phần tử DOM bên trong DOMContentLoaded
     const cartSubtotalElement = document.getElementById('cart-subtotal');
     const cartTotalElement = document.getElementById('cart-total');
     if (!cartSubtotalElement || !cartTotalElement) return;


    const subtotal = cart.reduce((sum, item) => {
        const itemCalculationPrice = productPrices && productPrices[item.id] !== undefined 
                                     ? productPrices[item.id] 
                                     : item.priceAtAddToCart; 

        const safePrice = typeof itemCalculationPrice === 'number' ? itemCalculationPrice : 0;

        return sum + safePrice * item.quantity; 
    }, 0);
    
    const total = subtotal; // Giả định shipping FREE

    cartSubtotalElement.textContent = formatVND(subtotal);
    cartTotalElement.textContent = formatVND(total);
}

// Update the notification badge count
function updateNotificationBadge() {
     // Lấy các phần tử DOM bên trong DOMContentLoaded
     const cartNotificationBadge = document.getElementById('cart-notification-badge');
     if (!cartNotificationBadge) return;


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
     // Lấy các phần tử DOM bên trong DOMContentLoaded
     const cartSidebar = document.getElementById('cart-sidebar');
     const body = document.body;
     if (!cartSidebar || !body) return;

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

// Handle initial state and window resizing
function handleResize() {
     // Lấy các phần tử DOM bên trong DOMContentLoaded
     const cartSidebar = document.getElementById('cart-sidebar');
     const body = document.body;
     if (!cartSidebar || !body) return;

    // On desktop, ensure mobile-specific classes are off
    if (!isMobile()) {
        cartSidebar.classList.remove('visible'); 
        body.classList.remove('cart-open');
    }
     // The cart CSS handles visibility via position/width on desktop.
}


// Hàm tìm kiếm sản phẩm
function searchProducts(searchTerm) {
     // Lấy các phần tử DOM bên trong DOMContentLoaded
     const popularProductsGrid = document.getElementById('popular-products-grid');
     if (!popularProductsGrid) return;

    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    if (normalizedSearch === '') {
        renderPopularProducts(); // Hiển thị lại tất cả sản phẩm (với giá từ cache/json)
        return;
    }

    // Sử dụng mảng popularProducts đã được định nghĩa
    const filteredProducts = popularProducts.filter(product => 
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.size && product.size.toLowerCase().includes(normalizedSearch)) 
    );

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

         const displayPrice = productPrices && productPrices[product.id] !== undefined 
                             ? productPrices[product.id] 
                             : product.price;

        const starRatingHTML = Array(5).fill(0).map((_, i) =>
            `<i class="ri-star-fill" style="color: ${i < Math.floor(product.rating) ? '#ffb300' : '#e0e0e0'};"></i>`
        ).join('');

        productCard.innerHTML = `
             <a href="${product.productUrl}" class="product-link">
                <img src="${product.imageUrl}" alt="${product.name}">
            </a>
            <h4>${product.name}</h4>
             <div class="size">${product.size ? `Size: ${product.size}` : ''}</div>
            <div class="rating">
                ${starRatingHTML} (${product.rating})
            </div>
            <div class="price">${formatVND(displayPrice)}</div> 
            <button class="add-to-cart-btn" data-product-id="${product.id}">Add to cart</button>
        `;
        popularProductsGrid.appendChild(productCard);
    });

    // Thêm lại event listeners cho các nút Add to Cart
    popularProductsGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', handleAddToCartClick); // Gắn listener gọi hàm đã định nghĩa ở ngoài
    });
}

// --- END GLOBAL/FILE SCOPE ---


// --- DOMContentLoaded - Initial setup only ---
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    // KHAI BÁO CÁC BIẾN DOM ELEMENT Ở ĐÂY
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
    // --- Product Data (Static info) ---
     // Mảng này vẫn ở đây, vì nó là dữ liệu tĩnh được load cùng file JS
    const popularProducts = [
        { 
            id: '03affeb3', 
            name: 'DURAflex 6mm', 
            size: '1m22x2m44', 
            price: 196347, // Giá mặc định
            rating: 4.5, 
            imageUrl: 'https://lh3.googleusercontent.com/d/1AvwucuTR5uzIqbRKCpq9Zomoa3CqZRT0',
            productUrl: 'product/sanpham1.html'
        },
        { 
            id: '330d280a', 
            name: 'DURAflex 8mm', 
            size: '1m22x2m44', 
            price: 289649, // Giá mặc định
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

        { id: 'ef492bf0', name: 'DURAflex 9mm', size: '1m22x2m44', price: 331807, rating: 3.1, imageUrl: 'https://lh3.googleusercontent.com/d/1AvwucuTR5uzIqbRKCpq9Zomoa3CqZRT0', productUrl: 'product/sanpham1.html' },

        { id: 'bf823a06', name: 'DURAflex 10mm', size: '1m22x2m44', price: 395044, rating: 3.2, imageUrl: 'https://lh3.googleusercontent.com/d/1jwewcToHwM7p9oiNG9Z6kpP-tSh7hSPM', productUrl: 'product/sanpham1.html' },
    
        { id: 'fcf76fc8', name: ' DURAflex  15mm nhỏ', size: '1mx2m', price: 346680, rating: 3.2, imageUrl: 'https://lh3.googleusercontent.com/d/1jwewcToHwM7p9oiNG9Z6kpP-tSh7hSPM', productUrl: 'product/sanpham1.html' }
    ];


    // --- Initial Load Logic ---
    // 1. Thử tải giá từ cache ngay lập tức
    const cachedPrices = loadPricesFromCache();

    if (cachedPrices) {
        productPrices = cachedPrices; 
        console.log("Using cached prices from localStorage.");
        renderPopularProducts();
        updateCartDisplay(); 
    } else {
        console.log("No valid cache, rendering with default prices from JS array.");
        renderPopularProducts();
        updateCartDisplay(); 
    }

    // 2. Bất đồng bộ fetch giá mới từ file prices.json (không chờ kết quả này)
    fetchPricesFromJsonAndCache()
        .then(fetchedData => {
            if (fetchedData) {
                 console.log('Fetch from JSON complete. Updating UI with fresh prices.');
                 productPrices = fetchedData; 
                 renderPopularProducts(); 
                 updateCartDisplay(); 
            }
        })
        .catch(error => {
            console.warn('Failed to fetch fresh prices from JSON, using current data.', error);
        });


    // --- Các Event Listener và Khởi tạo khác chỉ chạy sau khi DOMContentLoaded ---

    // Listeners cho Cart Toggle (Notification icon và Close button)
    if (notificationIcon) {
        notificationIcon.addEventListener('click', () => {
            if (isMobile()) { // isMobile đã định nghĩa ngoài scope
                toggleCart(true); // toggleCart đã định nghĩa ngoài scope
            }
        });
    }

     if (closeCartButton) {
         closeCartButton.addEventListener('click', () => {
             if (isMobile()) { // isMobile đã định nghĩa ngoài scope
                 toggleCart(false); // toggleCart đã định nghĩa ngoài scope
             }
         });
     }


    // Handle window resize (gắn listener cho hàm handleResize đã định nghĩa ngoài scope)
    window.addEventListener('resize', handleResize); 

    // Thêm event listener cho thanh tìm kiếm
    if (searchInput) {
        let searchTimeout; // searchTimeout chỉ cần trong scope này
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchProducts(e.target.value); // searchProducts đã định nghĩa ngoài scope
            }, 300); 
        });
    }


    // --- Các lệnh khởi tạo cuối cùng ---
    updateNotificationBadge(); // updateNotificationBadge đã định nghĩa ngoài scope
    handleResize(); // Gọi handleResize lần đầu để thiết lập trạng thái ban đầu


}); // End DOMContentLoaded