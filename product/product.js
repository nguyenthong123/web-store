document.addEventListener('DOMContentLoaded', () => {

    // Global option groups to avoid repeated queries
    const quyCachGroup = document.querySelector('.options-group[data-option-type="quycach"]');
    const doDayGroup = document.querySelector('.options-group[data-option-type="doday"]');

    // --- Tab Functionality ---
    function setupTabs(containerClass) {
        const tabContainers = document.querySelectorAll(containerClass); // e.g., '.tabs-container'

        tabContainers.forEach(container => {
            const tabLinks = container.querySelectorAll('.tab-link');
            // Assuming the tab content is the *next sibling* with class 'tab-content'
            const tabContent = container.nextElementSibling;

            if (!tabContent || !tabContent.classList.contains('tab-content')) {
                 console.error("Tab content not found for container", container);
                 return; // Skip if content is missing
            }

            const tabPanes = tabContent.querySelectorAll('.tab-pane');

            tabLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetTab = link.dataset.tab; // Get target ID from data-tab attribute

                    // Deactivate all links in this group
                    tabLinks.forEach(item => item.classList.remove('active'));
                    // Activate the clicked link
                    link.classList.add('active');

                    // Hide all panes in this content area
                    tabPanes.forEach(pane => pane.classList.remove('active'));

                    // Show the target pane
                    const targetPane = tabContent.querySelector(`#${targetTab}`);
                    if (targetPane) {
                        targetPane.classList.add('active');
                    } else {
                         console.error("Tab pane not found for target:", targetTab);
                    }
                });
            });

             // Ensure one tab is active on load (if none is marked active in HTML)
             const activeLink = container.querySelector('.tab-link.active');
             if (!activeLink && tabLinks.length > 0) {
                 tabLinks[0].click(); // Activate the first tab by default
             } else if (activeLink) {
                  // If an active link is found in HTML, ensure its pane is shown
                  const targetTab = activeLink.dataset.tab;
                  const targetPane = tabContent.querySelector(`#${targetTab}`);
                  if (targetPane) {
                       tabPanes.forEach(pane => pane.classList.remove('active'));
                       targetPane.classList.add('active');
                  }
             }
        });
    }

    setupTabs('.tabs-container'); // Initialize tabs for all elements with this class


    // --- Product Image Gallery (Simple Slider) ---
    const mainProductImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.thumbnail-gallery .thumbnail');
    const galleryPrevBtn = document.querySelector('.product-gallery .gallery-nav.prev');
    const galleryNextBtn = document.querySelector('.product-gallery .gallery-nav.next');

    if (mainProductImage && thumbnails.length > 0) {
        let currentImageIndex = 0;
        const imageSources = Array.from(thumbnails).map(img => img.src);

        function updateGallery(index) {
            if (index < 0) index = imageSources.length - 1;
            if (index >= imageSources.length) index = 0;

            currentImageIndex = index;
            mainProductImage.src = imageSources[currentImageIndex];

            // Update active thumbnail class
            thumbnails.forEach((thumb, i) => {
                if (i === currentImageIndex) {
                    thumb.classList.add('active');
                    // Optional: Scroll thumbnail into view
                     thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                } else {
                    thumb.classList.remove('active');
                }
            });
        }

        // Add click listeners to thumbnails
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', () => {
                updateGallery(index);
            });
        });

        // Add click listeners to navigation buttons
        if (galleryPrevBtn) {
            galleryPrevBtn.addEventListener('click', () => {
                updateGallery(currentImageIndex - 1);
            });
        }
         if (galleryNextBtn) {
            galleryNextBtn.addEventListener('click', () => {
                updateGallery(currentImageIndex + 1);
            });
        }

        // Initialize active thumbnail
        updateGallery(0); // Start with the first image active
    }


    // --- Quantity Control ---
    function setupQuantityControl() {
        const quantityControls = document.querySelectorAll('.quantity-control');
        quantityControls.forEach(control => {
            const minusBtn = control.querySelector('.quantity-btn.minus');
            const plusBtn = control.querySelector('.quantity-btn.plus');
            const quantityInput = control.querySelector('.quantity-input');
            if (minusBtn && plusBtn && quantityInput) {
                minusBtn.addEventListener('click', () => {
                    let currentValue = parseInt(quantityInput.value, 10);
                    if (currentValue > parseInt(quantityInput.min, 10)) {
                        quantityInput.value = currentValue - 1;
                        updateAll();
                    }
                });
                plusBtn.addEventListener('click', () => {
                    let currentValue = parseInt(quantityInput.value, 10);
                    quantityInput.value = currentValue + 1;
                    updateAll();
                });
                quantityInput.addEventListener('change', () => {
                    let currentValue = parseInt(quantityInput.value, 10);
                    let minValue = parseInt(quantityInput.min, 10);
                    if (isNaN(currentValue) || currentValue < minValue) {
                        quantityInput.value = minValue;
                    }
                    updateAll();
                });
            }
        });

        // --- Insert Product Summary HTML block below options/quantity controls ---
        // Only insert if not already present
        if (!document.querySelector('.product-summary')) {
            // Try to insert after the last .options-group or .quantity-control
            let insertAfter = null;
            const optionsGroups = document.querySelectorAll('.options-group');
            const quantityControl = document.querySelector('.quantity-control');
            if (quantityControl) {
                insertAfter = quantityControl;
            } else if (optionsGroups.length > 0) {
                insertAfter = optionsGroups[optionsGroups.length - 1];
            }
            if (insertAfter) {
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'product-summary';
                summaryDiv.style.marginTop = '1em';
                summaryDiv.innerHTML = `
                  <h2 id="summary-title"></h2>
                  <p id="summary-doday"></p>
                  <p id="summary-soluong"></p>
                `;
                // Insert after the found element
                if (insertAfter.nextSibling) {
                    insertAfter.parentNode.insertBefore(summaryDiv, insertAfter.nextSibling);
                } else {
                    insertAfter.parentNode.appendChild(summaryDiv);
                }
            }
        }
    }


    // --- Option Button Selection (Quy cách, Độ dày) ---
    function setupOptions() {
        const optionsGroups = document.querySelectorAll('.options-group');
        optionsGroups.forEach(group => {
            const optionButtons = group.querySelectorAll('.option-btn');
            optionButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove 'selected' class from all buttons in this group
                    optionButtons.forEach(btn => btn.classList.remove('selected'));
                    // Add 'selected' class to the clicked button
                    button.classList.add('selected');
                    updateAll();
                });
            });
            // Ensure one button is selected on load if none is marked active in HTML
            const selectedButton = group.querySelector('.option-btn.selected');
            if (!selectedButton && optionButtons.length > 0) {
                optionButtons[0].classList.add('selected');
            }
        });
    }

    // --- Province Select ---
    function setupProvinceSelect() {
        const provinceSelect = document.getElementById('province-select');
        if (provinceSelect) {
            provinceSelect.addEventListener('change', () => {
                const selectedValue = provinceSelect.value;
                console.log("Selected province:", selectedValue);
                updateAll();
            });
        }
    }


    // --- Function to update Product Summary ---
    // This function reads the selected options and updates the text.
    // You'll need to customize this based on how you want the summary displayed.
    function updateProductSummary() {
        const selectedQuyCachBtn = quyCachGroup ? quyCachGroup.querySelector('.option-btn.selected') : null;
        const selectedDoDayBtn = doDayGroup ? doDayGroup.querySelector('.option-btn.selected') : null;
        const quantityInput = document.querySelector('.quantity-input');
        const provinceSelect = document.getElementById('province-select'); // Get select again if needed

        // Check for missing selections
        if (!selectedQuyCachBtn || !selectedDoDayBtn) {
            console.warn("Vui lòng chọn quy cách và độ dày.");
            return;
        }

        const summaryTitle = document.getElementById('summary-title');
        const summaryDoDay = document.getElementById('summary-doday');
        const summarySoLuong = document.getElementById('summary-soluong');
        // const summaryPrice = document.getElementById('summary-price'); // If you have a price element

        let quyCach = selectedQuyCachBtn ? selectedQuyCachBtn.dataset.value : 'N/A';
        let doDay = selectedDoDayBtn ? selectedDoDayBtn.dataset.value : 'N/A';
        let quantity = quantityInput ? quantityInput.value : 'N/A';
        // let province = provinceSelect ? provinceSelect.options[provinceSelect.selectedIndex].text : 'N/A'; // Get selected text

        // Example update logic:
        if (summaryTitle) {
            // You might need a more sophisticated way to get the full product name
            summaryTitle.textContent = `Tấm DURAfles Low Carbon ${doDay}mm ${quyCach}`;
        }
        if (summaryDoDay) {
            summaryDoDay.textContent = `Độ dày: ${doDay}mm`;
        }
        if (summarySoLuong) {
            summarySoLuong.textContent = `Số lượng: ${quantity}`;
        }
        // If you have pricing data available in JS or can fetch it:
        // if (summaryPrice) {
        //     // Lookup price based on doDay, quyCach, and province
        //     // summaryPrice.textContent = `Giá: ${calculatedPrice} VNĐ`;
        // }

        console.log(`Selected: Quy cách=${quyCach}, Độ dày=${doDay}, SL=${quantity}`);
        // This is where you might trigger an AJAX call to get the price based on selection
    }

    // --- Spec Table Data and Update ---
    const specTable = document.querySelector('.spec-table-wrapper');
    const specTableBody = document.querySelector('.spec-table tbody');
    const optionButtons = document.querySelectorAll('.option-btn');

    // Sửa lại specifications object
    const specifications = {
        '1220x2440': {
            '6': { weight: '29.24 kg/tấm', package: '100 tấm/kiện' },
            '8': { weight: '38.18 kg/tấm', package: '80 tấm/kiện' },
            '12': { weight: '59.63 kg/tấm', package: '50 tấm/kiện' },
            '14': { weight: '70.71 kg/tấm', package: '40 tấm/kiện' },
            '15': { weight: '72.38 kg/tấm', package: '40 tấm/kiện' },
            '16': { weight: '77.8 kg/tấm', package: '40 tấm/kiện' },
            '18': { weight: '88.1 kg/tấm', package: '35 tấm/kiện' }
        },
        '1000x2000': {  // Thay đổi từ '1mx2m' thành '1000x2000'
            '6': { weight: '-', package: '-' },
            '8': { weight: '-', package: '-' },
            '12': { weight: '39.55 kg/tấm', package: '50 tấm/kiện' },
            '14': { weight: '46.67 kg/tấm', package: '45 tấm/kiện' },
            '15': { weight: '49.28 kg/tấm', package: '40 tấm/kiện' },
            '16': { weight: '52.28 kg/tấm', package: '40 tấm/kiện' },
            '18': { weight: '59.20 kg/tấm', package: '35 tấm/kiện' }
        }
    };

    // Unified update spec table function
    function updateSpecTable() {
        const productType = document.querySelector('.product-config-form').dataset.productType;
        const specTableBody = document.querySelector('.spec-table tbody');
        
        if (productType === 'dura_vis_screws') {
            // Clear existing content
            specTableBody.innerHTML = '';
            
            // Create new row based on selected screw length
            const row = document.createElement('tr');
            
            if (selectedLength === '26') {
                row.innerHTML = `
                    <td>Vít chuyên dụng bắn vách</td>
                    <td>trung bình 20 con vít / tấm</td>
                `;
            } else if (selectedLength === '35') {
                row.innerHTML = `
                    <td>Vít chuyên dụng bắn sàn</td>
                    <td>trung bình 16 con vít / tấm</td>
                `;
            }
            
            specTableBody.appendChild(row);
        } else {
            // Original spec table content for other products
            const selectedSize = document.querySelector('[data-option-type="quycach"] .selected')?.dataset.value;
            const selectedThickness = document.querySelector('[data-option-type="doday"] .selected')?.dataset.value;
            const tbody = document.querySelector('.spec-table tbody');
            const specTable = document.querySelector('.spec-table-wrapper');

            // Debug logs
            console.log('Selected Size:', selectedSize);
            console.log('Selected Thickness:', selectedThickness);
            console.log('Specs:', specifications[selectedSize]?.[selectedThickness]);

            if (!selectedSize || !selectedThickness || !tbody) {
                if (specTable) specTable.style.display = 'none';
                return;
            }

            tbody.innerHTML = '';
            const row = document.createElement('tr');
                
            // Thêm cột khối lượng riêng
            const khoiLuongCell = document.createElement('td');
            const specs = specifications[selectedSize]?.[selectedThickness];
            khoiLuongCell.textContent = specs ? specs.weight : '-';
            row.appendChild(khoiLuongCell);

            // Thêm cột quy cách đóng kiện
            const quyCachKienCell = document.createElement('td'); // Sửa lại tên biến
            quyCachKienCell.textContent = specs ? specs.package : '-';
            row.appendChild(quyCachKienCell); // Sửa lại tên biến

            tbody.appendChild(row);

            // Hiển thị bảng
            if (specTable) {
                specTable.style.display = 'block';
            }
        }
    }

    // Setup option buttons
    optionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const group = this.closest('.options-group');
            group.querySelectorAll('.option-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            this.classList.add('selected');
            updateAll();
        });
    });

    // Update both summary and spec table
    function updateAll() {
        updateProductSummary();
        updateSpecTable();
    }


     // --- Simple Carousel Implementation ---
     // This is a basic example. For production, consider a library like Swiper or Slick Carousel.
    function setupCarousel(carouselSelector) {
        const carousels = document.querySelectorAll(carouselSelector);

        carousels.forEach(carousel => {
            const slides = carousel.children; // Assuming direct children are slides
            if (slides.length <= 1) return; // No need for carousel if 1 or less slides

            let currentSlide = 0;
            const totalSlides = slides.length;

            // Create wrapper for sliding
            const inner = document.createElement('div');
            inner.classList.add('carousel-inner');
            // Move slides into the wrapper
            while(carousel.firstChild) {
                const slide = carousel.firstChild;
                slide.classList.add('carousel-item'); // Add item class for styling
                inner.appendChild(slide);
            }
            carousel.appendChild(inner); // Add wrapper back to carousel

            // Create navigation buttons (assuming they exist in HTML)
            const prevBtn = carousel.querySelector('.carousel-nav.prev');
            const nextBtn = carousel.querySelector('.carousel-nav.next');

            // Create dots container (assuming it exists as next sibling with class carousel-dots)
            const dotsContainer = carousel.nextElementSibling; // Check if next element is dots container
            let dots = [];
            if (dotsContainer && dotsContainer.classList.contains('carousel-dots')) {
                for (let i = 0; i < totalSlides; i++) {
                    const dot = document.createElement('span');
                    dot.classList.add('dot');
                    dot.addEventListener('click', () => goToSlide(i));
                    dotsContainer.appendChild(dot);
                    dots.push(dot);
                }
            } else {
                 console.warn("Carousel dots container not found for", carouselSelector);
            }


            function updateCarousel() {
                inner.style.transform = `translateX(${-currentSlide * 100}%)`;

                // Update active dot
                dots.forEach((dot, i) => {
                    if (i === currentSlide) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
            }

            function goToSlide(index) {
                currentSlide = index;
                updateCarousel();
            }

            function nextSlide() {
                goToSlide((currentSlide + 1) % totalSlides);
            }

            function prevSlide() {
                goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
            }

            // Add event listeners
            if (nextBtn) nextBtn.addEventListener('click', nextSlide);
            if (prevBtn) prevBtn.addEventListener('click', prevSlide);

            // Initial update
            updateCarousel();
        });
    }

     // Apply carousel setup to relevant elements
    setupCarousel('.certificates-carousel');
    setupCarousel('.step-image-gallery'); // Assuming this is also a carousel


    // --- Basic Button Actions (Placeholder) ---
    const buyButton = document.getElementById('buy-button');
    if(buyButton) {
        buyButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default form submission if it was a form
            alert('Chức năng MUA NGAY đang phát triển!'); // Replace with actual purchase logic
            // TODO: Collect selected product data and proceed to checkout/contact form
        });
    }

     const dealerButton = document.getElementById('dealer-button');
    if(dealerButton) {
        dealerButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default form submission
            alert('Chức năng Tìm đại lý đang phát triển!'); // Replace with actual dealer locator logic
            // TODO: Navigate to dealer locator page or show a map/list
        });
    }


    // --- Hamburger Menu (Basic Toggle) ---
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const mainNav = document.querySelector('.main-nav'); // Or the actual mobile menu element

    if (hamburgerBtn && mainNav) {
        hamburgerBtn.addEventListener('click', () => {
            mainNav.classList.toggle('nav-open');
            console.log("Hamburger clicked");
        });
    }

    // Final setup calls
    setupTabs('.tabs-container');
    setupQuantityControl();
    setupOptions();
    setupProvinceSelect();
    updateAll();
}); // End of DOMContentLoaded

