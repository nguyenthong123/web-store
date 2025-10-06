// PHIÊN BẢN REPORT.JS HOÀN CHỈNH - ĐÃ SỬA LỖI VÀ TỐI ƯU MODAL

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
    let allOrderDetails = {}; // Chuyển sang object để truy cập nhanh hơn
    let viewableOrders = [];

    // --- Helper Functions ---
    const getCurrentUser = () => {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    };
    
    const formatVND = (amount) => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) return 'N/A';
        return numericAmount.toLocaleString('vi-VN') + ' đ';
    };

    // --- Initialization ---
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
        const detailsArray = await detailsRes.json();
        
        // Chuyển mảng chi tiết thành một object để tra cứu nhanh bằng id order
        detailsArray.forEach(item => {
            const orderId = item['id order'];
            if (!allOrderDetails[orderId]) {
                allOrderDetails[orderId] = [];
            }
            allOrderDetails[orderId].push(item);
        });

        // --- LOGIC PHÂN QUYỀN ---
        const userEmail = currentUser.mail.toLowerCase();
        const userType = currentUser.phan_loai;

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
        if (ordersTbody) ordersTbody.innerHTML = `<tr><td colspan="7">Lỗi tải dữ liệu. Vui lòng kiểm tra lại file JSON.</td></tr>`;
    }

    // --- Event Listeners ---
    if(filterBtn) filterBtn.addEventListener('click', applyFilters);
    if(resetBtn) resetBtn.addEventListener('click', () => {
        // Reset các ô input
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('statusFilter').value = '';
        customerSearchInput.value = '';
        renderTable(viewableOrders)
    });
    if(closeModalBtn) closeModalBtn.addEventListener('click', () => modal.style.display = "none");
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });
    // Thêm sự kiện nhấn Enter để tìm kiếm
    if(customerSearchInput) customerSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });


    // --- Functions ---
    function renderTable(orders) {
        if (!ordersTbody) return;
        ordersTbody.innerHTML = '';
        if (orders.length === 0) {
            ordersTbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Không tìm thấy đơn hàng nào.</td></tr>`;
            return;
        }

        // Sắp xếp đơn hàng theo thời gian mới nhất lên đầu
        orders.sort((a, b) => new Date(b['thời gian tạo đơn']) - new Date(a['thời gian tạo đơn']));

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(order['thời gian tạo đơn']).toLocaleDateString('vi-VN')}</td>
                <td>${order['id order']}</td>
                <td>${order['tên khách hàng']}</td>
                <td>${formatVND(order['tổng phụ'])}</td>
                <td>${order['trạng thái']}</td>
                <td>${order['tên người phụ trách']}</td>
                <td><button class="view-details-btn" data-order-id="${order['id order']}">Xem</button></td>
            `;
            ordersTbody.appendChild(row);
        });

        // Gắn sự kiện cho các nút "Xem" (dùng event delegation)
        ordersTbody.addEventListener('click', (event) => {
            if (event.target.classList.contains('view-details-btn')) {
                showOrderDetails(event.target.dataset.orderId);
            }
        });
    }
    
    function populateStatusFilter(orders) {
        const statusFilter = document.getElementById('statusFilter');
        if (!statusFilter) return;
        const statuses = [...new Set(orders.map(o => o['trạng thái']))];
        statuses.forEach(status => {
            if(status) statusFilter.innerHTML += `<option value="${status}">${status}</option>`;
        });
    }

    function applyFilters() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const status = document.getElementById('statusFilter').value;
        const customer = customerSearchInput.value.toLowerCase();

        let filtered = viewableOrders.filter(order => {
            // Chuyển đổi định dạng ngày từ dd-MM-yyyy sang yyyy-MM-dd để so sánh
            const orderDateParts = order['thời gian tạo đơn'].split('-');
            const orderDate = new Date(`${orderDateParts[2]}-${orderDateParts[1]}-${orderDateParts[0]}`);
            
            if (startDate && orderDate < new Date(startDate)) return false;
            if (endDate && orderDate > new Date(endDate)) return false;
            if (status && order['trạng thái'] !== status) return false;
            if (customer && !order['tên khách hàng'].toLowerCase().includes(customer)) return false;

            return true;
        });
        renderTable(filtered);
    }
    
    function showOrderDetails(orderId) {
        const order = viewableOrders.find(o => o['id order'] === orderId);
        const details = allOrderDetails[orderId] || []; // Lấy chi tiết từ object đã xử lý
        
        if (!order) return;
        
        document.getElementById('modalOrderId').textContent = orderId;
        document.getElementById('modalOrderInfo').innerHTML = `
            <p><strong>Khách hàng:</strong> ${order['tên khách hàng']}</p>
            <p><strong>Ngày tạo:</strong> ${order['thời gian tạo đơn']}</p>
            <p><strong>Trạng thái:</strong> ${order['trạng thái']}</p>
            <p><strong>Tổng tiền:</strong> ${formatVND(order['tổng phụ'])}</p>
        `;

        const detailsTbody = document.getElementById('modal-details-tbody');
        detailsTbody.innerHTML = '';
        if(details.length > 0){
            details.forEach(item => {
                const row = `
                    <tr>
                        <td>${item['tên sản phẩm']}</td>
                        <td>${item['số lượng']}</td>
                        <td>${item['đơn vị tính']}</td>
                        <td>${formatVND(item['tổng tiền'])}</td>
                    </tr>
                `;
                detailsTbody.innerHTML += row;
            });
        } else {
             detailsTbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Không có chi tiết sản phẩm cho đơn hàng này.</td></tr>`;
        }

        modal.style.display = "block";
    }
});
