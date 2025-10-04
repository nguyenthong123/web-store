document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const profileSection = document.getElementById('profile-section');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email-input');
    const loginMessage = document.getElementById('login-message');
    const logoutButton = document.getElementById('logout-button');

    // Hàm để lấy thông tin người dùng từ localStorage
    const getCurrentUser = () => {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    };

    // Hàm cập nhật giao diện dựa trên trạng thái đăng nhập
    const updateUI = () => {
        const user = getCurrentUser();
        if (user) {
            // Nếu đã đăng nhập
            loginSection.style.display = 'none';
            profileSection.style.display = 'block';
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-phan_loai').textContent = user.phan_loai;
            document.getElementById('user-email').textContent = user.mail;
        } else {
            // Nếu chưa đăng nhập
            loginSection.style.display = 'block';
            profileSection.style.display = 'none';
        }
    };

    // Xử lý sự kiện submit form đăng nhập
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim().toLowerCase();
        loginMessage.textContent = 'Đang kiểm tra...';

        try {
            const response = await fetch('./data_web.json');
            const users = await response.json();
            
            const foundUser = users.find(u => u.mail.toLowerCase() === email);

            if (foundUser) {
                // Lưu thông tin người dùng vào localStorage
                localStorage.setItem('currentUser', JSON.stringify(foundUser));
                loginMessage.textContent = 'Đăng nhập thành công! Đang chuyển hướng...';
                // Chuyển về trang chủ sau 1 giây
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                loginMessage.textContent = 'Email không tồn tại trong hệ thống.';
            }
        } catch (error) {
            loginMessage.textContent = 'Lỗi khi tải dữ liệu người dùng.';
            console.error(error);
        }
    });

    // Xử lý sự kiện đăng xuất
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        updateUI(); // Cập nhật lại giao diện
    });

    // Cập nhật giao diện khi trang được tải
    updateUI();
});
