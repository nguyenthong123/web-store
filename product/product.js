document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. LẤY ID SẢN PHẨM TỪ URL ---
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        document.querySelector('main').innerHTML = '<div class="container"><h1>Lỗi: Không tìm thấy ID sản phẩm.</h1></div>';
        return;
    }

    // --- 2. TẢI DỮ LIỆU TỪ CÁC FILE JSON ---
    try {
        // Tải đồng thời cả hai file để tăng tốc độ
        const [productsResponse, pricesResponse] = await Promise.all([
            fetch('../data/products.json'),
            fetch('../gia_web_dura.json')
        ]);

        const productsData = await productsResponse.json();
        const pricesData = await pricesResponse.json();

        // Tìm đúng sản phẩm và thông tin giá
        const product = productsData[productId];
        const priceInfo = pricesData.find(p => p.id_san_pham === productId);

        if (!product || !priceInfo) {
            throw new Error('Không tìm thấy thông tin sản phẩm hoặc giá.');
        }

        // --- 3. RENDER DỮ LIỆU LÊN TRANG ---
        renderProductPage(product, priceInfo);

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu trang chi tiết:", error);
        document.querySelector('main').innerHTML = `<div class="container"><h1>Lỗi: ${error.message}</h1></div>`;
    }
});

/**
 * Hàm chính để render toàn bộ trang
 */
function renderProductPage(product, priceInfo) {
    // Render các thông tin cơ bản
    document.title = `${product.name} - DunVex & VLXD`;
    document.getElementById('product-name-breadcrumb').textContent = product.name;
    document.getElementById('product-category').textContent = product.category;
    document.getElementById('product-title').textContent = product.name;

    // Render các phần phức tạp hơn
    renderGallery(product.images);
    renderOptions(product.options, product.type);
    renderPrice(priceInfo);
    renderSpecs(product.specs);

    // Gắn các sự kiện tương tác
    addEventListeners(priceInfo);
}

/**
 * Render gallery ảnh và thumbnails
 */
function renderGallery(images) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailScroller = document.querySelector('.thumbnail-scroller');
    
    if (!images || images.length === 0) return;

    mainImage.src = images[0];
    thumbnailScroller.innerHTML = images.map((imgUrl, index) => 
        `<img class="thumbnail ${index === 0 ? 'active' : ''}" src="${imgUrl}" alt="Thumbnail ${index + 1}">`
    ).join('');
}

/**
 * Render các tùy chọn (quy cách, độ dày...) dựa vào loại sản phẩm
 */
function renderOptions(options, productType) {
    const quycachContainer = document.getElementById('quycach-options');
    const dodayContainer = document.getElementById('doday-options');

    document.querySelectorAll('.config-group').forEach(group => group.style.display = 'none');

    if (productType === 'tam-xi-mang') {
        if (options.quycach) {
            quycachContainer.parentElement.style.display = 'block';
            quycachContainer.innerHTML = options.quycach.map((qc, index) => 
                `<button class="option-btn ${index === 0 ? 'selected' : ''}" data-value="${qc}">${qc}</button>`
            ).join('');
        }
        if (options.doday) {
            dodayContainer.parentElement.style.display = 'block';
            dodayContainer.innerHTML = options.doday.map((dd, index) => 
                `<button class="option-btn ${index === 0 ? 'selected' : ''}" data-value="${dd}">${dd}mm</button>`
            ).join('');
        }
    } else if (productType === 'vit') {
         if (options.doday) { // "doday" ở đây tương ứng với "độ dài"
            dodayContainer.parentElement.style.display = 'block';
            dodayContainer.querySelector('label').textContent = 'Độ dài (mm):'; // Đổi nhãn
            dodayContainer.innerHTML += options.doday.map((item, index) => 
                `<button class="option-btn ${index === 0 ? 'selected' : ''}" data-value="${item.value}">${item.text}</button>`
            ).join('');
        }
    }
    // Bạn có thể thêm `else if (productType === 'tam-van-go')` ở đây cho sản phẩm sau này
}

/**
 * Render giá sản phẩm dựa vào trạng thái đăng nhập
 */
function renderPrice(priceInfo) {
    const priceElement = document.getElementById('product-price');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userType = currentUser ? currentUser.phan_loai : 'guest';
    
    let priceKey = 'Giá chủ nhà';
    if (userType === 'Thầu Thợ') priceKey = 'Giá Thầu Thợ';
    // Mặc định cho các nhóm khác là giá chủ nhà, có thể thay đổi
    
    const price = priceInfo[priceKey];
    priceElement.textContent = price ? parseInt(price).toLocaleString('vi-VN') + ' đ' : 'Liên hệ';
}

/**
 * Render bảng thông số kỹ thuật
 */
function renderSpecs(specs) {
    if (!specs || specs.length === 0) return;
    const specTable = document.querySelector('#tab-specs .spec-table tbody');
    const specGroup = specs[0]; // Giả sử chỉ có 1 bảng spec
    
    // Tạo header
    const headerRow = `<tr>${specGroup.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    specTable.previousElementSibling.innerHTML = headerRow;

    // Tạo các dòng dữ liệu
    specTable.innerHTML = specGroup.rows.map(row => 
        `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
}


/**
 * Gắn tất cả các sự kiện cho các element tương tác
 */
function addEventListeners(priceInfo) {
    // --- Gallery ---
    const mainImage = document.getElementById('main-product-image');
    document.querySelectorAll('.thumbnail-scroller .thumbnail').forEach(thumb => {
        thumb.addEventListener('click', () => {
            mainImage.src = thumb.src;
            document.querySelectorAll('.thumbnail-scroller .thumbnail').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });

    // --- Tabs ---
    const tabLinks = document.querySelectorAll('.tabs-container .tab-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetTab = link.dataset.tab;
            tabLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.querySelectorAll('.tab-content .tab-pane').forEach(pane => {
                pane.classList.toggle('active', pane.id === targetTab);
            });
        });
    });

    // --- Option Buttons (Cần dùng event delegation vì nút được tạo động) ---
    document.querySelectorAll('.options-group').forEach(group => {
        group.addEventListener('click', (event) => {
            if (event.target.classList.contains('option-btn')) {
                group.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
                event.target.classList.add('selected');
                // TƯƠNG LAI: Cập nhật giá dựa trên lựa chọn ở đây
            }
        });
    });
}
