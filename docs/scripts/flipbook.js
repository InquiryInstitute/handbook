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
    let pageFlipInstance = null;
    
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
        
        // Initialize flipbook
        initializeFlipbook();
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
        
        // Filter out empty pages
        const validPages = pages.filter(page => {
            const temp = document.createElement('div');
            temp.innerHTML = page.html;
            const text = temp.textContent || '';
            return text.trim().length > 0;
        });
        
        return validPages.length > 0 ? validPages : [{ html: `<div class="page"><h1>${title}</h1><p>Content loading...</p></div>`, type: 'content' }];
    }
    
    function initializeFlipbook() {
        // Clear flipbook container completely - stPageFlip will manage all pages
        flipbook.innerHTML = '';
        
        // Create page elements for stPageFlip
        const pageElements = [];
        
        // Create all pages (including cover)
        pages.forEach((page, index) => {
            const pageElement = document.createElement('div');
            pageElement.className = `page ${page.type}`;
            if (index === 0) {
                pageElement.id = 'cover-page';
            }
            pageElement.setAttribute('data-density', 'hard');
            
            // Create new element from HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = page.html;
            const content = tempDiv.firstElementChild || tempDiv;
            
            // Ensure page has content
            if (!content.innerHTML || content.innerHTML.trim().length === 0) {
                console.warn('Empty page detected at index', index, 'skipping');
                return; // Skip empty pages
            }
            
            // Extract innerHTML from content (remove wrapper div if present)
            if (content.classList.contains('page')) {
                pageElement.innerHTML = content.innerHTML;
                // Preserve classes from content
                Array.from(content.classList).forEach(cls => {
                    if (cls !== 'page') {
                        pageElement.classList.add(cls);
                    }
                });
            } else {
                pageElement.innerHTML = content.innerHTML;
            }
            
            // Ensure page has background
            if (!pageElement.classList.contains('cover')) {
                pageElement.style.background = '#faf8f3';
            }
            
            // Append to flipbook (stPageFlip will manage them)
            flipbook.appendChild(pageElement);
            pageElements.push(pageElement);
        });
        
        // Initialize stPageFlip
        const bookWidth = isMobile ? 800 : 1600; // Single page on mobile, two pages on desktop
        const bookHeight = 1000;
        
        const settings = {
            width: bookWidth,
            height: bookHeight,
            minWidth: 300,
            maxWidth: 2000,
            minHeight: 400,
            maxHeight: 1500,
            maxShadowOpacity: 0.5,
            showCover: false, // We'll handle cover positioning manually
            mobileScrollSupport: isMobile,
            usePortrait: true,
            startPage: 0,
            drawShadow: true,
            flippingTime: 600,
            disableFlipByClick: false,
            singlePageMode: isMobile
        };
        
        try {
            pageFlipInstance = new St.PageFlip(flipbook, settings);
            
            // Load pages into stPageFlip
            pageFlipInstance.loadFromHTML(pageElements);
            
            // Event listeners
            pageFlipInstance.on('flip', (e) => {
                const currentPage = e.data;
                updateControls(currentPage);
            });
            
            // Ensure cover starts on right side for desktop
            if (!isMobile) {
                pageFlipInstance.on('init', () => {
                    // For desktop, we want the cover to appear on the right initially
                    // stPageFlip should handle this, but we can ensure it
                    const coverPage = pageElements[0];
                    if (coverPage) {
                        // Wait a bit for stPageFlip to initialize
                        setTimeout(() => {
                            // Check if cover needs to be positioned on right
                            const hasRightClass = coverPage.classList.contains('stf__item--right');
                            if (!hasRightClass) {
                                // Force right positioning for cover
                                coverPage.classList.add('stf__item--right');
                            }
                        }, 100);
                    }
                });
            }
            
            // Navigation buttons
            prevBtn.addEventListener('click', () => {
                if (pageFlipInstance) {
                    pageFlipInstance.flipPrev();
                }
            });
            
            nextBtn.addEventListener('click', () => {
                if (pageFlipInstance) {
                    pageFlipInstance.flipNext();
                }
            });
            
            // Cover click to open
            const coverPage = pageElements[0];
            if (coverPage) {
                coverPage.addEventListener('click', () => {
                    if (pageFlipInstance && pageFlipInstance.getCurrentPageIndex() === 0) {
                        pageFlipInstance.flipNext();
                    }
                });
            }
            
            // Table of Contents navigation
            document.addEventListener('click', (e) => {
                if (e.target.matches('.toc a[data-page]')) {
                    e.preventDefault();
                    const targetPage = parseInt(e.target.getAttribute('data-page'));
                    if (pageFlipInstance) {
                        pageFlipInstance.flip(targetPage);
                    }
                }
            });
            
            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (pageFlipInstance) {
                    if (e.key === 'ArrowLeft') {
                        pageFlipInstance.flipPrev();
                    } else if (e.key === 'ArrowRight') {
                        pageFlipInstance.flipNext();
                    }
                }
            });
            
            // Update controls
            updateControls(0);
            totalPagesSpan.textContent = pageElements.length;
            
            console.log('stPageFlip initialized with', pageElements.length, 'pages');
        } catch (error) {
            console.error('Error initializing stPageFlip:', error);
        }
    }
    
    function updateControls(currentPageIndex = null) {
        if (pageFlipInstance) {
            const current = currentPageIndex !== null ? currentPageIndex : pageFlipInstance.getCurrentPageIndex();
            currentPageSpan.textContent = current + 1;
            prevBtn.disabled = current === 0;
            nextBtn.disabled = current >= pages.length - 1;
        }
    }
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (pageFlipInstance) {
                const wasMobile = isMobile;
                const nowMobile = isMobileDevice();
                
                if (wasMobile !== nowMobile) {
                    // Reload if switching between mobile/desktop
                    location.reload();
                } else {
                    // Update size
                    pageFlipInstance.update();
                }
            }
        }, 250);
    });
    
    // Load pages on startup
    loadPages();
});
