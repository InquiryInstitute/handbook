// Handbook Flipbook Implementation
// Using stPageFlip with proper configuration

document.addEventListener('DOMContentLoaded', function() {
    const flipbook = document.getElementById('flipbook');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    
    const isMobile = window.innerWidth <= 768;
    
    const pages = [];
    let pageFlipInstance = null;
    
    async function loadPages() {
        const coverPage = document.getElementById('cover-page');
        if (coverPage) {
            pages.push({ html: coverPage.outerHTML, type: 'cover', element: coverPage });
        }
        
        try {
            const tocResponse = await fetch('pages/toc.html');
            const tocHtml = await tocResponse.text();
            pages.push({ html: tocHtml, type: 'toc' });
        } catch (error) {
            console.warn('Could not load TOC:', error);
        }
        
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
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    const pageContent = tempDiv.querySelector('.page');
                    if (pageContent) {
                        const chapterPages = splitIntoPages(pageContent.innerHTML, chapter.title);
                        pages.push(...chapterPages);
                    } else {
                        const chapterPages = splitIntoPages(html, chapter.title);
                        pages.push(...chapterPages);
                    }
                }
            } catch (error) {
                console.warn(`Error loading ${chapter.file}:`, error);
            }
        }
        
        initializeFlipbook();
    }
    
    function splitIntoPages(html, title) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        let contentElements = Array.from(tempDiv.children);
        if (contentElements.length === 1 && contentElements[0].classList.contains('page')) {
            contentElements = Array.from(contentElements[0].children);
        }
        
        const resultPages = [];
        let currentPageContent = '';
        const charsPerPage = 2000;
        let currentChars = 0;
        
        let hasTitle = false;
        for (const el of contentElements) {
            if (el.tagName === 'H1' && el.textContent.includes(title)) {
                hasTitle = true;
                break;
            }
        }
        
        if (!hasTitle) {
            currentPageContent = `<h1>${title}</h1>`;
            currentChars += title.length + 10;
        }
        
        for (const element of contentElements) {
            if (element.tagName === 'H1' && element.textContent.includes(title) && hasTitle) {
                continue;
            }
            
            const elementHTML = element.outerHTML;
            const elementChars = elementHTML.length;
            const textContent = element.textContent || '';
            
            if (currentChars > 0 && (currentChars + elementChars > charsPerPage || (element.tagName === 'H2' && currentChars > charsPerPage * 0.7))) {
                resultPages.push({ html: `<div class="page">${currentPageContent}</div>`, type: 'content' });
                currentPageContent = '';
                currentChars = 0;
            }
            
            if (elementChars > charsPerPage && element.tagName === 'P') {
                const text = textContent;
                const words = text.split(/\s+/);
                const wordsPerChunk = Math.floor(words.length / Math.ceil(elementChars / charsPerPage));
                
                for (let i = 0; i < words.length; i += wordsPerChunk) {
                    const chunk = words.slice(i, i + wordsPerChunk).join(' ');
                    if (currentChars + chunk.length > charsPerPage && currentChars > 0) {
                        resultPages.push({ html: `<div class="page">${currentPageContent}</div>`, type: 'content' });
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
            resultPages.push({ html: `<div class="page">${currentPageContent}</div>`, type: 'content' });
        }
        
        return resultPages.filter(page => {
            const temp = document.createElement('div');
            temp.innerHTML = page.html;
            return (temp.textContent || '').trim().length > 0;
        });
    }
    
    function initializeFlipbook() {
        // Clear container
        const coverPage = document.getElementById('cover-page');
        const existingPages = Array.from(flipbook.querySelectorAll('.page:not(#cover-page)'));
        existingPages.forEach(page => page.remove());
        
        const pageElements = [];
        
        // Create all pages
        pages.forEach((page, index) => {
            let pageElement;
            
            if (index === 0 && coverPage) {
                pageElement = coverPage;
            } else {
                pageElement = document.createElement('div');
                pageElement.className = `page ${page.type}`;
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = page.html;
                const content = tempDiv.firstElementChild || tempDiv;
                
                if (!content.innerHTML || content.innerHTML.trim().length === 0) {
                    return;
                }
                
                if (content.classList.contains('page')) {
                    pageElement.innerHTML = content.innerHTML;
                    Array.from(content.classList).forEach(cls => {
                        if (cls !== 'page') pageElement.classList.add(cls);
                    });
                } else {
                    pageElement.innerHTML = content.innerHTML;
                }
                
                if (!pageElement.classList.contains('cover')) {
                    pageElement.style.background = '#faf8f3';
                }
                
                flipbook.appendChild(pageElement);
            }
            
            pageElements.push(pageElement);
        });
        
        // Initialize stPageFlip
        const pageWidth = 800;
        const pageHeight = 1000;
        const bookWidth = isMobile ? pageWidth : pageWidth * 2;
        
        const settings = {
            width: bookWidth,
            height: pageHeight,
            minWidth: isMobile ? 300 : bookWidth,
            maxWidth: isMobile ? 800 : bookWidth,
            minHeight: 400,
            maxHeight: 1500,
            maxShadowOpacity: 0.5,
            showCover: false,
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
            pageFlipInstance.loadFromHTML(pageElements);
            
            pageFlipInstance.on('flip', (e) => {
                updateControls(e.data);
            });
            
            // Navigation
            prevBtn.addEventListener('click', () => {
                if (pageFlipInstance) pageFlipInstance.flipPrev();
            });
            
            nextBtn.addEventListener('click', () => {
                if (pageFlipInstance) pageFlipInstance.flipNext();
            });
            
            // Cover click
            if (coverPage) {
                coverPage.addEventListener('click', () => {
                    if (pageFlipInstance && pageFlipInstance.getCurrentPageIndex() === 0) {
                        pageFlipInstance.flipNext();
                    }
                });
            }
            
            // Keyboard
            document.addEventListener('keydown', (e) => {
                if (pageFlipInstance) {
                    if (e.key === 'ArrowLeft') {
                        pageFlipInstance.flipPrev();
                    } else if (e.key === 'ArrowRight') {
                        pageFlipInstance.flipNext();
                    }
                }
            });
            
            // TOC links
            document.addEventListener('click', (e) => {
                if (e.target.matches('.toc a[data-page]')) {
                    e.preventDefault();
                    const targetPage = parseInt(e.target.getAttribute('data-page'));
                    if (pageFlipInstance) {
                        pageFlipInstance.flip(targetPage);
                    }
                }
            });
            
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
    
    loadPages();
});
