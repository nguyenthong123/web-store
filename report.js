// PHIÊN BẢN REPORT.JS - TINH CHỈNH GIAO DIỆN BẢNG

document.addEventListener('DOMContentLoaded', async () => {
    // --- Các khai báo DOM Elements, Data... giữ nguyên ---
    // ...

    // --- Helper Functions ---
    const getCurrentUser = () => { /* ... */ };
    
    // =================================================================
    // === CẬP NHẬT HÀM NÀY: Trả về chuỗi rỗng thay vì 'N/A' ===
    // =================================================================
    const formatVND = (amount) => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount === 0) return ''; // Trả về chuỗi rỗng nếu không phải số hoặc bằng 0
        return numericAmount.toLocaleString('vi-VN') + ' đ';
    };
    
    const parseDate = (dateString) => { /* ... */ };

    // --- Functions ---
    function renderTable(orders) {
        if (!ordersTbody) return;
        ordersTbody.innerHTML = '';
        if (orders.length === 0) {
            ordersTbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Không tìm thấy đơn hàng nào.</td></tr>`;
            return;
        }

        orders.sort((a, b) => (b['thời gian lên đơn'] || '').localeCompare(a['thời gian lên đơn'] || ''));

        orders.forEach(order => {
            const row = document.createElement('tr');
            
            // =================================================================
            // === CẬP NHẬT Ở ĐÂY: Thêm cột 'số tiền còn lại' và xử lý giá trị trống ===
            // =================================================================
            row.innerHTML = `
                <td>${order['thời gian lên đơn'] || ''}</td>
                <td>${order['id order'] || ''}</td>
                <td>${order['tên khách hàng'] || ''}</td>
                <td>${formatVND(order['tổng phụ'])}</td>
                <td>${formatVND(order['số tiền còn lại trong đơn'])}</td> 
                <td>${order['trạng thái'] || ''}</td> 
                <td>${order['email người phụ trách'] || ''}</td> 
                <td><button class="view-details-btn" data-order-id="${order['id order']}">Xem</button></td>
            `;
            ordersTbody.appendChild(row);
        });
    }
    
    function populateStatusFilter(orders) { /* ... giữ nguyên ... */ }
    function applyFilters() { /* ... giữ nguyên ... */ }
    function showOrderDetails(orderId) { /* ... giữ nguyên ... */ }
    function populateCustomerDatalist(orders) { /* ... giữ nguyên ... */ }

    // --- Initialization ---
    async function initializeApp() { /* ... giữ nguyên ... */ }

    // --- Các Event Listeners giữ nguyên ---
    // ...

    // --- Dán đầy đủ các hàm đã bị rút gọn vào đây ---
    const ordersTbody = document.getElementById('orders-tbody');
    const filterBtn = document.getElementById('filterBtn');
    const resetBtn = document.getElementById('resetBtn');
    const modal = document.getElementById('detailsModal');
    const closeModalBtn = document.querySelector('.close-button');
    const customerSearchInput = document.getElementById('customerSearch');
    const getCurrentUser = () => { const user = localStorage.getItem('currentUser'); return user ? JSON.parse(user) : null; };
    const parseDate = (dateString) => { if (!dateString || typeof dateString !== 'string') return null; const parts = dateString.split('-'); if (parts.length !== 3) return null; return new Date(parts[0].length === 4 ? dateString : `${parts[2]}-${parts[1]}-${parts[0]}`); };
    function populateStatusFilter(orders) { const statusFilter = document.getElementById('statusFilter'); if (!statusFilter) return; const statuses = [...new Set(orders.map(o => o['trạng thái']).filter(s => s && s.trim() !== ''))]; statusFilter.innerHTML = '<option value="">-- Tất cả trạng thái --</option>'; statuses.forEach(status => { statusFilter.innerHTML += `<option value="${status}">${status}</option>`; }); }
    function applyFilters() { const startDate = document.getElementById('startDate').value; const endDate = document.getElementById('endDate').value; const status = document.getElementById('statusFilter').value; const customer = customerSearchInput.value.toLowerCase(); let filtered = viewableOrders.filter(order => { const orderDate = parseDate(order['thời gian lên đơn']); if (startDate && (!orderDate || orderDate < new Date(startDate))) return false; if (endDate && (!orderDate || orderDate > new Date(endDate))) return false; if (status && order['trạng thái'] !== status) return false; if (customer && !order['tên khách hàng'].toLowerCase().includes(customer) && !(order['số điện thoại'] && order['số điện thoại'].includes(customer))) return false; return true; }); renderTable(filtered); }
    function showOrderDetails(orderId) { const order = viewableOrders.find(o => o['id order'] === orderId); const details = allOrderDetails[orderId] || []; if (!order || !modal) return; document.getElementById('modalOrderId').textContent = orderId; document.getElementById('modalOrderInfo').innerHTML = `<p><strong>Khách hàng:</strong> ${order['tên khách hàng']}</p><p><strong>Ngày tạo:</strong> ${order['thời gian lên đơn'] || ''}</p><p><strong>Trạng thái:</strong> ${order['trạng thái'] || ''}</p><p><strong>Tổng tiền:</strong> ${formatVND(order['tổng phụ'])}</p><p><strong>Còn lại:</strong> ${formatVND(order['số tiền còn lại trong đơn'])}</p>`; const detailsTbody = document.getElementById('modal-details-tbody'); detailsTbody.innerHTML = ''; if(details.length > 0){ details.forEach(item => { const row = `<tr><td>${item['tên sản phẩm']}</td><td>${item['số lượng']}</td><td>${item['đơn vị tính']}</td><td>${formatVND(item['tổng tiền'])}</td></tr>`; detailsTbody.innerHTML += row; }); } else { detailsTbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Không có chi tiết sản phẩm.</td></tr>`; } modal.style.display = "block"; }
    function populateCustomerDatalist(orders) { const datalist = document.getElementById('customer-list'); if (!datalist) return; const customerNames = [...new Set(orders.map(o => o['tên khách hàng']))]; datalist.innerHTML = ''; customerNames.forEach(name => { if (name) datalist.innerHTML += `<option value="${name}"></option>`; }); }
    async function initializeApp() { try { const currentUser = getCurrentUser(); if (!currentUser || !currentUser.mail) { document.querySelector('.report-container').innerHTML = '<h1>Bạn cần đăng nhập để xem báo cáo.</h1>'; return; } const [ordersRes, detailsRes] = await Promise.all([fetch('./data/orderData.json'), fetch('./data/orderDetails.json')]); let allOrdersRaw = await ordersRes.json(); allOrderDetails = await detailsRes.json(); allOrders = allOrdersRaw.filter(order => order && order['id order']).map(order => { const cleanedOrder = {}; for (const key in order) { cleanedOrder[key.trim().replace(/:$/, '')] = order[key]; } return cleanedOrder; }); const userEmail = currentUser.mail.toLowerCase(); const userType = currentUser.phan_loai; if (['ad mind', 'Nhà máy tôn'].includes(userType)) { viewableOrders = allOrders.filter(order => order['email người phụ trách'] && order['email người phụ trách'].toLowerCase() === userEmail); } else { viewableOrders = allOrders.filter(order => (order['email khách hàng'] && order['email khách hàng'].toLowerCase() === userEmail) || (order['tên khách hàng'] === currentUser.name)); } if (userType === 'ad mind') { populateCustomerDatalist(viewableOrders); } else if (['Nhà máy tôn', 'Cửa Hàng'].includes(userType) || !['ad mind'].includes(userType)) { if (customerSearchInput) { customerSearchInput.value = currentUser.name; customerSearchInput.disabled = true; viewableOrders = viewableOrders.filter(order => order['tên khách hàng'] === currentUser.name); } } renderTable(viewableOrders); populateStatusFilter(viewableOrders); } catch (error) { console.error("Lỗi khi tải dữ liệu đơn hàng:", error); if (ordersTbody) ordersTbody.innerHTML = `<tr><td colspan="8">Lỗi tải dữ liệu.</td></tr>`; } }
    
    if(filterBtn) filterBtn.addEventListener('click', applyFilters);
    if(resetBtn) resetBtn.addEventListener('click', () => { if(document.getElementById('startDate')) document.getElementById('startDate').value = ''; if(document.getElementById('endDate')) document.getElementById('endDate').value = ''; if(document.getElementById('statusFilter')) document.getElementById('statusFilter').value = ''; if(customerSearchInput) { const currentUser = getCurrentUser(); if(!currentUser || currentUser.phan_loai === 'ad mind') { customerSearchInput.value = ''; } } initializeApp(); });
    if(closeModalBtn) closeModalBtn.addEventListener('click', () => modal.style.display = "none");
    if(modal) window.addEventListener('click', (event) => { if (event.target == modal) { modal.style.display = "none"; } });
    if(customerSearchInput) customerSearchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { applyFilters(); } });
    if(ordersTbody) ordersTbody.addEventListener('click', (event) => { if (event.target.classList.contains('view-details-btn')) { showOrderDetails(event.target.dataset.orderId); } });

    // Run the app
    initializeApp();
});
