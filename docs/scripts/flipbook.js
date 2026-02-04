// Handbook Flipbook Implementation
// Display PDF using PDF.js viewer

document.addEventListener('DOMContentLoaded', function() {
    const flipbook = document.getElementById('flipbook');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    
    const isMobile = window.innerWidth <= 768;
    let pdfDoc = null;
    let currentPage = 1;
    let totalPages = 0;
    
    // Load PDF.js
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = initializePDF;
    document.head.appendChild(script);
    
    function initializePDF() {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const pdfPath = 'handbook.pdf';
        
        pdfjsLib.getDocument(pdfPath).promise.then(pdf => {
            pdfDoc = pdf;
            totalPages = pdf.numPages;
            totalPagesSpan.textContent = totalPages;
            
            // Render first page
            renderPage(1);
            
            // Navigation
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    renderPage(currentPage - 1);
                }
            });
            
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    renderPage(currentPage + 1);
                }
            });
            
            // Keyboard
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft' && currentPage > 1) {
                    renderPage(currentPage - 1);
                } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
                    renderPage(currentPage + 1);
                }
            });
            
            updateControls();
        }).catch(err => {
            console.error('Error loading PDF:', err);
            flipbook.innerHTML = '<div style="padding: 2rem; text-align: center; color: #fff;"><p>Error loading PDF. Please ensure handbook.pdf exists.</p></div>';
        });
    }
    
    function renderPage(pageNum) {
        if (!pdfDoc) return;
        
        pdfDoc.getPage(pageNum).then(page => {
            const viewport = page.getViewport({ scale: isMobile ? 0.5 : 1 });
            
            // Clear flipbook
            flipbook.innerHTML = '';
            
            // Create canvas for single page (mobile) or two-page spread (desktop)
            if (isMobile) {
                // Mobile: single page
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                flipbook.appendChild(canvas);
                
                page.render({
                    canvasContext: context,
                    viewport: viewport
                });
            } else {
                // Desktop: two-page spread
                const container = document.createElement('div');
                container.style.width = '1600px';
                container.style.height = '1000px';
                container.style.position = 'relative';
                container.style.display = 'flex';
                
                // Left page (previous page if exists, otherwise blank)
                const leftCanvas = document.createElement('canvas');
                const leftContext = leftCanvas.getContext('2d');
                leftCanvas.style.width = '800px';
                leftCanvas.style.height = '1000px';
                
                if (pageNum > 1) {
                    pdfDoc.getPage(pageNum - 1).then(leftPage => {
                        const leftViewport = leftPage.getViewport({ scale: 1 });
                        leftCanvas.width = leftViewport.width / 2;
                        leftCanvas.height = leftViewport.height;
                        leftPage.render({
                            canvasContext: leftContext,
                            viewport: leftPage.getViewport({ scale: 1, offsetX: -leftViewport.width / 2 })
                        });
                    });
                } else {
                    leftCanvas.width = 800;
                    leftCanvas.height = 1000;
                    leftContext.fillStyle = '#1a1a1a';
                    leftContext.fillRect(0, 0, 800, 1000);
                }
                
                // Right page (current page)
                const rightCanvas = document.createElement('canvas');
                const rightContext = rightCanvas.getContext('2d');
                rightCanvas.width = viewport.width / 2;
                rightCanvas.height = viewport.height;
                rightCanvas.style.width = '800px';
                rightCanvas.style.height = '1000px';
                
                page.render({
                    canvasContext: rightContext,
                    viewport: page.getViewport({ scale: 1, offsetX: -viewport.width / 2 })
                });
                
                container.appendChild(leftCanvas);
                container.appendChild(rightCanvas);
                flipbook.appendChild(container);
            }
            
            currentPage = pageNum;
            updateControls();
        });
    }
    
    function updateControls() {
        currentPageSpan.textContent = currentPage;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage >= totalPages;
    }
});
