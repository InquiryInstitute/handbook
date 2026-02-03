// Handbook Flipbook Implementation
// Using stPageFlip with rendered page images

document.addEventListener('DOMContentLoaded', function() {
    const flipbook = document.getElementById('flipbook');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    
    const isMobile = window.innerWidth <= 768;
    let pageFlipInstance = null;
    
    // Get list of page images
    async function getPageImages() {
        // We know we have pages 000-010 (11 pages)
        const imagePaths = [];
        for (let i = 0; i < 11; i++) {
            const pageNum = i.toString().padStart(3, '0');
            imagePaths.push(`pages/images/page-${pageNum}.png`);
        }
        return imagePaths;
    }
    
    async function initializeFlipbook() {
        const imagePaths = await getPageImages();
        
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
            
            // Load pages from images
            pageFlipInstance.loadFromImages(imagePaths);
            
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
            totalPagesSpan.textContent = imagePaths.length;
            
            console.log('stPageFlip initialized with', imagePaths.length, 'image pages');
        } catch (error) {
            console.error('Error initializing stPageFlip:', error);
        }
    }
    
    function updateControls(currentPageIndex = null) {
        if (pageFlipInstance) {
            const current = currentPageIndex !== null ? currentPageIndex : pageFlipInstance.getCurrentPageIndex();
            currentPageSpan.textContent = current + 1;
            prevBtn.disabled = current === 0;
            const totalPages = parseInt(totalPagesSpan.textContent) || 11;
            nextBtn.disabled = current >= totalPages - 1;
        }
    }
    
    initializeFlipbook();
});
