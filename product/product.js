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

        // Tìm thông tin nhóm sản phẩm và danh sách các sản phẩm con thuộc nhóm đó
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
    
    // Hiển thị giá mặc định của sản phẩm đầu tiên trong nhóm
    updatePriceDisplay(children[0]); 
    
    addEventListeners(group, children);
}

function renderGallery(images) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailScroller = document.querySelector('.thumbnail-scroller');
    if (!images || images.length === 0) return;

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
        
        // Render Quy cách (nếu có)
        if (group.options.quycach && group.options.quycach.length > 0) {
            quycachContainer.parentElement.style.display = 'block';
            quycachContainer.innerHTML = group.options.quycach.map((qc, i) => `<button class="option-btn ${i === 0 ? 'selected' : ''}" data-value="${qc}">${qc}</button>`).join('');
        }

        // Render Độ dày từ danh sách sản phẩm con
        if (children.length > 0) {
            dodayContainer.parentElement.style.display = 'block';
            // Trích xuất độ dày từ tên sản phẩm
            const thicknesses = children.map(child => {
                const match = child["Tên sản phẩm"].match(/(\d+[,.]?\d*)mm/);
                return match ? match[1] : null;
            }).filter(Boolean); // Lọc bỏ các giá trị null

            dodayContainer.innerHTML = thicknesses.map((t, i) => `<button class="option-btn ${i === 0 ? 'selected' : ''}" data-value="${t}">${t}mm</button>`).join('');
        }
    } else if (group.type === 'vit') {
        const dodayContainer = document.getElementById('doday-options');
        dodayContainer.parentElement.querySelector('label').textContent = 'Loại vít:';
        dodayContainer.parentElement.style.display = 'block';
        dodayContainer.innerHTML = children.map((child, i) => `<button class="option-btn ${i===0 ? 'selected' : ''}" data-value="${child.id_san_pham}">${child["Tên sản phẩm"]}</button>`).join('');
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
    if (!productData) {
        priceElement.textContent = 'Chọn tùy chọn';
        return;
    }
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userType = currentUser ? currentUser.phan_loai : 'guest';
    
    let priceKey = 'Giá chủ nhà';
    if (userType === 'Thầu Thợ') priceKey = 'Giá Thầu Thợ';
    // Mặc định cho các nhóm khác là giá chủ nhà
    
    const price = productData[priceKey];
    priceElement.textContent = price ? parseInt(price).toLocaleString('vi-VN') + ' đ' : 'Liên hệ';
}


function addEventListeners(group, children) {
    // --- Gallery ---
    const mainImage = document.getElementById('main-product-image');
    document.querySelector('.thumbnail-scroller').addEventListener('click', (e) => {
        if (e.target.classList.contains('thumbnail')) {
            mainImage.src = e.target.src;
            document.querySelectorAll('.thumbnail-scroller .thumbnail').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
        }
    });

    // --- Tabs ---
    document.querySelector('.tabs-container').addEventListener('click', (e) => {
        if(e.target.classList.contains('tab-link')) {
            const targetTab = e.target.dataset.tab;
            document.querySelectorAll('.tabs-container .tab-link').forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('.tab-content .tab-pane').forEach(pane => {
                pane.classList.toggle('active', pane.id === targetTab);
            });
        }
    });

    // --- Option Buttons ---
    document.querySelector('.hero-config').addEventListener('click', (e) => {
        if (e.target.classList.contains('option-btn')) {
            const group = e.target.parentElement;
            group.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            
            // Cập nhật giá khi chọn
            if(group.id === 'doday-options') {
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
