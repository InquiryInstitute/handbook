// Handbook Flipbook Implementation
// Display JSON content with three-column layout

document.addEventListener('DOMContentLoaded', function() {
    const flipbook = document.getElementById('flipbook');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    
    const isMobile = window.innerWidth <= 768;
    let handbookData = null;
    let pages = [];
    let currentPage = 0;
    
    // Load JSON
    fetch('handbook.json')
        .then(response => response.json())
        .then(data => {
            handbookData = data;
            pages = generatePages(data);
            totalPagesSpan.textContent = pages.length;
            renderPage(0);
            
            // Navigation
            prevBtn.addEventListener('click', () => {
                if (currentPage > 0) {
                    renderPage(currentPage - 1);
                }
            });
            
            nextBtn.addEventListener('click', () => {
                if (currentPage < pages.length - 1) {
                    renderPage(currentPage + 1);
                }
            });
            
            // Keyboard
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft' && currentPage > 0) {
                    renderPage(currentPage - 1);
                } else if (e.key === 'ArrowRight' && currentPage < pages.length - 1) {
                    renderPage(currentPage + 1);
                }
            });
            
            updateControls();
        })
        .catch(err => {
            console.error('Error loading handbook JSON:', err);
            flipbook.innerHTML = '<div style="padding: 2rem; text-align: center; color: #fff;"><p>Error loading handbook. Please ensure handbook.json exists.</p></div>';
        });
    
    function renderBlock(block) {
        switch (block.type) {
            case 'h1':
                return `<h1>${escapeHtml(block.text)}</h1>`;
            case 'h2':
                return `<h2>${escapeHtml(block.text)}</h2>`;
            case 'h3':
                return `<h3>${escapeHtml(block.text)}</h3>`;
            case 'paragraph':
                return `<p>${renderInlineContent(block.content)}</p>`;
            case 'blockquote':
                return `<blockquote>${renderInlineContent(block.content)}</blockquote>`;
            case 'list':
                const tag = block.ordered ? 'ol' : 'ul';
                const items = block.items.map(item => 
                    `<li>${renderInlineContent(item)}</li>`
                ).join('');
                return `<${tag}>${items}</${tag}>`;
            case 'code':
                return `<pre><code class="language-${block.language || ''}">${escapeHtml(block.content)}</code></pre>`;
            case 'hr':
                return '<hr>';
            default:
                return '';
        }
    }
    
    function renderInlineContent(nodes) {
        if (typeof nodes === 'string') {
            return escapeHtml(nodes);
        }
        if (!Array.isArray(nodes)) {
            return '';
        }
        return nodes.map(node => {
            if (typeof node === 'string') {
                return escapeHtml(node);
            }
            switch (node.type) {
                case 'text':
                    return escapeHtml(node.content);
                case 'strong':
                    return `<strong>${escapeHtml(node.content)}</strong>`;
                case 'em':
                    return `<em>${escapeHtml(node.content)}</em>`;
                case 'code':
                    return `<code>${escapeHtml(node.content)}</code>`;
                case 'link':
                    return `<a href="${escapeHtml(node.url)}">${escapeHtml(node.content)}</a>`;
                default:
                    return escapeHtml(node.content || '');
            }
        }).join('');
    }
    
    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function generatePages(data) {
        const pages = [];
        
        // Cover page
        pages.push({
            type: 'cover',
            title: data.metadata.title,
            subtitle: data.metadata.subtitle,
            tagline: data.metadata.tagline
        });
        
        // Table of Contents
        pages.push({
            type: 'toc',
            chapters: data.tableOfContents
        });
        
        // Content pages - generate individual pages, then combine into spreads
        let currentPageContent = [];
        let currentWordCount = 0;
        const wordsPerPage = 500; // Approximate words per page in three columns
        
        data.chapters.forEach((chapter, chapterIndex) => {
            chapter.content.forEach(block => {
                const blockHtml = renderBlock(block);
                const wordCount = countWords(blockHtml);
                
                // Don't split headers from their content
                const isHeader = block.type.startsWith('h');
                const shouldBreak = !isHeader && currentWordCount + wordCount > wordsPerPage && currentPageContent.length > 0;
                
                if (shouldBreak) {
                    pages.push({
                        type: 'content',
                        content: currentPageContent.join('\n')
                    });
                    currentPageContent = [blockHtml];
                    currentWordCount = wordCount;
                } else {
                    currentPageContent.push(blockHtml);
                    currentWordCount += wordCount;
                }
            });
        });
        
        if (currentPageContent.length > 0) {
            pages.push({
                type: 'content',
                content: currentPageContent.join('\n')
            });
        }
        
        return pages;
    }
    
    function countWords(html) {
        const text = html.replace(/<[^>]+>/g, ' ');
        return text.split(/\s+/).filter(w => w.length > 0).length;
    }
    
    function renderPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= pages.length) return;
        
        currentPage = pageIndex;
        const page = pages[pageIndex];
        
        flipbook.innerHTML = '';
        
        if (isMobile) {
            // Mobile: single page
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page mobile-page';
            pageDiv.innerHTML = renderPageContent(page);
            flipbook.appendChild(pageDiv);
        } else {
            // Desktop: two-page spread
            const container = document.createElement('div');
            container.className = 'spread-container';
            container.style.width = '1632px';
            container.style.height = '1056px';
            container.style.position = 'relative';
            container.style.margin = '0 auto';
            
            if (pageIndex === 0) {
                // Cover: blank left, cover on right
                const leftDiv = document.createElement('div');
                leftDiv.className = 'page blank-page';
                leftDiv.style.width = '816px';
                leftDiv.style.height = '1056px';
                leftDiv.style.position = 'absolute';
                leftDiv.style.left = '0';
                leftDiv.style.top = '0';
                container.appendChild(leftDiv);
                
                const rightDiv = document.createElement('div');
                rightDiv.className = 'page cover-page';
                rightDiv.style.width = '816px';
                rightDiv.style.height = '1056px';
                rightDiv.style.position = 'absolute';
                rightDiv.style.left = '816px';
                rightDiv.style.top = '0';
                rightDiv.style.overflow = 'visible';
                rightDiv.innerHTML = renderPageContent(page);
                container.appendChild(rightDiv);
            } else {
                // Regular spread: left and right pages
                // After cover (index 0), spreads start at index 1
                // Spread 1 = pages 1-2, Spread 2 = pages 3-4, etc.
                const leftPageIndex = (pageIndex - 1) * 2 + 1;
                const rightPageIndex = leftPageIndex + 1;
                
                // Left page
                const leftDiv = document.createElement('div');
                leftDiv.className = 'page content-page';
                leftDiv.style.width = '816px';
                leftDiv.style.height = '1056px';
                leftDiv.style.position = 'absolute';
                leftDiv.style.left = '0';
                leftDiv.style.top = '0';
                
                if (leftPageIndex < pages.length && pages[leftPageIndex]) {
                    leftDiv.innerHTML = renderPageContent(pages[leftPageIndex]);
                } else {
                    leftDiv.className = 'page blank-page';
                }
                container.appendChild(leftDiv);
                
                // Right page
                const rightDiv = document.createElement('div');
                rightDiv.className = 'page content-page';
                rightDiv.style.width = '816px';
                rightDiv.style.height = '1056px';
                rightDiv.style.position = 'absolute';
                rightDiv.style.left = '816px';
                rightDiv.style.top = '0';
                
                if (rightPageIndex < pages.length && pages[rightPageIndex]) {
                    rightDiv.innerHTML = renderPageContent(pages[rightPageIndex]);
                } else {
                    rightDiv.className = 'page blank-page';
                }
                container.appendChild(rightDiv);
            }
            
            flipbook.appendChild(container);
        }
        
        updateControls();
    }
    
    function renderPageContent(page) {
        if (page.type === 'cover') {
            return `
                <div class="cover-content">
                    <div class="cover-title-section">
                        <p class="cover-prefix">Handbook for the</p>
                        <h1>Recently<br>Deceased</h1>
                    </div>
                    <div class="cover-image">
                        <img src="covergraphic.png" alt="Inquiry Institute" />
                    </div>
                    <div class="cover-footer">
                        <p class="subtitle">A Practical Guide for Faculty</p>
                        <p class="institute-name">Inquiry Institute</p>
                        <p class="tagline">"${page.tagline}"</p>
                    </div>
                </div>
            `;
        } else if (page.type === 'toc') {
            const tocItems = page.chapters.map((chapter, index) => 
                `<li><a href="#" data-chapter="${index}">${escapeHtml(chapter.title)}</a></li>`
            ).join('');
            return `
                <div class="toc-content">
                    <h1>Table of Contents</h1>
                    <ul class="toc-list">${tocItems}</ul>
                </div>
            `;
        } else {
            return `
                <div class="page-content">
                    ${page.content}
                </div>
                <div class="page-number">${currentPage + 1}</div>
            `;
        }
    }
    
    function updateControls() {
        // Calculate display page number (accounting for spreads)
        let displayPage = 1;
        if (currentPage === 0) {
            displayPage = 1; // Cover
        } else if (isMobile) {
            displayPage = currentPage + 1;
        } else {
            // Desktop: page 0 = cover, page 1 = spread 1 (pages 1-2), etc.
            if (currentPage === 0) {
                displayPage = 1;
            } else {
                displayPage = (currentPage - 1) * 2 + 1;
            }
        }
        
        currentPageSpan.textContent = displayPage;
        prevBtn.disabled = currentPage === 0;
        
        // Calculate total spreads for desktop
        if (!isMobile && pages.length > 1) {
            const totalSpreads = Math.ceil((pages.length - 1) / 2) + 1; // +1 for cover
            totalPagesSpan.textContent = totalSpreads;
        } else {
            totalPagesSpan.textContent = pages.length;
        }
    }
});
