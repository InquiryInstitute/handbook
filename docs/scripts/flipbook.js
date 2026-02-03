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
        // Cover is already in the DOM, add it to pages array
        const coverPage = document.getElementById('cover-page');
        if (coverPage) {
            pages.push({ html: coverPage.outerHTML, type: 'cover', element: coverPage });
        } else {
            // Fallback: load cover via fetch
            try {
                const coverResponse = await fetch('pages/cover.html');
                const coverHtml = await coverResponse.text();
                pages.push({ html: coverHtml, type: 'cover' });
            } catch (error) {
                console.warn('Could not load cover:', error);
            }
        }
        
        // Table of Contents
        try {
            const tocResponse = await fetch('pages/toc.html');
            const tocHtml = await tocResponse.text();
            pages.push({ html: tocHtml, type: 'toc' });
        } catch (error) {
            console.warn('Could not load TOC:', error);
        }
        
        // Load chapters from HTML files
        const chapters = [
            { file: 'pages/chapters/00-front-matter/00-welcome-desk.html', title: 'The Welcome Desk' },
            { file: 'pages/chapters/01-jurisdiction/01-jurisdiction-authority.html', title: 'Jurisdiction & Authority' },
            { file: 'pages/chapters/02-faculty-identity/02-becoming-faculty.html', title: 'Becoming Faculty' },
            { file: 'pages/chapters/02-faculty-identity/03-on-persona.html', title: 'On Persona' },
            { file: 'pages/chapters/03-teaching/04-teaching-at-institute.html', title: 'Teaching at Inquiry Institute' },
            { file: 'pages/chapters/03-teaching/05-course-construction.html', title: 'Course Construction' },
            { file: 'pages/chapters/03-teaching/06-exams-questions-maieutics.html', title: 'Exams, Questions, & Maieutics' },
            { file: 'pages/chapters/04-writing/07-writing-commonplace.html', title: 'Writing in the Commonplace' },
            { file: 'pages/chapters/04-writing/08-encyclopaedia-contributions.html', title: 'Encyclopaedia Contributions' },
        ];
        
        for (const chapter of chapters) {
            try {
                const response = await fetch(chapter.file);
                if (response.ok) {
                    const html = await response.text();
                    // Extract content from the page wrapper
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    const pageContent = tempDiv.querySelector('.page');
                    if (pageContent) {
                        const chapterPages = splitIntoPages(pageContent.innerHTML, chapter.title);
                        pages.push(...chapterPages);
                    } else {
                        // If no .page wrapper, use the HTML directly
                        const chapterPages = splitIntoPages(html, chapter.title);
                        pages.push(...chapterPages);
                    }
                } else {
                    console.warn(`Could not load ${chapter.file}: ${response.status}`);
                }
            } catch (error) {
                console.warn(`Error loading ${chapter.file}:`, error);
            }
        }
        
        // Initialize flipbook (cover is already visible)
        initializeFlipbook();
    }
    
    // Simple markdown to HTML converter
    function markdownToHtml(markdown, title) {
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // Code blocks
        html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Blockquotes
        html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
        
        // Horizontal rules
        html = html.replace(/^---$/gim, '<hr>');
        
        // Paragraphs
        const lines = html.split('\n');
        html = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.match(/^<[^>]+>/) || trimmed.match(/^#|^>|^`/)) {
                return line;
            }
            return `<p>${trimmed}</p>`;
        }).join('\n');
        
        return `<div class="page"><h1>${title}</h1>${html}</div>`;
    }
    
    function splitIntoPages(html, title) {
        // Split content to fit pages without scrolling - estimate based on character count
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Extract content from page wrapper if it exists
        let contentElements = Array.from(tempDiv.children);
        if (contentElements.length === 1 && contentElements[0].classList.contains('page')) {
            contentElements = Array.from(contentElements[0].children);
        }
        
        const pages = [];
        let currentPageContent = '';
        // Estimate: ~2000 characters per page (roughly 300-400 words, accounting for HTML)
        const charsPerPage = 2000;
        let currentChars = 0;
        
        // Check if title is already in content
        let hasTitle = false;
        for (const el of contentElements) {
            if (el.tagName === 'H1' && el.textContent.includes(title)) {
                hasTitle = true;
                break;
            }
        }
        
        if (!hasTitle) {
            currentPageContent = `<h1>${title}</h1>`;
            currentChars += title.length + 10; // Rough estimate for h1 tag
        }
        
        for (const element of contentElements) {
            // Skip duplicate title
            if (element.tagName === 'H1' && element.textContent.includes(title) && hasTitle) {
                continue;
            }
            
            const elementHTML = element.outerHTML;
            const elementChars = elementHTML.length;
            const textContent = element.textContent || '';
            
            // Split on major headings (h2) if we're getting close to limit
            if (currentChars > 0 && (currentChars + elementChars > charsPerPage || (element.tagName === 'H2' && currentChars > charsPerPage * 0.7))) {
                pages.push({ html: `<div class="page">${currentPageContent}</div>`, type: 'content' });
                currentPageContent = '';
                currentChars = 0;
            }
            
            // If a single element is too long, split it (for very long paragraphs)
            if (elementChars > charsPerPage && element.tagName === 'P') {
                const text = textContent;
                const words = text.split(/\s+/);
                const wordsPerChunk = Math.floor(words.length / Math.ceil(elementChars / charsPerPage));
                
                for (let i = 0; i < words.length; i += wordsPerChunk) {
                    const chunk = words.slice(i, i + wordsPerChunk).join(' ');
                    if (currentChars + chunk.length > charsPerPage && currentChars > 0) {
                        pages.push({ html: `<div class="page">${currentPageContent}</div>`, type: 'content' });
                        currentPageContent = '';
                        currentChars = 0;
                    }
                    currentPageContent += `<p>${chunk}</p>`;
                    currentChars += chunk.length + 10;
                }
            } else {
                currentPageContent += elementHTML;
                currentChars += elementChars;
            }
        }
        
        if (currentPageContent.trim()) {
            pages.push({ html: `<div class="page">${currentPageContent}</div>`, type: 'content' });
        }
        
        return pages.length > 0 ? pages : [{ html: `<div class="page"><h1>${title}</h1><p>Content loading...</p></div>`, type: 'content' }];
    }
    
    function initializeFlipbook() {
        // Cover is already in DOM, don't recreate it
        const existingCover = document.getElementById('cover-page');
        
        // Create page elements for non-cover pages
        pages.forEach((page, index) => {
            // Skip cover if it already exists in DOM
            if (index === 0 && existingCover) {
                return;
            }
            
            const pageElement = document.createElement('div');
            pageElement.className = `page ${page.type}`;
            
            // If page has element reference, use it; otherwise parse HTML
            if (page.element) {
                // Already in DOM, just reference it
                page.element = page.element;
            } else {
                // Create new element from HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = page.html;
                const content = tempDiv.firstElementChild || tempDiv;
                pageElement.innerHTML = content.innerHTML;
                pageElement.className = content.className || pageElement.className;
            }
            
            // Immediately hide all pages except cover (book starts closed)
            if (index > 0) {
                pageElement.style.display = 'none';
                pageElement.style.opacity = '0';
                pageElement.style.visibility = 'hidden';
            }
            
            flipbook.appendChild(pageElement);
        });
        
        // Ensure TOC page exists if it wasn't created
        if (pages.length > 1 && !flipbook.querySelector('.page.toc')) {
            const tocPage = document.createElement('div');
            tocPage.className = 'page toc';
            tocPage.innerHTML = pages[1].html || '<div class="page toc"><h1>Table of Contents</h1><p>Loading...</p></div>';
            tocPage.style.display = 'none';
            tocPage.style.opacity = '0';
            tocPage.style.visibility = 'hidden';
            flipbook.appendChild(tocPage);
        }
        
        // Initialize page flip with CSS-based animation
        // Using a custom implementation for better control
        initializePageFlip();
        totalPagesSpan.textContent = Math.max(pages.length, flipbook.querySelectorAll('.page').length);
        updateControls();
        
        // Debug: log page count
        console.log('Initialized flipbook with', pages.length, 'pages,', flipbook.querySelectorAll('.page').length, 'page elements');
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
        // Initialize pages for mobile - start with book "closed" (only cover visible)
        pageElements.forEach((page, i) => {
            if (i === 0) {
                // Cover is active and visible - ensure it's shown
                page.classList.add('active');
                page.style.display = 'block';
                page.style.opacity = '1';
                page.style.transform = 'rotateY(0deg)';
                page.style.zIndex = '1000';
                page.style.visibility = 'visible';
            } else {
                // All other pages are hidden (book is closed) - force hide
                page.classList.remove('active', 'next', 'prev', 'flipping');
                page.style.display = 'none';
                page.style.opacity = '0';
                page.style.visibility = 'hidden';
            }
        });
        
        // Show next page when user clicks next (opens the book)
        if (pageElements.length > 1) {
            pageElements[1].classList.add('next');
        }
        
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
            
            // Show target page
            pageElements[targetIndex].style.display = 'block';
            pageElements[targetIndex].style.visibility = 'visible';
            
            if (direction === 'next') {
                pageElements[prevIndex].style.transform = 'rotateY(-180deg)';
                pageElements[prevIndex].style.opacity = '0';
            } else {
                pageElements[prevIndex].style.transform = 'rotateY(180deg)';
                pageElements[prevIndex].style.opacity = '0';
            }
            
            pageElements[targetIndex].style.transform = 'rotateY(0deg)';
            pageElements[targetIndex].style.opacity = '1';
            pageElements[targetIndex].classList.add('active');
            
            // Update adjacent pages (only show if we're navigating to them)
            if (targetIndex > 0 && Math.abs(targetIndex - (targetIndex - 1)) <= 1) {
                pageElements[targetIndex - 1].classList.remove('active', 'next', 'prev');
                pageElements[targetIndex - 1].classList.add('prev');
                pageElements[targetIndex - 1].style.display = 'block';
                pageElements[targetIndex - 1].style.visibility = 'visible';
            }
            if (targetIndex < pageElements.length - 1 && Math.abs(targetIndex - (targetIndex + 1)) <= 1) {
                pageElements[targetIndex + 1].classList.remove('active', 'next', 'prev');
                pageElements[targetIndex + 1].classList.add('next');
                pageElements[targetIndex + 1].style.display = 'block';
                pageElements[targetIndex + 1].style.visibility = 'visible';
            }
            
            currentPage = targetIndex;
            
            setTimeout(() => {
                pageElements[prevIndex].classList.remove('flipping');
                pageElements[targetIndex].classList.remove('flipping');
                pageElements[prevIndex].style.transform = 'rotateY(0deg)';
                // Hide previous page if not adjacent
                if (Math.abs(prevIndex - targetIndex) > 1) {
                    pageElements[prevIndex].style.display = 'none';
                    pageElements[prevIndex].style.visibility = 'hidden';
                }
                // Hide pages that are more than 1 away from current
                pageElements.forEach((page, i) => {
                    if (Math.abs(i - targetIndex) > 1) {
                        page.style.display = 'none';
                        page.style.visibility = 'hidden';
                    }
                });
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
        // Desktop: Book-style flip - start with book "closed" (only cover visible)
        pageElements.forEach((page, i) => {
            if (i === 0) {
                // Cover is visible (book closed) - ensure it's shown
                page.style.zIndex = pages.length + 1000;
                page.style.transform = 'rotateY(0deg)';
                page.style.opacity = '1';
                page.style.display = 'block';
                page.classList.add('active');
            } else {
                // All other pages are hidden (book is closed) - force hide
                page.style.zIndex = pages.length - i;
                page.style.transform = 'rotateY(0deg)';
                page.style.opacity = '0';
                page.style.display = 'none';
                page.style.visibility = 'hidden';
                page.classList.remove('active');
            }
        });
        
        function showPage(index, direction = 'next') {
            if (isFlipping || index < 0 || index >= pageElements.length) return;
            isFlipping = true;
            
            const targetIndex = index;
            const prevIndex = currentPage;
            
            // Show target page
            pageElements[targetIndex].style.display = 'block';
            pageElements[targetIndex].style.visibility = 'visible';
            
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
                // Reset previous page position and hide if not adjacent
                pageElements[prevIndex].style.transform = 'rotateY(0deg)';
                if (Math.abs(prevIndex - targetIndex) > 1) {
                    pageElements[prevIndex].style.display = 'none';
                }
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
        const pageElements = flipbook.querySelectorAll('.page');
        if (currentPage > 0 && !isFlipping && pageElements.length > 0) {
            window.flipToPage(currentPage - 1, 'prev');
        }
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pageElements = flipbook.querySelectorAll('.page');
        const totalPages = pageElements.length;
        
        if (currentPage < totalPages - 1 && !isFlipping && totalPages > 0) {
            window.flipToPage(currentPage + 1, 'next');
        }
    });
    
    // Also allow clicking on cover to open the book
    document.addEventListener('click', (e) => {
        const coverPage = document.getElementById('cover-page');
        const pageElements = flipbook.querySelectorAll('.page');
        if (coverPage && coverPage.contains(e.target) && currentPage === 0 && pageElements.length > 1 && !isFlipping) {
            // Clicking cover opens to first page
            window.flipToPage(1, 'next');
        }
    });
    
    // Ensure flipToPage is available even if pages haven't loaded
    window.flipToPage = window.flipToPage || function(index, direction) {
        const pageElements = flipbook.querySelectorAll('.page');
        if (index >= 0 && index < pageElements.length) {
            pageElements.forEach((page, i) => {
                if (i === index) {
                    page.style.display = 'block';
                    page.style.opacity = '1';
                    page.style.zIndex = '1000';
                } else {
                    page.style.display = 'none';
                    page.style.opacity = '0';
                }
            });
            currentPage = index;
            updateControls();
        }
    };
    
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
    
    // Universal flip function that always works
    function universalFlipToPage(index, direction) {
        const pageElements = Array.from(flipbook.querySelectorAll('.page'));
        console.log('flipToPage called:', index, direction, 'total pages:', pageElements.length, 'current:', currentPage, 'isFlipping:', isFlipping);
        
        if (index < 0 || index >= pageElements.length) {
            console.warn('Invalid page index:', index);
            return;
        }
        
        if (isFlipping) {
            console.warn('Already flipping, ignoring');
            return;
        }
        
        isFlipping = true;
        const prevIndex = currentPage;
        const targetIndex = index;
        
        console.log('Flipping from', prevIndex, 'to', targetIndex);
        
        // Ensure target page exists
        if (!pageElements[targetIndex]) {
            console.error('Target page does not exist:', targetIndex);
            isFlipping = false;
            return;
        }
        
        // Show target page
        pageElements[targetIndex].style.display = 'block';
        pageElements[targetIndex].style.opacity = '1';
        pageElements[targetIndex].style.visibility = 'visible';
        pageElements[targetIndex].style.zIndex = '1000';
        pageElements[targetIndex].style.transform = 'rotateY(0deg)';
        pageElements[targetIndex].classList.add('active');
        
        // Hide current page with animation
        if (pageElements[prevIndex]) {
            if (direction === 'next') {
                pageElements[prevIndex].style.transform = 'rotateY(-180deg)';
            } else {
                pageElements[prevIndex].style.transform = 'rotateY(180deg)';
            }
            pageElements[prevIndex].style.opacity = '0';
            pageElements[prevIndex].classList.remove('active');
        }
        
        currentPage = targetIndex;
        
        setTimeout(() => {
            if (pageElements[prevIndex]) {
                pageElements[prevIndex].style.display = 'none';
                pageElements[prevIndex].style.visibility = 'hidden';
                pageElements[prevIndex].style.transform = 'rotateY(0deg)';
            }
            isFlipping = false;
            updateControls();
            console.log('Flip complete, now on page', currentPage);
        }, 600);
    }
    
    // Set up flipToPage immediately - this is the master function
    window.flipToPage = universalFlipToPage;
    
    // Load pages on startup
    loadPages().then(() => {
        // After pages load, ensure flipToPage still works
        const pageElements = Array.from(flipbook.querySelectorAll('.page'));
        if (pageElements.length > 0) {
            console.log('Pages loaded, total:', pageElements.length);
            // Ensure flipToPage is still set
            if (!window.flipToPage) {
                window.flipToPage = universalFlipToPage;
            }
            updateControls();
        }
    }).catch(err => {
        console.error('Error loading pages:', err);
        // Even if loading fails, ensure flipToPage works with what we have
        if (!window.flipToPage) {
            window.flipToPage = universalFlipToPage;
        }
    });
    
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
