// Handbook Flipbook Implementation
// Simple, working two-page spread flipbook

document.addEventListener('DOMContentLoaded', function() {
    const flipbook = document.getElementById('flipbook');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    
    // Detect mobile
    const isMobile = window.innerWidth <= 768;
    
    // Page data
    const pages = [];
    let currentPageIndex = 0;
    let isFlipping = false;
    
    // Load pages
    async function loadPages() {
        // Cover is already in DOM
        const coverPage = document.getElementById('cover-page');
        if (coverPage) {
            pages.push({ html: coverPage.outerHTML, type: 'cover', element: coverPage });
        }
        
        // Table of Contents
        try {
            const tocResponse = await fetch('pages/toc.html');
            const tocHtml = await tocResponse.text();
            pages.push({ html: tocHtml, type: 'toc' });
        } catch (error) {
            console.warn('Could not load TOC:', error);
        }
        
        // Load chapters
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
        // Clear container except cover
        const coverPage = document.getElementById('cover-page');
        const existingPages = Array.from(flipbook.querySelectorAll('.page:not(#cover-page)'));
        existingPages.forEach(page => page.remove());
        
        // Create page elements
        const pageElements = [];
        
        // Add cover
        if (coverPage) {
            pageElements.push(coverPage);
        }
        
        // Create other pages
        pages.forEach((page, index) => {
            if (index === 0 && coverPage) return;
            
            const pageElement = document.createElement('div');
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
            pageElements.push(pageElement);
        });
        
        // Initialize display
        showPages(0);
        totalPagesSpan.textContent = pageElements.length;
        updateControls();
        
        // Navigation
        prevBtn.addEventListener('click', () => {
            if (currentPageIndex > 0 && !isFlipping) {
                showPages(currentPageIndex - 1);
            }
        });
        
        nextBtn.addEventListener('click', () => {
            if (currentPageIndex < pageElements.length - 1 && !isFlipping) {
                showPages(currentPageIndex + 1);
            }
        });
        
        // Cover click
        if (coverPage) {
            coverPage.addEventListener('click', () => {
                if (currentPageIndex === 0 && !isFlipping) {
                    showPages(1);
                }
            });
        }
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && currentPageIndex > 0) {
                showPages(currentPageIndex - 1);
            } else if (e.key === 'ArrowRight' && currentPageIndex < pageElements.length - 1) {
                showPages(currentPageIndex + 1);
            }
        });
        
        // TOC links
        document.addEventListener('click', (e) => {
            if (e.target.matches('.toc a[data-page]')) {
                e.preventDefault();
                const targetPage = parseInt(e.target.getAttribute('data-page'));
                showPages(targetPage);
            }
        });
    }
    
    function showPages(index) {
        if (isFlipping || index < 0 || index >= pages.length) return;
        
        isFlipping = true;
        const pageElements = Array.from(flipbook.querySelectorAll('.page'));
        const prevIndex = currentPageIndex;
        currentPageIndex = index;
        
        // Hide all pages
        pageElements.forEach(page => {
            page.style.display = 'none';
            page.style.opacity = '0';
        });
        
        // Show current pages (two-page spread on desktop)
        if (isMobile) {
            // Mobile: single page
            if (pageElements[index]) {
                pageElements[index].style.display = 'block';
                pageElements[index].style.opacity = '1';
            }
        } else {
            // Desktop: two-page spread
            const leftIndex = index % 2 === 0 ? index : index - 1;
            const rightIndex = index % 2 === 0 ? index + 1 : index;
            
            // Left page
            if (pageElements[leftIndex]) {
                pageElements[leftIndex].style.display = 'block';
                pageElements[leftIndex].style.opacity = '1';
                pageElements[leftIndex].style.left = '0';
                pageElements[leftIndex].style.width = '800px';
            }
            
            // Right page
            if (pageElements[rightIndex]) {
                pageElements[rightIndex].style.display = 'block';
                pageElements[rightIndex].style.opacity = '1';
                pageElements[rightIndex].style.left = '800px';
                pageElements[rightIndex].style.width = '800px';
            }
        }
        
        // Animate
        requestAnimationFrame(() => {
            setTimeout(() => {
                isFlipping = false;
                updateControls();
            }, 300);
        });
    }
    
    function updateControls() {
        currentPageSpan.textContent = currentPageIndex + 1;
        prevBtn.disabled = currentPageIndex === 0;
        nextBtn.disabled = currentPageIndex >= pages.length - 1;
    }
    
    // Load pages
    loadPages();
});
