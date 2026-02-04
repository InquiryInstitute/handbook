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
    let currentSpread = 0; // 0 = cover, 1 = pages 2-3, 2 = pages 4-5, etc.
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
            
            // Render first spread (cover)
            renderSpread(0);
            
            // Navigation
            prevBtn.addEventListener('click', () => {
                if (currentSpread > 0) {
                    renderSpread(currentSpread - 1);
                }
            });
            
            nextBtn.addEventListener('click', () => {
                const maxSpread = Math.floor((totalPages - 1) / 2);
                if (currentSpread < maxSpread) {
                    renderSpread(currentSpread + 1);
                }
            });
            
            // Keyboard
            document.addEventListener('keydown', (e) => {
                const maxSpread = Math.floor((totalPages - 1) / 2);
                if (e.key === 'ArrowLeft' && currentSpread > 0) {
                    renderSpread(currentSpread - 1);
                } else if (e.key === 'ArrowRight' && currentSpread < maxSpread) {
                    renderSpread(currentSpread + 1);
                }
            });
            
            updateControls();
        }).catch(err => {
            console.error('Error loading PDF:', err);
            flipbook.innerHTML = '<div style="padding: 2rem; text-align: center; color: #fff;"><p>Error loading PDF. Please ensure handbook.pdf exists.</p></div>';
        });
    }
    
    function renderSpread(spreadIndex) {
        if (!pdfDoc) return;
        
        currentSpread = spreadIndex;
        
        // Clear flipbook
        flipbook.innerHTML = '';
        
        if (isMobile) {
            // Mobile: single page
            const pageNum = spreadIndex === 0 ? 1 : (spreadIndex * 2);
            pdfDoc.getPage(pageNum).then(page => {
                const viewport = page.getViewport({ scale: 0.5 });
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
                
                updateControls();
            });
            } else {
                // Desktop: two-page spread (11in x 8.5in landscape = 1056x816px at 96 DPI)
                const container = document.createElement('div');
                container.style.width = '1056px';
                container.style.height = '816px';
                container.style.position = 'relative';
                container.style.margin = '0 auto';
            
                if (spreadIndex === 0) {
                // Cover: blank left, page 1 on right (5.5in x 8.5in = 528x816px at 96 DPI)
                const leftCanvas = document.createElement('canvas');
                const leftContext = leftCanvas.getContext('2d');
                leftCanvas.width = 528;
                leftCanvas.height = 816;
                leftCanvas.style.width = '528px';
                leftCanvas.style.height = '816px';
                leftCanvas.style.position = 'absolute';
                leftCanvas.style.left = '0';
                leftCanvas.style.top = '0';
                leftContext.fillStyle = '#1a1a1a';
                leftContext.fillRect(0, 0, 528, 816);
                container.appendChild(leftCanvas);
                
                pdfDoc.getPage(1).then(page => {
                    const viewport = page.getViewport({ scale: 1 });
                    const scale = 528 / viewport.width;
                    const scaledViewport = page.getViewport({ scale: scale });
                    const rightCanvas = document.createElement('canvas');
                    const rightContext = rightCanvas.getContext('2d');
                    rightCanvas.width = 528;
                    rightCanvas.height = 816;
                    rightCanvas.style.width = '528px';
                    rightCanvas.style.height = '816px';
                    rightCanvas.style.position = 'absolute';
                    rightCanvas.style.left = '528px';
                    rightCanvas.style.top = '0';
                    
                    page.render({
                        canvasContext: rightContext,
                        viewport: scaledViewport
                    });
                    
                    container.appendChild(rightCanvas);
                    flipbook.appendChild(container);
                    updateControls();
                });
            } else {
                // Regular spread: left and right pages
                const leftPageNum = spreadIndex * 2;
                const rightPageNum = leftPageNum + 1;
                
                const leftCanvas = document.createElement('canvas');
                const leftContext = leftCanvas.getContext('2d');
                leftCanvas.width = 528;
                leftCanvas.height = 816;
                leftCanvas.style.width = '528px';
                leftCanvas.style.height = '816px';
                leftCanvas.style.position = 'absolute';
                leftCanvas.style.left = '0';
                leftCanvas.style.top = '0';
                
                const rightCanvas = document.createElement('canvas');
                const rightContext = rightCanvas.getContext('2d');
                rightCanvas.width = 528;
                rightCanvas.height = 816;
                rightCanvas.style.width = '528px';
                rightCanvas.style.height = '816px';
                rightCanvas.style.position = 'absolute';
                rightCanvas.style.left = '528px';
                rightCanvas.style.top = '0';
                
                // Render left page
                const leftPromise = leftPageNum <= totalPages ? 
                    pdfDoc.getPage(leftPageNum).then(leftPage => {
                        const leftViewport = leftPage.getViewport({ scale: 1 });
                        const scale = 528 / leftViewport.width;
                        const scaledViewport = leftPage.getViewport({ scale: scale });
                        leftPage.render({
                            canvasContext: leftContext,
                            viewport: scaledViewport
                        });
                    }) : 
                    Promise.resolve().then(() => {
                        leftContext.fillStyle = '#1a1a1a';
                        leftContext.fillRect(0, 0, 528, 816);
                    });
                
                // Render right page
                const rightPromise = rightPageNum <= totalPages ?
                    pdfDoc.getPage(rightPageNum).then(rightPage => {
                        const rightViewport = rightPage.getViewport({ scale: 1 });
                        const scale = 528 / rightViewport.width;
                        const scaledViewport = rightPage.getViewport({ scale: scale });
                        rightPage.render({
                            canvasContext: rightContext,
                            viewport: scaledViewport
                        });
                    }) :
                    Promise.resolve().then(() => {
                        rightContext.fillStyle = '#1a1a1a';
                        rightContext.fillRect(0, 0, 528, 816);
                    });
                
                Promise.all([leftPromise, rightPromise]).then(() => {
                    container.appendChild(leftCanvas);
                    container.appendChild(rightCanvas);
                    flipbook.appendChild(container);
                    updateControls();
                });
            }
        }
    }
    
    function updateControls() {
        const maxSpread = Math.floor((totalPages - 1) / 2);
        const displayPage = currentSpread === 0 ? 1 : (currentSpread * 2);
        currentPageSpan.textContent = displayPage;
        prevBtn.disabled = currentSpread === 0;
        nextBtn.disabled = currentSpread >= maxSpread;
    }
});
