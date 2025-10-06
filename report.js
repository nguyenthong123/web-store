document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const ordersTbody = document.getElementById('orders-tbody');
    const filterBtn = document.getElementById('filterBtn');
    const resetBtn = document.getElementById('resetBtn');
    const modal = document.getElementById('detailsModal');
    const closeModalBtn = document.querySelector('.close-button');

    // --- Data ---
    let allOrders = [];
    let allOrderDetails = [];
    let viewableOrders = [];

    // --- Helper ---
    const getCurrentUser = () => {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    };

    // --- Initialization ---
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            document.querySelector('.report-container').innerHTML = '<h1>Bạn cần đăng nhập để xem báo cáo.</h1>';
            return;
        }

        // Tải đồng thời cả 2 file JSON
        const [ordersRes, detailsRes] = await Promise.all([
            fetch('./data/orderData.json'),
            fetch('./data/orderDetails.json')
        ]);
        allOrders = await ordersRes.json();
        allOrderDetails = await detailsRes.json();

        // --- LOGIC PHÂN QUYỀN ---
        const userEmail = currentUser.mail.toLowerCase();
        const userType = currentUser.phan_loai;

        if (['ad mind', 'Nhà máy tôn', 'Cửa Hàng'].includes(userType)) {
            // Admin, NMT, Cửa hàng có thể xem các đơn hàng họ phụ trách
            viewableOrders = allOrders.filter(order => 
                (order['email người phụ trách'] && order['email người phụ trách'].toLowerCase() === userEmail)
            );
        } else {
             // Các loại khác (khách hàng) chỉ xem được đơn của chính mình
            viewableOrders = allOrders.filter(order => 
                (order['email khách hàng'] && order['email khách hàng'].toLowerCase() === userEmail)
            );
        }
        
        renderTable(viewableOrders);
        populateStatusFilter(allOrders);

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu đơn hàng:", error);
        ordersTbody.innerHTML = `<tr><td colspan="7">Lỗi tải dữ liệu.</td></tr>`;
    }

    // --- Event Listeners ---
    filterBtn.addEventListener('click', applyFilters);
    resetBtn.addEventListener('click', () => renderTable(viewableOrders));
    closeModalBtn.addEventListener('click', () => modal.style.display = "none");
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });

    // --- Functions ---
    function renderTable(orders) {
        ordersTbody.innerHTML = '';
        if (orders.length === 0) {
            ordersTbody.innerHTML = `<tr><td colspan="7">Không tìm thấy đơn hàng nào.</td></tr>`;
            return;
        }
        orders.forEach(order => {
            const row = `
                <tr>
                    <td>${order['thời gian tạo đơn']}</td>
                    <td>${order['id order']}</td>
                    <td>${order['tên khách hàng']}</td>
                    <td>${parseFloat(order['tổng phụ']).toLocaleString('vi-VN')} đ</td>
                    <td>${order['trạng thái']}</td>
                    <td>${order['tên người phụ trách']}</td>
                    <td><button class="view-details-btn" data-order-id="${order['id order']}">Xem</button></td>
                </tr>
            `;
            ordersTbody.innerHTML += row;
        });

        // Gắn sự kiện cho các nút "Xem"
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', showOrderDetails);
        });
    }
    
    function populateStatusFilter(orders) {
        const statuses = [...new Set(orders.map(o => o['trạng thái']))];
        const statusFilter = document.getElementById('statusFilter');
        statuses.forEach(status => {
            if(status) statusFilter.innerHTML += `<option value="${status}">${status}</option>`;
        });
    }

    function applyFilters() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const status = document.getElementById('statusFilter').value;
        const customer = document.getElementById('customerSearch').value.toLowerCase();

        let filtered = viewableOrders.filter(order => {
            const orderDate = new Date(order['thời gian tạo đơn'].split('-').reverse().join('-'));
            
            if (startDate && orderDate < new Date(startDate)) return false;
            if (endDate && orderDate > new Date(endDate)) return false;
            if (status && order['trạng thái'] !== status) return false;
            if (customer && !order['tên khách hàng'].toLowerCase().includes(customer)) return false;

            return true;
        });
        renderTable(filtered);
    }
    
    function showOrderDetails(event) {
        const orderId = event.target.dataset.orderId;
        const order = viewableOrders.find(o => o['id order'] === orderId);
        const details = allOrderDetails.filter(d => d['id order'] === orderId);
        
        if (!order) return;
        
        document.getElementById('modalOrderId').textContent = orderId;
        // Hiển thị thêm thông tin chung của đơn hàng
        document.getElementById('modalOrderInfo').innerHTML = `
            <p><strong>Khách hàng:</strong> ${order['tên khách hàng']}</p>
            <p><strong>Trạng thái:</strong> ${order['trạng thái']}</p>
        `;

        const detailsTbody = document.getElementById('modal-details-tbody');
        detailsTbody.innerHTML = '';
        details.forEach(item => {
            const row = `
                <tr>
                    <td>${item['tên sản phẩm']}</td>
                    <td>${item['số lượng']}</td>
                    <td>${item['đơn vị tính']}</td>
                    <td>${parseFloat(item['tổng tiền']).toLocaleString('vi-VN')} đ</td>
                </tr>
            `;
            detailsTbody.innerHTML += row;
        });

        modal.style.display = "block";
    }
});
