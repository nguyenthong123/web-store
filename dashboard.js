// PHIÊN BẢN DASHBOARD.JS CUỐI CÙNG - ĐẦY ĐỦ VÀ CHÍNH XÁC

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements & Chart instances ---
    const filterBtn = document.getElementById('filterBtn');
    const resetBtn = document.getElementById('resetBtn');
    const chartsContainer = document.getElementById('charts-grid-container');
    const customerSearchInput = document.getElementById('customerSearch');
    let charts = {};

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
    
    function addDynamicSidebarLinks() {
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.phan_loai) {
            const userType = currentUser.phan_loai.toLowerCase();
            const allowedRoles = ['ad mind', 'nhà máy tôn', 'cửa hàng'];
            
            if (allowedRoles.includes(userType)) {
                const sidebarNavUl = document.querySelector('.sidebar-nav ul');
                if (sidebarNavUl) {
                    const logoutLi = sidebarNavUl.querySelector('.logout')?.parentElement;

                    if (!sidebarNavUl.querySelector('.report-link')) {
                        const reportLi = document.createElement('li');
                        reportLi.classList.add('report-link');
                        reportLi.innerHTML = `<a href="report.html"><i class="ri-file-list-3-line"></i> Báo cáo Đơn hàng</a>`;
                        if(logoutLi) sidebarNavUl.insertBefore(reportLi, logoutLi);
                    }
                    
                    if (!sidebarNavUl.querySelector('.dashboard-link')) {
                        const dashboardLi = document.createElement('li');
                        dashboardLi.classList.add('dashboard-link');
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
        const salesByCustomer = {};
        orders.forEach(order => {
            const customerName = order['tên khách hàng'] || 'Khách lẻ';
            if (!salesByCustomer[customerName]) {
                salesByCustomer[customerName] = { sales: 0, discountable: 0 };
            }
            salesByCustomer[customerName].sales += parseFloat(order['tổng phụ']) || 0;
            salesByCustomer[customerName].discountable += parseFloat(order['số tiền còn lại trong đơn']) || 0;
        });
        const labels = Object.keys(salesByCustomer);
        const salesData = labels.map(name => salesByCustomer[name].sales);
        const discountableData = labels.map(name => salesByCustomer[name].discountable);
        if (charts.sales) charts.sales.destroy();
        charts.sales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Doanh số (Tổng tiền)', data: salesData, backgroundColor: '#36A2EB' },
                    { label: 'Sản lượng Chiết khấu (Còn lại)', data: discountableData, backgroundColor: '#4BC0C0' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
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
            chartsContainer.innerHTML = '<p class="no-data" style="text-align:center; padding: 20px;">Không có dữ liệu để hiển thị biểu đồ cho lựa chọn này.</p>';
            return;
        }
        if (!document.getElementById('salesAndDiscountChart')) {
            chartsContainer.innerHTML = `
                <div class="chart-card card"><h3>Doanh số & Sản lượng Chiết khấu</h3><canvas id="salesAndDiscountChart"></canvas></div>
                <div class="chart-card card"><h3>Top 5 Sản Phẩm Bán Chạy</h3><canvas id="topProductsChart"></canvas></div>
                <div class="chart-card card"><h3>Top 5 Khách Hàng</h3><canvas id="topCustomersChart"></canvas></div>
                <div class="chart-card card large"><h3>Doanh số theo Thời gian</h3><canvas id="salesOverTimeChart"></canvas></div>`;
        }
        drawSalesAndDiscountChart(orders);
        drawTopProductsChart(orderDetails);
        drawTopCustomersChart(orders);
        drawSalesOverTimeChart(orders);
    }
    
    function applyFilters() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const status = document.getElementById('statusFilter').value;
        const customer = customerSearchInput.value.toLowerCase();
        let filteredOrders = viewableOrders.filter(order => {
            const orderDate = parseDate(order['thời gian lên đơn']);
            if (startDate && (!orderDate || orderDate < new Date(startDate))) return false;
            if (endDate && (!orderDate || orderDate > new Date(endDate))) return false;
            if (status && order['trạng thái'] !== status) return false;
            if (customer && !(order['tên khách hàng'] && order['tên khách hàng'].toLowerCase().includes(customer))) return false;
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
    
    function populateFilters(orders, populateCustomers = true) {
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            const statuses = [...new Set(orders.map(o => o['trạng thái']).filter(s => s && s.trim() !== ''))];
            statusFilter.innerHTML = '<option value="">-- Tất cả trạng thái --</option>';
            statuses.forEach(status => { statusFilter.innerHTML += `<option value="${status}">${status}</option>`; });
        }
        if (populateCustomers) {
            const datalist = document.getElementById('customer-list');
            if (datalist) {
                const customerNames = [...new Set(orders.map(o => o['tên khách hàng']).filter(Boolean))];
                datalist.innerHTML = '';
                customerNames.forEach(name => { datalist.innerHTML += `<option value="${name}"></option>`; });
            }
        }
    }

    // --- Initialization ---
    async function initializeApp() {
        addDynamicSidebarLinks();
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
            if (!ordersRes.ok || !detailsRes.ok) throw new Error("Không thể tải file dữ liệu.");
            
            let allOrdersRaw = await ordersRes.json();
            allOrderDetails = await detailsRes.json();

            allOrders = allOrdersRaw.filter(o => o && o['id order']).map(o => { const cleaned = {}; for (const key in o) { cleaned[key.trim().replace(/:$/, '')] = o[key]; } return cleaned; });
            
            const userEmail = currentUser.mail.toLowerCase();
            const userType = currentUser.phan_loai.toLowerCase();

            if (userType === 'ad mind') {
                viewableOrders = allOrders.filter(order => order['email người phụ trách'] && order['email người phụ trách'].toLowerCase() === userEmail);
                populateFilters(viewableOrders, true);
            } else {
                viewableOrders = allOrders.filter(order => (order['email khách hàng'] && order['email khách hàng'].toLowerCase() === userEmail) || (order['tên khách hàng'] === currentUser.name));
                if (customerSearchInput) {
                    customerSearchInput.value = currentUser.name;
                    customerSearchInput.disabled = true;
                }
                populateFilters(viewableOrders, false);
            }

            const viewableOrderIds = new Set(viewableOrders.map(o => o['id order']));
            Object.keys(allOrderDetails).forEach(orderId => {
                if (viewableOrderIds.has(orderId)) {
                    viewableDetails[orderId] = allOrderDetails[orderId];
                }
            });

            updateAllCharts(viewableOrders, viewableDetails);

        } catch (error) {
            console.error("Lỗi khi khởi tạo dashboard:", error);
            if(chartsContainer) chartsContainer.innerHTML = '<p class="no-data" style="text-align:center; padding: 20px;">Lỗi tải dữ liệu. Vui lòng kiểm tra file JSON và đường dẫn.</p>';
        }
    }

    // --- Event Listeners ---
    if (filterBtn) filterBtn.addEventListener('click', applyFilters);
    if (resetBtn) resetBtn.addEventListener('click', () => {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('statusFilter').value = '';
        const currentUser = getCurrentUser();
        if (customerSearchInput && (!currentUser || currentUser.phan_loai.toLowerCase() === 'ad mind')) {
             customerSearchInput.value = '';
        }
        initializeApp(); // Reset lại toàn bộ
    });
    
    // Khởi chạy
    initializeApp();
});
