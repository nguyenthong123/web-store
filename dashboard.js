// PHIÊN BẢN DASHBOARD.JS HOÀN CHỈNH - VẼ BIỂU ĐỒ VÀ THÊM LINK SIDEBAR

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements & Chart instances ---
    const filterBtn = document.getElementById('filterBtn');
    const resetBtn = document.getElementById('resetBtn');
    const chartsContainer = document.getElementById('charts-grid-container');
    let charts = {}; // Object để lưu các biểu đồ

    // --- Data ---
    let allOrders = [];
    let allOrderDetails = {};
    let viewableOrders = [];
    let viewableDetails = {};

    // --- Helper Functions ---
    const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser'));

    // =================================================================
    // === TÁCH HÀM THÊM LINK VÀO SIDEBAR RA RIÊNG ===
    // =================================================================
    function addDynamicSidebarLinks() {
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.phan_loai) {
            const userType = currentUser.phan_loai.toLowerCase();
            const allowedRoles = ['ad mind', 'nhà máy tôn', 'cửa hàng'];
            
            if (allowedRoles.includes(userType)) {
                const sidebarNavUl = document.querySelector('.sidebar-nav ul');
                if (sidebarNavUl) {
                    const logoutLi = sidebarNavUl.querySelector('.logout')?.parentElement;

                    // Thêm link Báo cáo
                    if (!sidebarNavUl.querySelector('.report-link')) {
                        const reportLi = document.createElement('li');
                        reportLi.classList.add('report-link');
                        reportLi.innerHTML = `<a href="report.html"><i class="ri-file-list-3-line"></i> Báo cáo Đơn hàng</a>`;
                        if(logoutLi) sidebarNavUl.insertBefore(reportLi, logoutLi);
                    }
                    
                    // Thêm link Phân tích
                    if (!sidebarNavUl.querySelector('.dashboard-link')) {
                        const dashboardLi = document.createElement('li');
                        dashboardLi.classList.add('dashboard-link');
                        // Đánh dấu active cho trang hiện tại
                        dashboardLi.innerHTML = `<a href="dashboard-analytics.html" class="active"><i class="ri-bar-chart-2-line"></i> Phân tích</a>`;
                        if(logoutLi) sidebarNavUl.insertBefore(dashboardLi, logoutLi);
                    }
                }
            }
        }
    }

    // --- Chart Drawing Functions ---
    function drawSalesAndDiscountChart(orders) {
        const ctx = document.getElementById('salesAndDiscountChart')?.getContext('2d');
        if (!ctx) return;

        const totalSales = orders.reduce((sum, order) => sum + (parseFloat(order['tổng phụ']) || 0), 0);
        const totalDiscountable = orders.reduce((sum, order) => sum + (parseFloat(order['số tiền còn lại trong đơn']) || 0), 0);
        
        if (charts.sales) charts.sales.destroy();
        charts.sales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Doanh số (Tổng tiền)', 'Sản lượng Chiết khấu (Còn lại)'],
                datasets: [{ data: [totalSales, totalDiscountable], backgroundColor: ['#36A2EB', '#4BC0C0'] }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    function drawTopProductsChart(orderDetails) {
        const ctx = document.getElementById('topProductsChart')?.getContext('2d');
        if (!ctx) return;

        const productSales = {};
        Object.values(orderDetails).flat().forEach(item => {
            const productName = item['tên sản phẩm'];
            const quantity = parseFloat(item['số lượng']) || 0;
            productSales[productName] = (productSales[productName] || 0) + quantity;
        });

        const topProducts = Object.entries(productSales).sort(([, a], [, b]) => b - a).slice(0, 5);

        if (charts.topProducts) charts.topProducts.destroy();
        charts.topProducts = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: topProducts.map(p => p[0]),
                datasets: [{ data: topProducts.map(p => p[1]), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    function drawTopCustomersChart(orders) {
        const ctx = document.getElementById('topCustomersChart')?.getContext('2d');
        if (!ctx) return;

        const customerSales = {};
        orders.forEach(order => {
            const customerName = order['tên khách hàng'];
            const total = parseFloat(order['tổng phụ']) || 0;
            if (customerName) customerSales[customerName] = (customerSales[customerName] || 0) + total;
        });

        const topCustomers = Object.entries(customerSales).sort(([, a], [, b]) => b - a).slice(0, 5);
        
        if (charts.topCustomers) charts.topCustomers.destroy();
        charts.topCustomers = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topCustomers.map(c => c[0]),
                datasets: [{ data: topCustomers.map(c => c[1]), backgroundColor: '#FF9F40' }]
            },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }
        });
    }

    function drawSalesOverTimeChart(orders) {
        const ctx = document.getElementById('salesOverTimeChart')?.getContext('2d');
        if (!ctx) return;

        const salesByMonth = {};
        orders.forEach(order => {
            if (!order['thời gian lên đơn']) return;
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
                datasets: [{ label: 'Doanh số', data: sortedMonths.map(month => salesByMonth[month]), borderColor: '#FF6384', tension: 0.1 }]
            },
             options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function updateAllCharts(orders, orderDetails) {
        if (!chartsContainer) return;
        if (orders.length === 0) {
            chartsContainer.innerHTML = '<p class="no-data" style="text-align:center; padding: 20px;">Không có dữ liệu để hiển thị biểu đồ.</p>';
            return;
        }
        
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
    
    function applyFilters() {
        // ... (Code lọc giống report.js) ...
    }

    // --- Initialization ---
    async function initializeApp() {
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
            const userType = currentUser.phan_loai.toLowerCase();

            if (['ad mind', 'nhà máy tôn'].includes(userType)) {
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
            // Populate filters (Tương tự report.js)
            // ...

        } catch (error) {
            console.error("Lỗi khi khởi tạo dashboard:", error);
            if(chartsContainer) chartsContainer.innerHTML = '<p class="no-data" style="text-align:center; padding: 20px;">Lỗi tải dữ liệu. Vui lòng kiểm tra file JSON.</p>';
        }
    }

    // =================================================================
    // === GỌI HÀM THÊM LINK NGAY LẬP TỨC ===
    // =================================================================
    addDynamicSidebarLinks();
    initializeApp();

    if (filterBtn) filterBtn.addEventListener('click', applyFilters);
    // ... các event listener khác
});
