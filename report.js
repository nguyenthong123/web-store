// PHIÊN BẢN REPORT.JS CUỐI CÙNG - XỬ LÝ DỮ LIỆU TRỐNG

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const ordersTbody = document.getElementById('orders-tbody');
    // ... (các khai báo khác giữ nguyên) ...

    // --- Data ---
    let allOrders = [];
    let allOrderDetails = {}; 
    let viewableOrders = [];

    // --- Helper Functions ---
    const getCurrentUser = () => { /* ... */ };
    const formatVND = (amount) => { /* ... */ };

    // --- Functions ---
    function renderTable(orders) {
        if (!ordersTbody) return;
        ordersTbody.innerHTML = '';
        if (!orders || orders.length === 0) {
            ordersTbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Không tìm thấy đơn hàng nào.</td></tr>`;
            return;
        }

        // Sắp xếp đơn hàng (đã an toàn)
        orders.sort((a, b) => (b['thời gian lên đơn'] || '').localeCompare(a['thời gian lên đơn'] || ''));

        orders.forEach(order => {
            const row = document.createElement('tr');
            
            // =================================================================
            // === SỬA LẠI Ở ĐÂY: Thêm '||' để xử lý giá trị undefined/trống ===
            // =================================================================
            row.innerHTML = `
                <td>${order['thời gian lên đơn'] || 'N/A'}</td>
                <td>${order['id order'] || 'N/A'}</td>
                <td>${order['tên khách hàng'] || 'N/A'}</td>
                <td>${formatVND(order['tổng phụ'])}</td>
                <td>${order['trạng thái'] || 'Chưa cập nhật'}</td> 
                <td>${order['email người phụ trách'] || 'N/A'}</td> 
                <td><button class="view-details-btn" data-order-id="${order['id order']}">Xem</button></td>
            `;
            ordersTbody.appendChild(row);
        });
    }
    
    function populateStatusFilter(orders) {
        const statusFilter = document.getElementById('statusFilter');
        if (!statusFilter) return;
        
        // Lọc bỏ các trạng thái rỗng hoặc chỉ có khoảng trắng
        const statuses = [...new Set(orders.map(o => o['trạng thái']).filter(s => s && s.trim() !== ''))];
        
        // Xóa các option cũ trước khi thêm mới
        statusFilter.innerHTML = '<option value="">-- Tất cả trạng thái --</option>';
        
        statuses.forEach(status => {
            statusFilter.innerHTML += `<option value="${status}">${status}</option>`;
        });
    }

    function applyFilters() {
        // ... (hàm này không cần thay đổi) ...
    }
    
    function showOrderDetails(orderId) {
        const order = viewableOrders.find(o => o['id order'] === orderId);
        // ... (hàm này đã xử lý tốt, chỉ cần sửa tên cột) ...
        // =================================================================
        // === SỬA LẠI TÊN CỘT Ở ĐÂY CHO ĐỒNG BỘ ===
        // =================================================================
        document.getElementById('modalOrderInfo').innerHTML = `
            <p><strong>Khách hàng:</strong> ${order['tên khách hàng']}</p>
            <p><strong>Ngày tạo:</strong> ${order['thời gian lên đơn'] || 'N/A'}</p>
            <p><strong>Trạng thái:</strong> ${order['trạng thái'] || 'Chưa cập nhật'}</p>
            <p><strong>Tổng tiền:</strong> ${formatVND(order['tổng phụ'])}</p>
        `;
        // ... (phần còn lại của hàm giữ nguyên) ...
    }

    // --- Initialization ---
    async function initializeApp() {
        try {
            // ... (phần tải dữ liệu và phân quyền giữ nguyên) ...
            
            // =================================================================
            // === SỬA LẠI Ở ĐÂY: Đổi tên cột `trạng thái:` thành `trạng thái` ===
            // =================================================================
            // Thay vì dùng trim() ở nhiều nơi, chúng ta sẽ chuẩn hóa dữ liệu ngay từ đầu.
            // Điều này giải quyết cả lỗi tên cột "trạng thái:"
            const [ordersRes, detailsRes] = await Promise.all([
                fetch('./data/orderData.json'),
                fetch('./data/orderDetails.json')
            ]);
            let allOrdersRaw = await ordersRes.json();
            allOrderDetails = await detailsRes.json();

            // Làm sạch dữ liệu: lọc bỏ đơn hàng lỗi và trim() key
            allOrders = allOrdersRaw
                .filter(order => order && order['id order'])
                .map(order => {
                    const cleanedOrder = {};
                    for (const key in order) {
                        cleanedOrder[key.trim().replace(':', '')] = order[key]; // Xóa dấu : và khoảng trắng
                    }
                    return cleanedOrder;
                });

            // ... (phần phân quyền giữ nguyên, giờ nó sẽ hoạt động đúng) ...

            renderTable(viewableOrders);
            populateStatusFilter(allOrders);

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu đơn hàng:", error);
            if (ordersTbody) ordersTbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Lỗi tải dữ liệu. Vui lòng kiểm tra lại file JSON.</td></tr>`;
        }
    }

    // --- Các Event Listeners và các hàm helper khác giữ nguyên ---
    
    // --- Dán đầy đủ các hàm đã được copy ở dưới đây ---
    const getCurrentUser = () => { const user = localStorage.getItem('currentUser'); return user ? JSON.parse(user) : null; };
    const formatVND = (amount) => { const numericAmount = parseFloat(amount); if (isNaN(numericAmount)) return 'N/A'; return numericAmount.toLocaleString('vi-VN') + ' đ'; };
    const filterBtn = document.getElementById('filterBtn');
    const resetBtn = document.getElementById('resetBtn');
    const modal = document.getElementById('detailsModal');
    const closeModalBtn = document.querySelector('.close-button');
    const customerSearchInput = document.getElementById('customerSearch');
    if(filterBtn) filterBtn.addEventListener('click', applyFilters);
    if(resetBtn) resetBtn.addEventListener('click', () => { if(document.getElementById('startDate')) document.getElementById('startDate').value = ''; if(document.getElementById('endDate')) document.getElementById('endDate').value = ''; if(document.getElementById('statusFilter')) document.getElementById('statusFilter').value = ''; if(customerSearchInput) customerSearchInput.value = ''; renderTable(viewableOrders); });
    if(closeModalBtn) closeModalBtn.addEventListener('click', () => modal.style.display = "none");
    if(modal) window.addEventListener('click', (event) => { if (event.target == modal) { modal.style.display = "none"; } });
    if(customerSearchInput) customerSearchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { applyFilters(); } });
    if(ordersTbody) ordersTbody.addEventListener('click', (event) => { if (event.target.classList.contains('view-details-btn')) { showOrderDetails(event.target.dataset.orderId); } });
    
    function applyFilters() { const startDate = document.getElementById('startDate').value; const endDate = document.getElementById('endDate').value; const status = document.getElementById('statusFilter').value; const customer = customerSearchInput.value.toLowerCase(); let filtered = viewableOrders.filter(order => { const orderDate = order['thời gian lên đơn']; if (!orderDate && (startDate || endDate)) return false; if (startDate && orderDate < startDate) return false; if (endDate && orderDate > endDate) return false; if (status && order['trạng thái'] !== status) return false; if (customer && !order['tên khách hàng'].toLowerCase().includes(customer) && !(order['số điện thoại'] && order['số điện thoại'].includes(customer))) return false; return true; }); renderTable(filtered); }
    function showOrderDetails(orderId) { const order = viewableOrders.find(o => o['id order'] === orderId); const details = allOrderDetails[orderId] || []; if (!order || !modal) return; document.getElementById('modalOrderId').textContent = orderId; document.getElementById('modalOrderInfo').innerHTML = `<p><strong>Khách hàng:</strong> ${order['tên khách hàng']}</p><p><strong>Ngày tạo:</strong> ${order['thời gian lên đơn'] || 'N/A'}</p><p><strong>Trạng thái:</strong> ${order['trạng thái'] || 'Chưa cập nhật'}</p><p><strong>Tổng tiền:</strong> ${formatVND(order['tổng phụ'])}</p>`; const detailsTbody = document.getElementById('modal-details-tbody'); detailsTbody.innerHTML = ''; if(details.length > 0){ details.forEach(item => { const row = `<tr><td>${item['tên sản phẩm']}</td><td>${item['số lượng']}</td><td>${item['đơn vị tính']}</td><td>${formatVND(item['tổng tiền'])}</td></tr>`; detailsTbody.innerHTML += row; }); } else { detailsTbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Không có chi tiết sản phẩm.</td></tr>`; } modal.style.display = "block"; }
    
    async function initializeApp() { try { const currentUser = getCurrentUser(); if (!currentUser || !currentUser.mail) { document.querySelector('.report-container').innerHTML = '<h1>Bạn cần đăng nhập để xem báo cáo.</h1>'; return; } const [ordersRes, detailsRes] = await Promise.all([fetch('./data/orderData.json'), fetch('./data/orderDetails.json')]); let allOrdersRaw = await ordersRes.json(); allOrderDetails = await detailsRes.json(); allOrders = allOrdersRaw.filter(order => order && order['id order']).map(order => { const cleanedOrder = {}; for (const key in order) { cleanedOrder[key.trim().replace(':', '')] = order[key]; } return cleanedOrder; }); const userEmail = currentUser.mail.toLowerCase(); const userType = currentUser.phan_loai; if (['ad mind', 'Nhà máy tôn', 'Cửa Hàng'].includes(userType)) { viewableOrders = allOrders.filter(order => order['email người phụ trách'] && order['email người phụ trách'].toLowerCase() === userEmail); } else { viewableOrders = allOrders.filter(order => order['email khách hàng'] && order['email khách hàng'].toLowerCase() === userEmail); } renderTable(viewableOrders); populateStatusFilter(allOrders); } catch (error) { console.error("Lỗi khi tải dữ liệu đơn hàng:", error); if (ordersTbody) ordersTbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Lỗi tải dữ liệu. Vui lòng kiểm tra lại file JSON.</td></tr>`; } }

    // Run the app
    initializeApp();
});
