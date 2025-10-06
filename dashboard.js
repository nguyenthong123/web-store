document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements & Chart instances ---
    const filterBtn = document.getElementById('filterBtn');
    const resetBtn = document.getElementById('resetBtn');
    const chartsContainer = document.querySelector('.charts-grid');
    let charts = {}; // Object to store chart instances for easy updates

    // --- Data ---
    let allOrders = [];
    let allOrderDetails = {};
    let viewableOrders = [];
    let viewableDetails = {};

    // --- Helper Functions ---
    const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser'));
    const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) return null;
        return new Date(dateString);
    };

    // --- Chart Drawing Functions ---
    // (Bao gồm các hàm drawSalesAndDiscountChart, drawTopProductsChart, drawTopCustomersChart, drawSalesOverTimeChart)
    function drawSalesAndDiscountChart(orders) { /* ... */ }
    function drawTopProductsChart(orderDetails) { /* ... */ }
    function drawTopCustomersChart(orders) { /* ... */ }
    function drawSalesOverTimeChart(orders) { /* ... */ }
    
    function updateAllCharts(orders, orderDetails) {
        if (orders.length === 0) {
            chartsContainer.innerHTML = '<p class="no-data">Không có dữ liệu để hiển thị biểu đồ.</p>';
            return;
        }
         // Ensure containers are visible
        chartsContainer.innerHTML = `
            <div class="chart-card card"><h3>Doanh số & Sản lượng Chiết khấu</h3><canvas id="salesAndDiscountChart"></canvas></div>
            <div class="chart-card card"><h3>Top 5 Sản Phẩm Bán Chạy (Theo số lượng)</h3><canvas id="topProductsChart"></canvas></div>
            <div class="chart-card card"><h3>Top 5 Khách Hàng (Theo tổng tiền)</h3><canvas id="topCustomersChart"></canvas></div>
            <div class="chart-card card large"><h3>Doanh số theo Thời gian</h3><canvas id="salesOverTimeChart"></canvas></div>`;

        drawSalesAndDiscountChart(orders);
        drawTopProductsChart(orderDetails);
        drawTopCustomersChart(orders);
        drawSalesOverTimeChart(orders);
    }
    
    // --- Filter Logic ---
    function applyFilters() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const status = document.getElementById('statusFilter').value;
        const customer = document.getElementById('customerSearch').value.toLowerCase();

        let filteredOrders = viewableOrders.filter(order => {
            const orderDate = parseDate(order['thời gian lên đơn']);
            if (startDate && (!orderDate || orderDate < new Date(startDate))) return false;
            if (endDate && (!orderDate || orderDate > new Date(endDate))) return false;
            if (status && order['trạng thái'] !== status) return false;
            if (customer && !order['tên khách hàng'].toLowerCase().includes(customer)) return false;
            return true;
        });
        
        const filteredOrderIds = new Set(filteredOrders.map(o => o['id order']));
        const filteredDetails = {};
        Object.keys(viewableDetails).forEach(orderId => {
            if (filteredOrderIds.has(orderId)) {
                filteredDetails[orderId] = viewableDetails[orderId];
            }
        });

        updateAllCharts(filteredOrders, filteredDetails);
    }

    // --- Initialization ---
    try {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.mail) {
            document.querySelector('.dashboard-container').innerHTML = '<h1>Bạn cần đăng nhập để xem.</h1>';
            return;
        }

        const [ordersRes, detailsRes] = await Promise.all([
            fetch('./data/orderData.json'),
            fetch('./data/orderDetails.json')
        ]);
        let allOrdersRaw = await ordersRes.json();
        allOrderDetails = await detailsRes.json();

        allOrders = allOrdersRaw.filter(o => o && o['id order']).map(o => {
            const cleaned = {};
            for (const key in o) { cleaned[key.trim().replace(/:$/, '')] = o[key]; }
            return cleaned;
        });

        const userEmail = currentUser.mail.toLowerCase();
        const userType = currentUser.phan_loai;

        if (['ad mind', 'Nhà máy tôn'].includes(userType)) {
            viewableOrders = allOrders.filter(order => order['email người phụ trách'] && order['email người phụ trách'].toLowerCase() === userEmail);
        } else {
            viewableOrders = allOrders.filter(order => (order['email khách hàng'] && order['email khách hàng'].toLowerCase() === userEmail) || (order['tên khách hàng'] === currentUser.name));
        }

        const viewableOrderIds = new Set(viewableOrders.map(o => o['id order']));
        Object.keys(allOrderDetails).forEach(orderId => {
            if (viewableOrderIds.has(orderId)) {
                viewableDetails[orderId] = allOrderDetails[orderId];
            }
        });

        updateAllCharts(viewableOrders, viewableDetails);
        // Populate filters
        // ...

    } catch (error) {
        console.error("Lỗi khi khởi tạo dashboard:", error);
        chartsContainer.innerHTML = '<p class="no-data">Lỗi tải dữ liệu.</p>';
    }

    if (filterBtn) filterBtn.addEventListener('click', applyFilters);
    // ... resetBtn listener
});
// Paste full chart drawing functions here
