// --- GLOBAL/FILE SCOPE VARIABLES AND FUNCTIONS ---

// --- Cart State ---
// Variable to hold items currently in the cart. Each item stores ID, name, size, image URL, quantity, and price at the time it was added.
let cart = []; 

// Variable to hold all product data fetched from products.json (or cache).
// This will be the single source of truth for product information displayed on the page.
// It's initialized as an empty array and will be populated by the fetch/cache logic.
let allProductsData = []; 

// Thêm biến cho dữ liệu sản phẩm mặc định
const defaultProducts = [
    {
        id: "0ca12c6c",
        name: "DURAflex 6mm",
        size: "1m22x2m51",
        price: 118000,
        rating: 4.16,
        imageUrl: "https://lh3.googleusercontent.com/d/1AvwucuTR5uzIqbRKCpq9Zomoa3CqZRT0", // Sửa lại URL ảnh
        productUrl: "product/sanpham1.html"
    },
    // ...thêm các sản phẩm khác từ JSON của bạn
];

// --- Caching Constants ---
// Keys used for storing data and timestamp in localStorage
const CACHE_KEY = 'allProductsDataCache'; 
const CACHE_TIMESTAMP_KEY = 'allProductsDataTimestamp'; 
// Duration for cache validity: 24 hours (24 hours * 60 min/hour * 60 sec/min * 1000 ms/sec)
const CACHE_DURATION = 24 * 60 * 60 * 1000; 

// URL of the JSON file containing ALL product data on your hosting (or GitHub Pages)
// <--- IMPORTANT: REPLACE 'products.json' WITH THE ACTUAL PUBLICLY ACCESSIBLE PATH TO products.json -->
// This path should be relative to your index.html or an absolute URL (e.g., '/products.json', '/data/products.json', 'https://yourusername.github.io/yourrepo/products.json')
const PRODUCTS_JSON_URL = './prices.json'; // Đảm bảo file prices.json nằm cùng thư mục với index.html


// Add VNĐ currency formatter function (Remains unchanged)
function formatVND(amount) {
    if (typeof amount !== 'number') {
         return '0 ₫'; 
    }
    return amount.toLocaleString('vi-VN') + ' ₫';
}

// --- Cache Functions ---

// Function to load all product data from localStorage cache
function loadProductsFromCache() {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (cachedData && cachedTimestamp) {
        const now = Date.now();
        const timestamp = parseInt(cachedTimestamp, 10); // Convert timestamp string to number

        // Check if the cache is still valid (not older than CACHE_DURATION)
        if (now - timestamp < CACHE_DURATION) {
            console.log('Loading product data from cache...');
            try {
                // Parse the JSON string stored in cache back into a JS object/array
                const parsedData = JSON.parse(cachedData);
                 // Validate that the parsed data is indeed an array, as expected
                 if (Array.isArray(parsedData)) {
                     return parsedData; // Return the cached array
                 } else {
                     console.error('Cached data structure is invalid: Expected an array.', parsedData);
                     // If data is not the expected format, treat as no valid cache
                     return null; 
                 }
            } catch (e) {
                console.error('Failed to parse cached product data:', e);
                // If JSON parsing fails, treat as no valid cache
                return null; 
            }
        } else {
            console.log('Cached product data expired.');
            // If cache timestamp is too old, treat as no valid cache
            return null; 
        }
    }
    console.log('No valid product data cache found.');
    // If no cache data or timestamp exists, or any check failed, return null
    return null; 
}

// Function to save all product data to localStorage cache
function saveProductsToCache(data) {
     // Only save if the data is a valid non-empty array
     if (!Array.isArray(data) || data.length === 0) {
         console.warn('Attempted to save invalid or empty data to cache. Skipping save.');
         return; // Do not save invalid data
     }
    try {
        // Convert the data array to a JSON string and save to localStorage
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        // Save the current timestamp
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log('Product data saved to cache.');
    } catch (e) {
        console.error('Failed to save product data to cache:', e);
        // Log a more specific error if localStorage is full
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
             console.error('localStorage is full! Cannot save cache.');
        }
    }
}

