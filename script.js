// PHIÊN BẢN SCRIPT.JS CUỐI CÙNG - SỬA LỖI "SWIPER IS NOT DEFINED"

document.addEventListener('DOMContentLoaded', () => {
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
    async function fetchProducts() { /*...*/ }
    function renderPopularProducts(productsToRender = allProductsData) { /*...*/ }
    function createGlobalPriceSelector() { /*...*/ }
    function updateAllProductPrices(priceKey) { /*...*/ }
    function handleAddToCartClick(event) { /*...*/ }
    function addToCart(product) { /*...*/ }
    function updateQuantity(productId, change) { /*...*/ }
    function updateCartDisplay() { /*...*/ }
    function updateTotals() { /*...*/ }
    function updateNotificationBadge() { /*...*/ }
    function toggleCart(show) { /*...*/ }
    function searchProducts(searchTerm) { /*...*/ }

    // --- Initialization ---
    async function initializeApp() {
        if (typeof Swiper !== 'undefined') {
            const swiper = new Swiper('.hero-swiper', {
                loop: true,
                autoplay: { delay: 3000, disableOnInteraction: false },
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            });
        } else {
            console.error('Thư viện Swiper chưa được tải.');
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

    // Dán lại toàn bộ các hàm đã bị rút gọn
    async function fetchProducts(){try{const t=await fetch("./gia_web_dura.json");if(!t.ok)throw new Error(`HTTP error! status: ${t.status}`);allProductsData=await t.json()}catch(t){console.error("Lỗi khi tải sản phẩm:",t),popularProductsGrid&&(popularProductsGrid.innerHTML="<p>Lỗi tải dữ liệu sản phẩm.</p>")}}
    function renderPopularProducts(t=allProductsData){if(popularProductsGrid&&(popularProductsGrid.innerHTML="",!t||0===t.length))return void(popularProductsGrid.innerHTML='<div class="no-results"><p>Không tìm thấy sản phẩm.</p></div>');const e=getCurrentUser(),o=e?e.phan_loai.toLowerCase():"guest";t.forEach(t=>{const e=document.createElement("div");e.classList.add("product-card");const a=t.id_san_pham,d=t.group_id;e.dataset.productId=a;let n="";"nhà máy tôn"===o||"cửa hàng"===o?n=`<div class="price">${formatVND(t["giá niêm yết"])}</div>`:"thầu thợ"===o?n=`<div class="price">${formatVND(t["Giá Thầu Thợ"])}</div>`:n=`<div class="price">${formatVND(t["Giá chủ nhà"])}</div>`,e.innerHTML=`<a href="product/index.html?id=${d}" class="product-link"><img src="${t["image sản phẩm"]}" alt="${t["Tên sản phẩm"]}" loading="lazy"></a><h4>${t["Tên sản phẩm"]}</h4><div class="size">Kích thước: ${t.kích thước}</div>${n}<button class="add-to-cart-btn" data-product-id="${a}">Thêm vào giỏ</button>`,popularProductsGrid.appendChild(e)}),document.querySelectorAll(".add-to-cart-btn").forEach(t=>t.addEventListener("click",handleAddToCartClick))}
    function createGlobalPriceSelector(){if(globalPriceSelectorContainer){const t=getCurrentUser(),e=t?t.phan_loai.toLowerCase():"guest";if(("nhà máy tôn"===e||"cửa hàng"===e)&&allProductsData.length>0){const t=new Set(["Giá chủ nhà","Giá Thầu Thợ","giá niêm yết"]);allProductsData.forEach(e=>{for(const o in e)o.startsWith("gói")&&t.add(o)});let e="";t.forEach(t=>{e+=`<option value="${t}">${t.replace(' Tháng 10"',"")}</option>`}),globalPriceSelectorContainer.innerHTML=`<label for="package-select">Chọn báo giá:</label><select id="package-select">${e}</select>`,globalPriceSelectorContainer.style.display="flex";const o=document.getElementById("package-select");o&&o.addEventListener("change",t=>updateAllProductPrices(t.target.value))}}}
    function updateAllProductPrices(t){document.querySelectorAll(".product-card").forEach(e=>{const o=e.dataset.productId,a=allProductsData.find(t=>t.id_san_pham===o),d=e.querySelector(".price");a&&d&&(d.textContent=formatVND(a[t]))})}
    function handleAddToCartClick(t){const e=t.target.dataset.productId,o=allProductsData.find(t=>t.id_san_pham===e);if(o){const t=getCurrentUser(),a=t?t.phan_loai.toLowerCase():"guest";let d="Giá chủ nhà";"thầu thợ"===a?d="Giá Thầu Thợ":"nhà máy tôn"!==a&&"cửa hàng"!==a||(d=(s=document.getElementById("package-select"))?s.value:"giá niêm yết");const n=o[d];if(null==n)return void alert("Sản phẩm cần báo giá riêng.");var s;const i={id:o.id_san_pham,name:o["Tên sản phẩm"],image:o["image sản phẩm"],size:o.kích thước,price:parseInt(n,10)};addToCart(i)}}
    function addToCart(t){const e=cart.find(e=>e.id===t.id),o=t.name.toLowerCase().includes("vis")?QUANTITY_STEP:1;if(e)e.quantity=Math.round(10*(e.quantity+o))/10;else{const e=t.name.toLowerCase().includes("vis")?MINIMUM_QUANTITY:1;cart.push({...t,quantity:e})}saveCart(),updateCartDisplay(),updateNotificationBadge()}
    function updateQuantity(t,e){const o=cart.find(e=>e.id===t);if(o){const t=o.name.toLowerCase().includes("vis")?QUANTITY_STEP:1,a=o.name.toLowerCase().includes("vis")?MINIMUM_QUANTITY:1;let d=o.quantity+e*t;d=Math.round(10*d)/10,d<a?cart=cart.filter(e=>e.id!==t):o.quantity=d}saveCart(),updateCartDisplay(),updateNotificationBadge()}
    function updateCartDisplay(){if(cartItemsContainer&&(cartItemsContainer.innerHTML="",0===cart.length))cartItemsContainer.innerHTML='<div class="empty-cart-message">Your cart is empty.</div>';else for(const t of cart){const e=document.createElement("div");e.classList.add("cart-item"),e.dataset.productId=t.id,e.innerHTML=`<div class="product-info"><img src="${t.image}" alt="${t.name}"><div class="item-details"><h5>${t.name}</h5><div class="size">Size: ${t.size}</div><div class="price">${formatVND(t.price)}</div></div></div><div class="quantity-controls"><button class="minus-btn">-</button><span class="quantity">${t.quantity}</span><button class="plus-btn">+</button></div>`,cartItemsContainer.appendChild(e)}cartItemsContainer.querySelectorAll(".minus-btn").forEach(t=>t.addEventListener("click",t=>updateQuantity(t.target.closest(".cart-item").dataset.productId,-1))),cartItemsContainer.querySelectorAll(".plus-btn").forEach(t=>t.addEventListener("click",t=>updateQuantity(t.target.closest(".cart-item").dataset.productId,1))),updateTotals()}
    function updateTotals(){const t=cart.reduce((t,e)=>t+e.price*e.quantity,0);let e=0;shippingInput&&(e=parseFloat(shippingInput.value.replace(/\./g,""))||0);const o=t+e;cartSubtotalElement&&(cartSubtotalElement.textContent=formatVND(t)),cartTotalElement&&(cartTotalElement.textContent=formatVND(o))}
    function updateNotificationBadge(){const t=Math.ceil(cart.reduce((t,e)=>t+e.quantity,0));cartNotificationBadge&&(cartNotificationBadge.textContent=t,cartNotificationBadge.style.display=t>0?"block":"none")}
    function toggleCart(t){t?(cartSidebar&&cartSidebar.classList.add("visible"),body&&body.classList.add("cart-open")):(cartSidebar&&cartSidebar.classList.remove("visible"),body&&body.classList.remove("cart-open"))}
    function searchProducts(t){const e=t.toLowerCase().trim();if(!e)return void renderPopularProducts(allProductsData);const o=allProductsData.filter(t=>t["Tên sản phẩm"].toLowerCase().includes(e)||t.kích thước&&t.kích thước.toLowerCase().includes(e));renderPopularProducts(o)}

    initializeApp();
});
