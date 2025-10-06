document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements & Chart instances ---
    const filterBtn = document.getElementById('filterBtn');
    const resetBtn = document.getElementById('resetBtn');
    let charts = {}; // Object để lưu các biểu đồ, giúp cập nhật dễ dàng

    // --- Data ---
    let allOrders = [];
    let allOrderDetails = {};

    // --- Helper Functions ---
    const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser'));
    
    // --- Chart Drawing Functions ---
    function drawSalesAndDiscountChart(orders) {
        const ctx = document.getElementById('salesAndDiscountChart');
        if (!ctx) return;

        const totalSales = orders.reduce((sum, order) => sum + (parseFloat(order['tổng phụ']) || 0), 0);
        const totalDiscountable = orders.reduce((sum, order) => sum + (parseFloat(order['số tiền còn lại trong đơn']) || 0), 0);
        
        if (charts.sales) charts.sales.destroy();
        charts.sales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Doanh số (Tổng tiền)', 'Sản lượng Chiết khấu (Còn lại)'],
                datasets: [{
                    label: 'Tổng giá trị (VNĐ)',
                    data: [totalSales, totalDiscountable],
                    backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(75, 192, 192, 0.6)'],
                    borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'],
                    borderWidth: 1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function drawTopProductsChart(orderDetails) {
        const ctx = document.getElementById('topProductsChart');
        if (!ctx) return;

        const productSales = {};
        Object.values(orderDetails).flat().forEach(item => {
            const productName = item['tên sản phẩm'];
            const quantity = parseFloat(item['số lượng']) || 0;
            productSales[productName] = (productSales[productName] || 0) + quantity;
        });

        const topProducts = Object.entries(productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        if (charts.topProducts) charts.topProducts.destroy();
        charts.topProducts = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: topProducts.map(p => p[0]),
                datasets: [{
                    label: 'Số lượng bán',
                    data: topProducts.map(p => p[1]),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function drawTopCustomersChart(orders) {
        const ctx = document.getElementById('topCustomersChart');
        if (!ctx) return;

        const customerSales = {};
        orders.forEach(order => {
            const customerName = order['tên khách hàng'];
            const total = parseFloat(order['tổng phụ']) || 0;
            customerSales[customerName] = (customerSales[customerName] || 0) + total;
        });

        const topCustomers = Object.entries(customerSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        
        if (charts.topCustomers) charts.topCustomers.destroy();
        charts.topCustomers = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topCustomers.map(c => c[0]),
                datasets: [{
                    label: 'Tổng doanh số (VNĐ)',
                    data: topCustomers.map(c => c[1]),
                    backgroundColor: 'rgba(255, 159, 64, 0.6)'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
        });
    }

    function drawSalesOverTimeChart(orders) {
        const ctx = document.getElementById('salesOverTimeChart');
        if (!ctx) return;

        const salesByMonth = {};
        orders.forEach(order => {
            const date = new Date(order['thời gian lên đơn']);
            if (isNaN(date)) return;
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            salesByMonth[month] = (salesByMonth[month] || 0) + (parseFloat(order['tổng phụ']) || 0);
        });

        const sortedMonths = Object.keys(salesByMonth).sort();
        
        if (charts.salesOverTime) charts.salesOverTime.destroy();
        charts.salesOverTime = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedMonths,
                datasets: [{
                    label: 'Doanh số (VNĐ)',
                    data: sortedMonths.map(month => salesByMonth[month]),
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
             options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function updateAllCharts(orders, orderDetails) {
        drawSalesAndDiscountChart(orders);
        drawTopProductsChart(orderDetails);
        drawTopCustomersChart(orders);
        drawSalesOverTimeChart(orders);
    }
    
    // --- Filter Logic ---
    function applyFilters() {
        // ... (Copy hàm applyFilters từ report.js)
        // ... nhưng thay vì gọi renderTable, nó sẽ gọi updateAllCharts

        // Lọc orders...
        let filteredOrders = viewableOrders.filter(order => { /* ... logic lọc ... */ });
        
        // Lọc orderDetails tương ứng
        const filteredOrderIds = new Set(filteredOrders.map(o => o['id order']));
        const filteredDetails = {};
        Object.keys(allOrderDetails).forEach(orderId => {
            if (filteredOrderIds.has(orderId)) {
                filteredDetails[orderId] = allOrderDetails[orderId];
            }
        });

        updateAllCharts(filteredOrders, filteredDetails);
    }


    // --- Initialization ---
    try {
        const currentUser = getCurrentUser();
        // ... (logic phân quyền giống hệt report.js)
        
        // Tải dữ liệu
        const [ordersRes, detailsRes] = await Promise.all([ /* ... */ ]);
        // ... xử lý dữ liệu ...

        // Lần đầu tiên vẽ biểu đồ với toàn bộ dữ liệu xem được
        updateAllCharts(viewableOrders, allOrderDetails); // Cần điều chỉnh để chỉ lấy detail của viewableOrders

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
    }

    // Gắn Event Listeners cho bộ lọc
    if (filterBtn) filterBtn.addEventListener('click', applyFilters);
    // ...
});
