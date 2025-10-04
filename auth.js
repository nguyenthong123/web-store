document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const profileSection = document.getElementById('profile-section');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email-input');
    const loginMessage = document.getElementById('login-message');
    const logoutButton = document.getElementById('logout-button');

    // Hàm tiện ích để lấy thông tin người dùng từ bộ nhớ trình duyệt
    const getCurrentUser = () => {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    };

    // Hàm cập nhật giao diện dựa trên trạng thái đăng nhập
    const updateUI = () => {
        const user = getCurrentUser();
        if (user) {
            // Nếu đã đăng nhập -> Hiển thị thông tin profile
            loginSection.style.display = 'none';
            profileSection.style.display = 'block';
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-phan_loai').textContent = user.phan_loai;
            document.getElementById('user-email').textContent = user.mail;
        } else {
            // Nếu chưa đăng nhập -> Hiển thị form đăng nhập
            loginSection.style.display = 'block';
            profileSection.style.display = 'none';
        }
    };

    // Xử lý sự kiện khi người dùng nhấn nút "Đăng Nhập"
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim().toLowerCase();
            loginMessage.textContent = 'Đang kiểm tra...';

            try {
                // Tải file JSON chứa danh sách người dùng
                const response = await fetch('./data_web.json');
                if (!response.ok) throw new Error('Network response was not ok');
                const users = await response.json();
                
                // Tìm người dùng dựa trên email (không phân biệt hoa thường)
                const foundUser = users.find(u => u.mail && u.mail.toLowerCase() === email);

                if (foundUser) {
                    // Nếu tìm thấy, lưu thông tin vào localStorage
                    localStorage.setItem('currentUser', JSON.stringify(foundUser));
                    loginMessage.textContent = 'Đăng nhập thành công! Đang chuyển hướng...';
                    // Chuyển về trang chủ sau 1.5 giây
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    loginMessage.textContent = 'Email không tồn tại trong hệ thống.';
                }
            } catch (error) {
                loginMessage.textContent = 'Lỗi: Không thể tải dữ liệu người dùng.';
                console.error('Lỗi khi đăng nhập:', error);
            }
        });
    }

    // Xử lý sự kiện khi người dùng nhấn nút "Đăng Xuất"
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            alert('Bạn đã đăng xuất thành công.');
            updateUI(); // Cập nhật lại giao diện ngay lập tức
        });
    }

    // Chạy hàm updateUI lần đầu khi trang được tải để hiển thị đúng trạng thái
    updateUI();
});