document.addEventListener('DOMContentLoaded', function() {
    // Certificates carousel functionality
    const slider = document.querySelector('.certificates-slider');
    const prevBtn = document.querySelector('.certificates-carousel .prev');
    const nextBtn = document.querySelector('.certificates-carousel .next');
    const certItems = document.querySelectorAll('.cert-item');
    let currentIndex = 0;

    function updateSlider() {
        const itemWidth = certItems[0].offsetWidth + 20; // Including gap
        slider.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
    }

    prevBtn?.addEventListener('click', () => {
        currentIndex = Math.max(currentIndex - 1, 0);
        updateSlider();
    });

    nextBtn?.addEventListener('click', () => {
        const maxIndex = certItems.length - Math.floor(slider.offsetWidth / certItems[0].offsetWidth);
        currentIndex = Math.min(currentIndex + 1, maxIndex);
        updateSlider();
    });

    // Image zoom functionality
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    const closeBtn = document.querySelector('.modal .close');

    document.querySelectorAll('.cert-image').forEach(img => {
        img.addEventListener('click', function() {
            modal.style.display = "block";
            modalImg.src = this.src;
            modalCaption.textContent = this.alt;
        });
    });

    closeBtn?.addEventListener('click', () => {
        modal.style.display = "none";
    });

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Construction video handling
    const videoContainer = document.getElementById('constructionVideo');
    const constructionButtons = document.querySelectorAll('.construction-btn');

    constructionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const videoId = this.dataset.video;
            videoContainer.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
            
            // Remove active class from all buttons
            constructionButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
        });
    });

    // Set default video
    if (constructionButtons.length > 0) {
        constructionButtons[0].click();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Mobile nav active state handling
    const mobileNavItems = document.querySelectorAll('.mobile-nav .nav-item');
    
    mobileNavItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            mobileNavItems.forEach(navItem => navItem.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
        });
    });

    // Handle horizontal scroll shadow
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav) {
        mobileNav.addEventListener('scroll', function() {
            if (this.scrollLeft > 0) {
                this.classList.add('show-shadow');
            } else {
                this.classList.remove('show-shadow');
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const productType = document.querySelector('.product-config-form').dataset.productType;
    const optionButtons = document.querySelectorAll('.option-btn');

    optionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const optionGroup = this.closest('.options-group');
            optionGroup.querySelectorAll('.option-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            this.classList.add('selected');
            updateSpecTable();
        });
    });

    // Initial update
    updateSpecTable();
});

// Quantity control handling
function setupQuantityControls() {
    const controls = document.querySelectorAll('.quantity-controls');
    
    controls.forEach(control => {
        const minusBtn = control.querySelector('.minus-btn');
        const plusBtn = control.querySelector('.plus-btn');
        const quantitySpan = control.querySelector('.quantity');
        let quantity = 1;
        let clickTimeout;

        function updateQuantity(newQuantity) {
            quantity = Math.max(1, Math.min(99, newQuantity));
            quantitySpan.textContent = quantity;
            // Trigger any other updates needed
            updateProductSummary();
        }

        // Use touchstart for faster mobile response
        plusBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            updateQuantity(quantity + 1);
        });

        minusBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            updateQuantity(quantity - 1);
        });

        // Keep click events for desktop
        plusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            updateQuantity(quantity + 1);
        });

        minusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            updateQuantity(quantity - 1);
        });
    });
}

// Initialize controls when DOM is ready
document.addEventListener('DOMContentLoaded', setupQuantityControls);