// --- Fetch Data from Static JSON File (Async) ---

// Function to fetch all product data (array of objects) from products.json and save to cache
async function fetchProductsFromJsonAndCache() {
    console.log('Attempting to fetch from:', PRODUCTS_JSON_URL);
    try {
        const response = await fetch(PRODUCTS_JSON_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data);
        
        if (!Array.isArray(data)) {
            throw new Error('Data is not an array');
        }
        
        saveProductsToCache(data);
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}

// --- Functions to Update UI (Now using allProductsData and cart) ---

// Sửa lại hàm renderProducts để hiển thị sản phẩm mặc định nếu không có dữ liệu
function renderProducts() {
    const popularProductsGrid = document.getElementById('popular-products-grid');
    if (!popularProductsGrid) return;

    popularProductsGrid.innerHTML = '';

    // Sử dụng dữ liệu từ allProductsData hoặc defaultProducts
    const productsToRender = allProductsData.length > 0 ? allProductsData : defaultProducts;

    if (!productsToRender || productsToRender.length === 0) {
        popularProductsGrid.innerHTML = '<div class="no-results"><p>Không có sản phẩm nào để hiển thị.</p></div>';
        return;
    }

    productsToRender.forEach(product => {
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
            <div class="size">${product.size ? `Size: ${product.size}` : ''}</div>
            <div class="rating">
                ${starRatingHTML} (${product.rating || 0})
            </div>
            <div class="price">${formatVND(product.price)}</div>
            <button class="add-to-cart-btn" data-product-id="${product.id}">Thêm vào giỏ</button>
        `;

        popularProductsGrid.appendChild(productCard);
    });

    // Thêm event listeners cho nút "Thêm vào giỏ"
    popularProductsGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', handleAddToCartClick);
    });
}

// Handle click events for the "Add to cart" buttons
function handleAddToCartClick(event) {
    // Get the product ID from the data attribute of the clicked button
    const productId = event.target.dataset.productId;
    // Find the corresponding product object in the allProductsData array using the ID
    const productToAdd = allProductsData.find(p => p.id === productId);

    // Proceed only if the product was successfully found in the data
    if (productToAdd) {
        // Check if the selected product is already present in the cart array
        const existingItem = cart.find(item => item.id === productToAdd.id);

        // The price for the cart item comes directly from the fetched productToAdd object
        const priceAtAddToCart = productToAdd.price;

        if (existingItem) {
            // If the item is already in the cart, just increase its quantity
            existingItem.quantity++;
            // Optionally update the priceAtAddToCart with the latest price from productToAdd.
            // This ensures that if the product's price in the JSON changed since it was first added,
            // the price used for display and calculation in the cart is updated the next time the cart is rendered.
            existingItem.priceAtAddToCart = priceAtAddToCart; 
        } else {
            // If the item is not in the cart, add it as a new item
            cart.push({
                id: productToAdd.id,
                name: productToAdd.name, // Store name in cart item
                size: productToAdd.size, // Store size in cart item
                imageUrl: productToAdd.imageUrl, // Store image URL in cart item
                quantity: 1, // Start with a quantity of 1
                priceAtAddToCart: priceAtAddToCart // Store the price at the moment the item was added
            }); 
        }

        // Update the visual display of the cart and the notification badge
        updateCartDisplay();
        updateNotificationBadge();

        // On mobile screens, automatically open the cart sidebar (using helper functions)
        // Check if the helper functions exist before calling them
        if (typeof isMobile === 'function' && typeof toggleCart === 'function' && isMobile()) {
            toggleCart(true);
        }
        // Optional: Add logic here for desktop, e.g., briefly highlighting the cart icon.
    } else {
         // Log a warning if the product ID from the button didn't match any product in the data
         console.warn(`Attempted to add product with ID "${productId}" to cart, but product not found in allProductsData.`);
    }
}

// Update the quantity of a specific item in the cart by a given change amount
function updateQuantity(productId, change) {
    // Find the index of the item in the cart array by its ID
    const itemIndex = cart.findIndex(item => item.id === productId);
    // If the item is found (index is not -1)
    if (itemIndex > -1) {
        // Update the quantity of the item
        cart[itemIndex].quantity += change;
        // If the quantity is now 0 or less, remove the item from the cart
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1); // Remove 1 element at itemIndex
        }
        // Update the display of the cart and the notification badge after quantity change
        updateCartDisplay();
        updateNotificationBadge();
    }
}

// Render the cart items in the cart sidebar
function updateCartDisplay() {
    // Get the required DOM elements for the cart display inside the function
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    const cartTotalElement = document.getElementById('cart-total');

    // Exit the function if critical cart elements are not found
    if (!cartItemsContainer || !cartSubtotalElement || !cartTotalElement) return;

    cartItemsContainer.innerHTML = ''; // Clear the current list of cart items in the UI

    // If the cart is empty, display the "Your cart is empty" message
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty.</div>';
        // Reset subtotal and total display to zero
        cartSubtotalElement.textContent = formatVND(0);
        cartTotalElement.textContent = formatVND(0);
    } else {
        // If the cart is not empty, iterate through each item in the cart
        cart.forEach(item => {
            // Get the latest product info from allProductsData if available.
            // This is primarily to get the absolute latest price if it changed in the source JSON
            // since the item was added to the cart.
            const latestProductInfo = allProductsData.find(p => p.id === item.id);
            const itemDisplayPrice = latestProductInfo && latestProductInfo.price !== undefined
                                       ? latestProductInfo.price // Use the latest price from the data source
                                       : item.priceAtAddToCart; // Fallback to the price recorded when added

            // Create a div element for the cart item display
            const cartItemElement = document.createElement('div');
            cartItemElement.classList.add('cart-item');
            // Store the product ID in a data attribute on the cart item element
            cartItemElement.dataset.productId = item.id; 

            // Build the inner HTML for the cart item using details stored in the cart item object
            cartItemElement.innerHTML = `
                <img src="${item.imageUrl}" alt="${item.name}">
                <div class="item-details">
                    <h5>${item.name}</h5>
                    <div class="size">${item.size ? `Size: ${item.size}` : ''}</div> 
                    <div class="price">${formatVND(itemDisplayPrice)}</div> <!-- Display the calculated display price -->
                </div>
                <div class="quantity-controls">
                    <button class="decrease-quantity">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="increase-quantity">+</button>
                </div>
            `;
            // Add the created cart item element to the cart items container in the UI
            cartItemsContainer.appendChild(cartItemElement);
        });
         // After all cart items are added to the DOM, attach event listeners to the quantity controls
        cartItemsContainer.querySelectorAll('.decrease-quantity').forEach(button => {
            button.addEventListener('click', (event) => {
                // Get the product ID from the parent cart item element
                const productId = event.target.closest('.cart-item').dataset.productId;
                // Call updateQuantity to decrease the item's quantity
                updateQuantity(productId, -1);
            });
        });
         cartItemsContainer.querySelectorAll('.increase-quantity').forEach(button => {
            button.addEventListener('click', (event) => {
                // Get the product ID from the parent cart item element
                const productId = event.target.closest('.cart-item').dataset.productId;
                // Call updateQuantity to increase the item's quantity
                updateQuantity(productId, 1);
            });
        });

        // Recalculate and update the subtotal and total display
        updateTotals(); 
    }
}

// Calculate and update the subtotal and total displayed in the cart summary
function updateTotals() {
     // Get the required DOM elements for the total display inside the function
     const cartSubtotalElement = document.getElementById('cart-subtotal');
     const cartTotalElement = document.getElementById('cart-total');
     // Exit the function if critical elements are not found
     if (!cartSubtotalElement || !cartTotalElement) return;

    // Calculate the subtotal by reducing the cart array
    const subtotal = cart.reduce((sum, item) => {
         // Use the latest product price from allProductsData if available for calculation.
         // Fallback to the price stored when the item was added if latest data is not available.
        const latestProductInfo = allProductsData.find(p => p.id === item.id);
        const itemCalculationPrice = latestProductInfo && latestProductInfo.price !== undefined
                                     ? latestProductInfo.price
                                     : item.priceAtAddToCart;

        // Ensure the price used for calculation is a valid number, default to 0 if not.
        const safePrice = typeof itemCalculationPrice === 'number' ? itemCalculationPrice : 0;

        // Add the price of the current item (price * quantity) to the running sum
        return sum + safePrice * item.quantity; 
    }, 0); // Start sum at 0
    
    // Assuming shipping is FREE, the total is equal to the subtotal
    const total = subtotal; 

    // Update the text content of the subtotal and total elements with formatted VNĐ currency
    cartSubtotalElement.textContent = formatVND(subtotal);
    cartTotalElement.textContent = formatVND(total);
}

// Update the number displayed on the notification badge icon
function updateNotificationBadge() {
     // Get the notification badge DOM element inside the function
     const cartNotificationBadge = document.getElementById('cart-notification-badge');
     // Exit if the element is not found
     if (!cartNotificationBadge) return;

    // Calculate the total number of items in the cart (sum of quantities)
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    // Update the text content of the badge with the total item count
    cartNotificationBadge.textContent = totalItems;

    // Show the badge if there is at least one item, hide it otherwise
    if (totalItems > 0) {
        cartNotificationBadge.style.display = 'block'; 
    } else {
        cartNotificationBadge.style.display = 'none'; 
    }
}

// Toggle the visibility and state of the cart sidebar (primarily for mobile view)
function toggleCart(show) {
     // Get required DOM elements inside the function
     const cartSidebar = document.getElementById('cart-sidebar');
     const body = document.body; // body element is globally available
     // Exit if the cart sidebar element is not found
     if (!cartSidebar) return;

    // Determine whether to show or hide the cart based on the 'show' parameter
    if (show === true) {
        cartSidebar.classList.add('visible'); // Add 'visible' class to show the sidebar
        body.classList.add('cart-open'); // Add 'cart-open' class to body (useful for controlling main content overflow/layout)
    } else if (show === false) {
        cartSidebar.classList.remove('visible'); // Remove 'visible' class to hide the sidebar
        body.classList.remove('cart-open'); // Remove 'cart-open' class from body
    } else {
        // If 'show' is not specified, toggle the current visibility state
        cartSidebar.classList.toggle('visible');
        body.classList.toggle('cart-open');
    }
}

// Check if the current window width corresponds to a mobile screen size
function isMobile() {
    // Uses the same breakpoint (768px) as typically defined in CSS media queries
    return window.innerWidth <= 768; 
}

// Handle layout adjustments and sidebar visibility based on window resizing
function handleResize() {
     // Get required DOM elements inside the function
     const cartSidebar = document.getElementById('cart-sidebar');
     const body = document.body; // body element is globally available
      // Exit if the cart sidebar element is not found
     if (!cartSidebar) return;


    // On desktop screens (not mobile), ensure mobile-specific classes are removed
    // This prevents the cart from being hidden or body overflow being restricted on larger screens
    if (!isMobile()) {
        cartSidebar.classList.remove('visible'); 
        body.classList.remove('cart-open');
    }
     // Note: The desktop visibility/positioning of the cart sidebar is typically controlled by CSS rules
     // that apply based on screen width, not these JavaScript classes.
}


// Function to search for products within the allProductsData array
function searchProducts(searchTerm) {
     // Get the product grid element inside the function
     const popularProductsGrid = document.getElementById('popular-products-grid');
     if (!popularProductsGrid) return;

    // Normalize the search term for case-insensitive comparison
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    // If the search term is empty, render all products and exit
    if (normalizedSearch === '') {
        renderProducts(); // Call renderProducts to show all items from allProductsData
        return;
    }

    // Filter the allProductsData array based on the normalized search term
    // Products match if their name or size (if size exists) includes the search term
    const filteredProducts = allProductsData.filter(product => 
        (product.name && product.name.toLowerCase().includes(normalizedSearch)) || 
        (product.size && product.size.toLowerCase().includes(normalizedSearch)) 
    );

    popularProductsGrid.innerHTML = ''; // Clear the current content of the grid

    // If no products match the search term, display a "no results" message
    if (filteredProducts.length === 0) {
        popularProductsGrid.innerHTML = `
            <div class="no-results">
                <p>Không tìm thấy sản phẩm "${searchTerm}"</p>
            </div>
        `;
        return; // Exit the function
    }

    // If matching products are found, iterate through the filtered array and render them
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        // Store the product ID in a data attribute
        productCard.dataset.productId = product.id;

         // Get all product details directly from the filtered product object
         const displayPrice = product.price; 
         const displayRating = product.rating;
         const displayImageUrl = product.imageUrl;
         const displayProductUrl = product.productUrl;
         const displayName = product.name;
         const displaySize = product.size;

        // Generate the star rating HTML
        const starRatingHTML = Array(5).fill(0).map((_, i) =>
            `<i class="ri-star-fill" style="color: ${i < Math.floor(displayRating) ? '#ffb300' : '#e0e0e0'};"></i>`
        ).join('');

        // Build the inner HTML for the product card using the product data
        productCard.innerHTML = `
             <a href="${displayProductUrl}" class="product-link">
                <img src="${displayImageUrl}" alt="${displayName}">
            </a>
            <h4>${displayName}</h4>
             <div class="size">${displaySize ? `Size: ${displaySize}` : ''}</div>
            <div class="rating">
                ${starRatingHTML} (${displayRating || 0})
            </div>
            <div class="price">${formatVND(displayPrice)}</div> 
            <button class="add-to-cart-btn" data-product-id="${product.id}">Add to cart</button>
        `;
        // Add the product card to the grid
        popularProductsGrid.appendChild(productCard);
    });

    // After rendering filtered products, re-attach event listeners to their "Add to cart" buttons
    popularProductsGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', handleAddToCartClick); // Call the global handler
    });
}

// --- END GLOBAL/FILE SCOPE ---


// --- DOMContentLoaded - Initial setup and attaching event listeners ---
// This code runs only after the HTML document has been fully loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo từ defaultProducts trước
    allProductsData = [...defaultProducts];
    renderProducts();
    updateCartDisplay();
    
    // Sau đó fetch dữ liệu mới
    fetchProductsFromJsonAndCache()
        .then(fetchedData => {
            if (fetchedData && fetchedData.length > 0) {
                console.log('Loaded fresh data:', fetchedData);
                allProductsData = fetchedData;
                renderProducts();
                updateCartDisplay();
            } else {
                console.log('No data from fetch, keeping default products');
            }
        })
        .catch(error => {
            console.error('Error fetching product data:', error);
        });

    // --- Attach Event Listeners ---
    // Attach event listeners to various interactive elements, calling the global functions

    // Listeners for Cart Toggle (Notification icon and Close button)
    const notificationIcon = document.getElementById('notification-icon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', () => {
             // Call global helper functions to toggle cart visibility
            if (typeof isMobile === 'function' && isMobile()) { 
                toggleCart(true); 
            }
        });
    }

    const closeCartButton = document.getElementById('close-cart-button');
     if (closeCartButton) {
         closeCartButton.addEventListener('click', () => {
             // Call global helper functions to toggle cart visibility
             if (typeof isMobile === 'function' && isMobile()) { 
                 toggleCart(false); 
             }
         });
     }

    // Attach a listener to the window's resize event, calling the global handleResize function
    window.addEventListener('resize', handleResize); 

    // Add event listener for the search input field
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        let searchTimeout; // This variable is local to this DOMContentLoaded scope for managing debounce
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout); // Clear previous timeout on new input
            searchTimeout = setTimeout(() => {
                // Call the global searchProducts function after a delay
                searchProducts(e.target.value); 
            }, 300); // 300ms delay for debounce
        });
    }

    // --- Final Initializations ---
    // Call global functions to set initial state of badge and handle initial window size
    updateNotificationBadge(); 
    handleResize(); 


}); // End DOMContentLoaded block