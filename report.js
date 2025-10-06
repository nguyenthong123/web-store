// PHIÊN BẢN REPORT.JS CUỐI CÙNG - SỬA LỖI XỬ LÝ NGÀY THÁNG BỊ TRỐNG

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const ordersTbody = document.getElementById('orders-tbody');
    const filterBtn = document.getElementById('filterBtn');
    const resetBtn = document.getElementById('resetBtn');
    const modal = document.getElementById('detailsModal');
    const closeModalBtn = document.querySelector('.close-button');
    const customerSearchInput = document.getElementById('customerSearch');

    // --- Data ---
    let allOrders = [];
    let allOrderDetails = {}; 
    let viewableOrders = [];

    // --- Helper Functions ---
    const getCurrentUser = () => { /* ... */ };
    const formatVND = (amount) => { /* ... */ };
    
    // --- Hàm chuyển đổi ngày tháng an toàn ---
    const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        const parts = dateString.split('-');
        if (parts.length !== 3) return null;
        // Chuyển từ dd-MM-yyyy sang yyyy-MM-dd để new Date() hiểu đúng
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    };

    // --- Functions ---
    function renderTable(orders) {
        if (!ordersTbody) return;
        ordersTbody.innerHTML = '';
        if (orders.length === 0) {
            ordersTbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Không tìm thấy đơn hàng nào.</td></tr>`;
            return;
        }

        // =================================================================
        // === SỬA LỖI Ở ĐÂY: Sắp xếp an toàn, bỏ qua các đơn hàng thiếu ngày ===
        // =================================================================
        orders.sort((a, b) => {
            const dateA = parseDate(a['thời gian tạo đơn']);
            const dateB = parseDate(b['thời gian tạo đơn']);
            if (dateA && dateB) {
                return dateB - dateA; // Sắp xếp mới nhất lên đầu
            }
            return 0; // Giữ nguyên vị trí nếu ngày không hợp lệ
        });

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order['thời gian tạo đơn'] || 'N/A'}</td>
                <td>${order['id order']}</td>
                <td>${order['tên khách hàng']}</td>
                <td>${formatVND(order['tổng phụ'])}</td>
                <td>${order['trạng thái']}</td>
                <td>${order['tên người phụ trách']}</td>
                <td><button class="view-details-btn" data-order-id="${order['id order']}">Xem</button></td>
            `;
            ordersTbody.appendChild(row);
        });
    }
    
    function populateStatusFilter(orders) { /* ... */ }

    function applyFilters() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const status = document.getElementById('statusFilter').value;
        const customer = customerSearchInput.value.toLowerCase();

        let filtered = viewableOrders.filter(order => {
            // =================================================================
            // === SỬA LỖI Ở ĐÂY: Xử lý an toàn khi lọc theo ngày ===
            // =================================================================
            const orderDate = parseDate(order['thời gian tạo đơn']);
            if (!orderDate) return false; // Bỏ qua đơn hàng không có ngày hợp lệ khi lọc

            if (startDate && orderDate < new Date(startDate)) return false;
            if (endDate && orderDate > new Date(endDate)) return false;
            if (status && order['trạng thái'] !== status) return false;
            if (customer && !order['tên khách hàng'].toLowerCase().includes(customer) && !(order['số điện thoại'] && order['số điện thoại'].includes(customer))) return false;

            return true;
        });
        renderTable(filtered);
    }
    
    function showOrderDetails(orderId) { /* ... */ }

    // --- Initialization ---
    async function initializeApp() {
        try {
            const currentUser = getCurrentUser();
            if (!currentUser || !currentUser.mail) {
                document.querySelector('.report-container').innerHTML = '<h1>Bạn cần đăng nhập để xem báo cáo.</h1>';
                return;
            }

            const [ordersRes, detailsRes] = await Promise.all([
                fetch('./data/orderData.json'),
                fetch('./data/orderDetails.json')
            ]);
            allOrders = await ordersRes.json();
            allOrderDetails = await detailsRes.json();

            const userEmail = currentUser.mail.toLowerCase();
            const userType = currentUser.phan_loai;

            // Lọc bỏ các đơn hàng không có ID để tránh lỗi
            allOrders = allOrders.filter(order => order['id order']);

            if (['ad mind', 'Nhà máy tôn', 'Cửa Hàng'].includes(userType)) {
                viewableOrders = allOrders.filter(order => 
                    order['email người phụ trách'] && order['email người phụ trách'].toLowerCase() === userEmail
                );
            } else {
                viewableOrders = allOrders.filter(order => 
                    order['email khách hàng'] && order['email khách hàng'].toLowerCase() === userEmail
                );
            }
            
            renderTable(viewableOrders);
            populateStatusFilter(allOrders);

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu đơn hàng:", error);
            if (ordersTbody) ordersTbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Lỗi tải dữ liệu. Vui lòng kiểm tra lại file JSON.</td></tr>`;
        }
    }

    // --- Event Listeners ---
    // ...

    // --- Dán đầy đủ các hàm đã bị rút gọn vào đây ---
    const getCurrentUser = () => { const user = localStorage.getItem('currentUser'); return user ? JSON.parse(user) : null; };
    const formatVND = (amount) => { const numericAmount = parseFloat(amount); if (isNaN(numericAmount)) return 'N/A'; return numericAmount.toLocaleString('vi-VN') + ' đ'; };
    if(filterBtn) filterBtn.addEventListener('click', applyFilters);
    if(resetBtn) resetBtn.addEventListener('click', () => { if(document.getElementById('startDate')) document.getElementById('startDate').value = ''; if(document.getElementById('endDate')) document.getElementById('endDate').value = ''; if(document.getElementById('statusFilter')) document.getElementById('statusFilter').value = ''; if(customerSearchInput) customerSearchInput.value = ''; renderTable(viewableOrders); });
    if(closeModalBtn) closeModalBtn.addEventListener('click', () => modal.style.display = "none");
    if(modal) window.addEventListener('click', (event) => { if (event.target == modal) { modal.style.display = "none"; } });
    if(customerSearchInput) customerSearchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { applyFilters(); } });
    if(ordersTbody) ordersTbody.addEventListener('click', (event) => { if (event.target.classList.contains('view-details-btn')) { showOrderDetails(event.target.dataset.orderId); } });
    function populateStatusFilter(orders) { const statusFilter = document.getElementById('statusFilter'); if (!statusFilter) return; const statuses = [...new Set(orders.map(o => o['trạng thái']))]; statuses.forEach(status => { if(status) statusFilter.innerHTML += `<option value="${status}">${status}</option>`; }); }
    function showOrderDetails(orderId) { const order = viewableOrders.find(o => o['id order'] === orderId); const details = allOrderDetails[orderId] || []; if (!order || !modal) return; document.getElementById('modalOrderId').textContent = orderId; document.getElementById('modalOrderInfo').innerHTML = `<p><strong>Khách hàng:</strong> ${order['tên khách hàng']}</p><p><strong>Ngày tạo:</strong> ${order['thời gian tạo đơn']}</p><p><strong>Trạng thái:</strong> ${order['trạng thái']}</p><p><strong>Tổng tiền:</strong> ${formatVND(order['tổng phụ'])}</p>`; const detailsTbody = document.getElementById('modal-details-tbody'); detailsTbody.innerHTML = ''; if(details.length > 0){ details.forEach(item => { const row = `<tr><td>${item['tên sản phẩm']}</td><td>${item['số lượng']}</td><td>${item['đơn vị tính']}</td><td>${formatVND(item['tổng tiền'])}</td></tr>`; detailsTbody.innerHTML += row; }); } else { detailsTbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Không có chi tiết sản phẩm.</td></tr>`; } modal.style.display = "block"; }

    // Run the app
    initializeApp();
});
