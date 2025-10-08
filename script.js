// PHIÊN BẢN SCRIPT.JS CUỐI CÙNG - ĐƠN GIẢN HÓA VÀ SỬA LỖI TOÀN DIỆN

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

    function handleAddToCartClick(event) { /* ... */ }
    function addToCart(product) { /* ... */ }
    function updateQuantity(productId, change) { /* ... */ }
    function updateCartDisplay() { /* ... */ }
    function updateTotals() { /* ... */ }
    function updateNotificationBadge() { /* ... */ }
    function toggleCart(show) { /* ... */ }
    function searchProducts(searchTerm) { /* ... */ }

    // Chạy ứng dụng
    initializeApp();

    // Dán lại các hàm bị thiếu để tránh lỗi
    function handleAddToCartClick(t){const e=t.target.dataset.productId,o=allProductsData.find(t=>t.id_san_pham===e);if(o){const t=getCurrentUser(),a=t?t.phan_loai.toLowerCase():"guest";let d="Giá chủ nhà";"thầu thợ"===a?d="Giá Thầu Thợ":"nhà máy tôn"!==a&&"cửa hàng"!==a||(d=(s=document.getElementById("package-select"))?s.value:"giá niêm yết");const n=o[d];if(null==n)return void alert("Sản phẩm cần báo giá riêng.");var s;const i={id:o.id_san_pham,name:o["Tên sản phẩm"],image:o["image sản phẩm"],size:o.kích thước,price:parseInt(n,10)};addToCart(i)}}
    function addToCart(t){const e=cart.find(e=>e.id===t.id),o=t.name.toLowerCase().includes("vis")?QUANTITY_STEP:1;if(e)e.quantity=Math.round(10*(e.quantity+o))/10;else{const e=t.name.toLowerCase().includes("vis")?MINIMUM_QUANTITY:1;cart.push({...t,quantity:e})}saveCart(),updateCartDisplay(),updateNotificationBadge()}
    function updateQuantity(t,e){const o=cart.find(e=>e.id===t);if(o){const t=o.name.toLowerCase().includes("vis")?QUANTITY_STEP:1,a=o.name.toLowerCase().includes("vis")?MINIMUM_QUANTITY:1;let d=o.quantity+e*t;d=Math.round(10*d)/10,d<a?cart=cart.filter(e=>e.id!==t):o.quantity=d}saveCart(),updateCartDisplay(),updateNotificationBadge()}
    function updateCartDisplay(){const t=document.getElementById("cart-items-container");if(t&&(t.innerHTML="",0===cart.length))t.innerHTML='<div class="empty-cart-message">Your cart is empty.</div>';else for(const e of cart){const o=document.createElement("div");o.classList.add("cart-item"),o.dataset.productId=e.id,o.innerHTML=`<div class="product-info"><img src="${e.image}" alt="${e.name}"><div class="item-details"><h5>${e.name}</h5><div class="size">Size: ${e.size}</div><div class="price">${formatVND(e.price)}</div></div></div><div class="quantity-controls"><button class="minus-btn">-</button><span class="quantity">${e.quantity}</span><button class="plus-btn">+</button></div>`,t.appendChild(o)}t.querySelectorAll(".minus-btn").forEach(t=>t.addEventListener("click",t=>updateQuantity(t.target.closest(".cart-item").dataset.productId,-1))),t.querySelectorAll(".plus-btn").forEach(t=>t.addEventListener("click",t=>updateQuantity(t.target.closest(".cart-item").dataset.productId,1))),updateTotals()}
    function updateTotals(){const t=document.getElementById("cart-subtotal"),e=document.getElementById("cart-total"),o=document.getElementById("shipping-input"),a=cart.reduce((t,e)=>t+e.price*e.quantity,0);let d=0;o&&(d=parseFloat(o.value.replace(/\./g,""))||0);const n=a+d;t&&(t.textContent=formatVND(a)),e&&(e.textContent=formatVND(n))}
    function updateNotificationBadge(){const t=document.getElementById("cart-notification-badge"),e=Math.ceil(cart.reduce((t,e)=>t+e.quantity,0));t&&(t.textContent=e,t.style.display=e>0?"block":"none")}
    function toggleCart(t){const e=document.getElementById("cart-sidebar"),o=document.body;t?(e&&e.classList.add("visible"),o&&o.classList.add("cart-open")):(e&&e.classList.remove("visible"),o&&o.classList.remove("cart-open"))}
    function searchProducts(t){const e=document.getElementById("popular-products-grid"),o=t.toLowerCase().trim();if(!o)return void renderPopularProducts(allProductsData);const a=allProductsData.filter(t=>t["Tên sản phẩm"].toLowerCase().includes(o)||t.kích thước&&t.kích thước.toLowerCase().includes(o));renderPopularProducts(a)}
});
