// main.js
document.addEventListener("DOMContentLoaded", function() {
    // Hàm để tải và chèn các thành phần HTML
    const loadComponent = (selector, filePath) => {
        fetch(filePath)
            .then(response => response.text())
            .then(data => {
                document.querySelector(selector).innerHTML = data;
            })
            .catch(error => console.error(`Error loading component ${filePath}:`, error));
    };

    // Tạo một placeholder cho header và tải component vào đó
    const headerPlaceholder = document.createElement('div');
    headerPlaceholder.id = 'header-placeholder';
    document.body.prepend(headerPlaceholder); // Chèn vào đầu trang
    
    loadComponent('#header-placeholder', '/includes/header.html');
    
    // Bạn có thể làm tương tự cho footer
    // const footerPlaceholder = document.createElement('div');
    // footerPlaceholder.id = 'footer-placeholder';
    // document.body.append(footerPlaceholder);
    // loadComponent('#footer-placeholder', '/includes/footer.html');
});
