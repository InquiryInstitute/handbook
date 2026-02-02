// Handbook Flipbook Implementation
// Uses stPageFlip library for page-flip animation

document.addEventListener('DOMContentLoaded', function() {
    const flipbook = document.getElementById('flipbook');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    
    // Detect mobile
    function isMobileDevice() {
        return window.innerWidth <= 768;
    }
    
    const isMobile = isMobileDevice();
    
    // Page data - will be populated from chapters
    const pages = [];
    let currentPage = 0;
    let pageFlipInstance = null;
    let isFlipping = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    // Load pages
    async function loadPages() {
        // Cover page
        const coverResponse = await fetch('pages/cover.html');
        const coverHtml = await coverResponse.text();
        pages.push({ html: coverHtml, type: 'cover' });
        
        // Table of Contents
        const tocResponse = await fetch('pages/toc.html');
        const tocHtml = await tocResponse.text();
        pages.push({ html: tocHtml, type: 'toc' });
        
        // Load chapters
        const chapters = [
            { file: 'chapters/00-welcome-desk.html', title: 'The Welcome Desk' },
            { file: 'chapters/01-jurisdiction-authority.html', title: 'Jurisdiction & Authority' },
            // Add more chapters as they're converted
        ];
        
        for (const chapter of chapters) {
            try {
                const response = await fetch(`pages/${chapter.file}`);
                if (response.ok) {
                    const html = await response.text();
                    // Split long chapters into multiple pages if needed
                    const chapterPages = splitIntoPages(html, chapter.title);
                    pages.push(...chapterPages);
                }
            } catch (error) {
                console.warn(`Could not load ${chapter.file}:`, error);
            }
        }
        
        // Initialize flipbook
        initializeFlipbook();
    }
    
    function splitIntoPages(html, title) {
        // Simple page splitting - split by headings or after ~800 words
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        const pages = [];
        let currentPageContent = `<div class="page"><h1>${title}</h1>`;
        let wordCount = 0;
        const wordsPerPage = 800;
        
        const elements = Array.from(tempDiv.children);
        
        for (const element of elements) {
            const text = element.textContent || '';
            const words = text.split(/\s+/).length;
            
            if (wordCount + words > wordsPerPage && wordCount > 0) {
                currentPageContent += '</div>';
                pages.push({ html: currentPageContent, type: 'content' });
                currentPageContent = '<div class="page">';
                wordCount = 0;
            }
            
            currentPageContent += element.outerHTML;
            wordCount += words;
        }
        
        if (currentPageContent !== '<div class="page">') {
            currentPageContent += '</div>';
            pages.push({ html: currentPageContent, type: 'content' });
        }
        
        return pages;
    }
    
    function initializeFlipbook() {
        // Clear existing content
        flipbook.innerHTML = '';
        
        // Create page elements
        pages.forEach((page, index) => {
            const pageElement = document.createElement('div');
            pageElement.className = `page ${page.type}`;
            pageElement.innerHTML = page.html;
            flipbook.appendChild(pageElement);
        });
        
        // Initialize page flip with CSS-based animation
        // Using a custom implementation for better control
        initializePageFlip();
        totalPagesSpan.textContent = pages.length;
        updateControls();
    }
    
    function initializePageFlip() {
        const pageElements = Array.from(flipbook.querySelectorAll('.page'));
        
        if (isMobile) {
            // Mobile: Single page view with swipe gestures
            initializeMobileFlip(pageElements);
        } else {
            // Desktop: Book-style flip
            initializeDesktopFlip(pageElements);
        }
    }
    
    function initializeMobileFlip(pageElements) {
        // Initialize pages for mobile
        pageElements.forEach((page, i) => {
            page.classList.remove('active', 'next', 'prev', 'flipping');
            if (i === 0) {
                page.classList.add('active');
            } else if (i === 1) {
                page.classList.add('next');
            }
        });
        
        function showPage(index, direction = 'next') {
            if (isFlipping || index < 0 || index >= pageElements.length) return;
            isFlipping = true;
            
            const prevIndex = currentPage;
            const targetIndex = index;
            
            // Update classes
            pageElements[prevIndex].classList.remove('active', 'next', 'prev');
            pageElements[targetIndex].classList.remove('active', 'next', 'prev');
            
            // Add flipping animation
            pageElements[prevIndex].classList.add('flipping');
            pageElements[targetIndex].classList.add('flipping');
            
            if (direction === 'next') {
                pageElements[prevIndex].style.transform = 'rotateY(-180deg)';
            } else {
                pageElements[prevIndex].style.transform = 'rotateY(180deg)';
            }
            
            pageElements[targetIndex].style.transform = 'rotateY(0deg)';
            pageElements[targetIndex].classList.add('active');
            
            // Update adjacent pages
            if (targetIndex > 0) {
                pageElements[targetIndex - 1].classList.remove('active', 'next', 'prev');
                pageElements[targetIndex - 1].classList.add('prev');
            }
            if (targetIndex < pageElements.length - 1) {
                pageElements[targetIndex + 1].classList.remove('active', 'next', 'prev');
                pageElements[targetIndex + 1].classList.add('next');
            }
            
            currentPage = targetIndex;
            
            setTimeout(() => {
                pageElements[prevIndex].classList.remove('flipping');
                pageElements[targetIndex].classList.remove('flipping');
                pageElements[prevIndex].style.transform = 'rotateY(0deg)';
                isFlipping = false;
                updateControls();
            }, 600);
        }
        
        // Touch/swipe handlers
        flipbook.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        flipbook.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const minSwipeDistance = 50;
            
            // Only handle horizontal swipes (ignore vertical scrolling)
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0 && currentPage > 0) {
                    // Swipe right - previous page
                    showPage(currentPage - 1, 'prev');
                } else if (deltaX < 0 && currentPage < pageElements.length - 1) {
                    // Swipe left - next page
                    showPage(currentPage + 1, 'next');
                }
            }
        }
        
        // Store navigation functions
        window.flipToPage = (index, direction) => showPage(index, direction);
    }
    
    function initializeDesktopFlip(pageElements) {
        // Desktop: Book-style flip (original implementation)
        pageElements.forEach((page, i) => {
            page.style.zIndex = pages.length - i;
            if (i === 0) {
                page.style.transform = 'rotateY(0deg)';
                page.style.opacity = '1';
            } else {
                page.style.transform = 'rotateY(0deg)';
                page.style.opacity = '0';
            }
        });
        
        function showPage(index, direction = 'next') {
            if (isFlipping || index < 0 || index >= pageElements.length) return;
            isFlipping = true;
            
            const targetIndex = index;
            const prevIndex = currentPage;
            
            // Update z-index for proper stacking
            pageElements[targetIndex].style.zIndex = pages.length + 1;
            pageElements[prevIndex].style.zIndex = pages.length - prevIndex;
            
            // Animate current page out
            if (direction === 'next') {
                pageElements[prevIndex].style.transform = 'rotateY(-180deg)';
            } else {
                pageElements[prevIndex].style.transform = 'rotateY(180deg)';
            }
            pageElements[prevIndex].style.opacity = '0';
            
            // Animate next page in
            pageElements[targetIndex].style.transform = 'rotateY(0deg)';
            pageElements[targetIndex].style.opacity = '1';
            
            currentPage = targetIndex;
            
            setTimeout(() => {
                // Reset previous page position
                pageElements[prevIndex].style.transform = 'rotateY(0deg)';
                isFlipping = false;
                updateControls();
            }, 600);
        }
        
        // Store navigation functions
        window.flipToPage = (index, direction) => showPage(index, direction);
    }
    
    function setupSimpleNavigation() {
        // Fallback implementation without page-flip animation
        const pageElements = flipbook.querySelectorAll('.page');
        
        function showPage(index) {
            pageElements.forEach((page, i) => {
                page.style.display = i === index ? 'block' : 'none';
            });
            currentPage = index;
            updateControls();
        }
        
        showPage(0);
    }
    
    function updateControls() {
        currentPageSpan.textContent = currentPage + 1;
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage === pages.length - 1;
    }
    
    // Navigation buttons
    prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentPage > 0 && !isFlipping) {
            window.flipToPage(currentPage - 1, 'prev');
        }
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentPage < pages.length - 1 && !isFlipping) {
            window.flipToPage(currentPage + 1, 'next');
        }
    });
    
    // Table of Contents navigation
    document.addEventListener('click', (e) => {
        if (e.target.matches('.toc a[data-page]')) {
            e.preventDefault();
            e.stopPropagation();
            if (isFlipping) return;
            
            const targetPage = parseInt(e.target.getAttribute('data-page'));
            const direction = targetPage > currentPage ? 'next' : 'prev';
            window.flipToPage(targetPage, direction);
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (isFlipping) return;
        
        if (e.key === 'ArrowLeft' && currentPage > 0) {
            window.flipToPage(currentPage - 1, 'prev');
        } else if (e.key === 'ArrowRight' && currentPage < pages.length - 1) {
            window.flipToPage(currentPage + 1, 'next');
        }
    });
    
    // Load pages on startup
    loadPages();
    
    // Handle window resize (mobile/desktop switch)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const wasMobile = isMobile;
            const nowMobile = isMobileDevice();
            
            if (wasMobile !== nowMobile) {
                // Reload if switching between mobile/desktop
                location.reload();
            }
        }, 250);
    });
    
    // Add swipe hint for mobile (first visit)
    if (isMobile && !sessionStorage.getItem('swipeHintShown')) {
        const swipeHint = document.createElement('div');
        swipeHint.className = 'swipe-hint';
        swipeHint.textContent = '← Swipe to turn pages →';
        document.body.appendChild(swipeHint);
        
        setTimeout(() => {
            swipeHint.remove();
            sessionStorage.setItem('swipeHintShown', 'true');
        }, 3000);
    }
});
