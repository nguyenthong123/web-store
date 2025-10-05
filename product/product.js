// NỘI DUNG MỚI HOÀN TOÀN CHO product.js - ĐÃ SỬA LỖI VÀ TỐI ƯU

document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. LẤY ID NHÓM SẢN PHẨM TỪ URL ---
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('id');

    if (!groupId) {
        document.querySelector('main').innerHTML = '<div class="container"><h1>Lỗi: Không tìm thấy ID nhóm sản phẩm.</h1></div>';
        return;
    }

    // --- 2. TẢI DỮ LIỆU TỪ CÁC FILE JSON ---
    try {
        const [productsResponse, pricesResponse] = await Promise.all([
            fetch('../data/products.json'),
            fetch('../gia_web_dura.json')
        ]);

        if (!productsResponse.ok || !pricesResponse.ok) {
            throw new Error("Không thể tải file dữ liệu.");
        }

        const productsData = await productsResponse.json();
        const allPricesData = await pricesResponse.json();

        const productGroup = productsData[groupId];
        const childProducts = allPricesData.filter(p => p.group_id === groupId);

        if (!productGroup || childProducts.length === 0) {
            throw new Error('Không tìm thấy thông tin sản phẩm hoặc giá.');
        }

        // --- 3. RENDER DỮ LIỆU LÊN TRANG ---
        renderProductPage(productGroup, childProducts);

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu trang chi tiết:", error);
        document.querySelector('main').innerHTML = `<div class="container"><h1>Lỗi khi tải dữ liệu trang chi tiết: ${error.message}</h1></div>`;
    }
});


function renderProductPage(group, children) {
    document.title = `${group.name} - DunVex & VLXD`;
    document.getElementById('product-name-breadcrumb').textContent = group.name;
    document.getElementById('product-category').textContent = group.category;
    document.getElementById('product-title').textContent = group.name;

    renderGallery(group.images);
    renderOptions(group, children);
    renderSpecs(group.specs);
    
    updatePriceDisplay(children[0]); 
    
    addEventListeners(group, children);
}

function renderGallery(images) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailScroller = document.querySelector('.thumbnail-scroller');
    
    // Kiểm tra xem các element có tồn tại không
    if (!mainImage || !thumbnailScroller) return;

    if (!images || images.length === 0) {
        // Ẩn khu vực gallery nếu không có ảnh
        const galleryContainer = document.querySelector('.hero-gallery');
        if (galleryContainer) galleryContainer.style.display = 'none';
        return;
    }

    mainImage.src = images[0];
    thumbnailScroller.innerHTML = images.map((imgUrl, index) => 
        `<img class="thumbnail ${index === 0 ? 'active' : ''}" src="${imgUrl}" alt="Thumbnail ${index + 1}">`
    ).join('');
}

function renderOptions(group, children) {
    document.querySelectorAll('.config-group').forEach(el => el.style.display = 'none');
    
    if (group.type === 'tam-xi-mang') {
        const quycachContainer = document.getElementById('quycach-options');
        const dodayContainer = document.getElementById('doday-options');
        
        if (quycachContainer && group.options.quycach && group.options.quycach.length > 0) {
            quycachContainer.parentElement.style.display = 'block';
            quycachContainer.innerHTML = group.options.quycach.map((qc, i) => `<button class="option-btn ${i === 0 ? 'selected' : ''}" data-value="${qc}">${qc}</button>`).join('');
        }

        if (dodayContainer && children.length > 0) {
            dodayContainer.parentElement.style.display = 'block';
            const thicknesses = children.map(child => {
                const match = child["Tên sản phẩm"].match(/(\d+[,.]?\d*)mm/);
                return match ? match[1] : null;
            }).filter(Boolean);

            dodayContainer.innerHTML = thicknesses.map((t, i) => `<button class="option-btn ${i === 0 ? 'selected' : ''}" data-value="${t}">${t}mm</button>`).join('');
        }
    } else if (group.type === 'vit') {
        const dodayContainer = document.getElementById('doday-options');
        if (dodayContainer) {
            const label = dodayContainer.parentElement.querySelector('label');
            if(label) label.textContent = 'Loại vít:';
            dodayContainer.parentElement.style.display = 'block';
            // Sử dụng "Tên sản phẩm" từ `gia_web_dura.json` làm tùy chọn
            dodayContainer.innerHTML = children.map((child, i) => `<button class="option-btn ${i === 0 ? 'selected' : ''}" data-value="${child.id_san_pham}">${child["Tên sản phẩm"]}</button>`).join('');
        }
    }
}

function renderSpecs(specs) {
    const specContainer = document.querySelector('#tab-specs .spec-table-container');
    if (!specs || specs.length === 0 || !specContainer) return;
    
    specContainer.innerHTML = specs.map(specGroup => `
        <details class="spec-group" open>
            <summary>${specGroup.title}</summary>
            <table class="spec-table">
                <thead>
                    <tr>${specGroup.headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${specGroup.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
        </details>
    `).join('');
}

function updatePriceDisplay(productData) {
    const priceElement = document.getElementById('product-price');
    if (!priceElement) return;

    if (!productData) {
        priceElement.textContent = 'Chọn tùy chọn';
        return;
    }
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userType = currentUser ? currentUser.phan_loai : 'guest';
    
    let priceKey = 'Giá chủ nhà';
    if (userType === 'Thầu Thợ') priceKey = 'Giá Thầu Thợ';
    
    const price = productData[priceKey];
    priceElement.textContent = price ? parseInt(price).toLocaleString('vi-VN') + ' đ' : 'Liên hệ';
}

function addEventListeners(group, children) {
    // --- Gallery ---
    const galleryScroller = document.querySelector('.thumbnail-scroller');
    // =================================================================
    // === SỬA LỖI Ở ĐÂY: Thêm kiểm tra 'if (galleryScroller)' ===
    // =================================================================
    if (galleryScroller) {
        const mainImage = document.getElementById('main-product-image');
        galleryScroller.addEventListener('click', (e) => {
            if (e.target.classList.contains('thumbnail')) {
                mainImage.src = e.target.src;
                galleryScroller.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    // --- Tabs ---
    const tabsContainer = document.querySelector('.tabs-container');
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            if(e.target.classList.contains('tab-link')) {
                const targetTab = e.target.dataset.tab;
                tabsContainer.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
                document.querySelectorAll('.tab-content .tab-pane').forEach(pane => {
                    pane.classList.toggle('active', pane.id === targetTab);
                });
            }
        });
    }

    // --- Option Buttons ---
    const heroConfig = document.querySelector('.hero-config');
    if (heroConfig) {
        heroConfig.addEventListener('click', (e) => {
            if (e.target.classList.contains('option-btn')) {
                const optionGroupDiv = e.target.parentElement;
                optionGroupDiv.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                
                // Cập nhật giá khi chọn
                if(optionGroupDiv.id === 'doday-options') {
                    if (group.type === 'vit'){
                        const selectedId = e.target.dataset.value;
                        const selectedProduct = children.find(c => c.id_san_pham === selectedId);
                        updatePriceDisplay(selectedProduct);
                    } else {
                         const selectedThickness = e.target.dataset.value;
                         const selectedProduct = children.find(c => c["Tên sản phẩm"].includes(selectedThickness + "mm"));
                         updatePriceDisplay(selectedProduct);
                    }
                }
            }
        });
    }
}
