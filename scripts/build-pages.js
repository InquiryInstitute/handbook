#!/usr/bin/env node

/**
 * Build script to convert Markdown chapters to HTML pages for the flipbook
 */

const fs = require('fs');
const path = require('path');

// Simple markdown to HTML converter (basic implementation)
// For production, consider using marked or markdown-it
function markdownToHtml(markdown) {
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
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
    
    // Paragraphs (lines that aren't already HTML)
    html = html.split('\n').map(line => {
        if (line.trim() && !line.match(/^<[^>]+>/) && !line.match(/^#|^>|^`/)) {
            return `<p>${line.trim()}</p>`;
        }
        return line;
    }).join('\n');
    
    return html;
}

function buildPages() {
    const chaptersDir = path.join(__dirname, '..', 'chapters');
    const pagesDir = path.join(__dirname, '..', 'docs', 'pages', 'chapters');
    
    // Ensure pages directory exists
    if (!fs.existsSync(pagesDir)) {
        fs.mkdirSync(pagesDir, { recursive: true });
    }
    
    // Find all markdown files
    function findMarkdownFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                findMarkdownFiles(filePath, fileList);
            } else if (file.endsWith('.md')) {
                fileList.push(filePath);
            }
        });
        
        return fileList;
    }
    
    const markdownFiles = findMarkdownFiles(chaptersDir);
    
    markdownFiles.forEach(mdFile => {
        const content = fs.readFileSync(mdFile, 'utf8');
        const html = markdownToHtml(content);
        
        // Create HTML page wrapper
        const pageHtml = `<div class="page">${html}</div>`;
        
        // Generate output filename
        const relativePath = path.relative(chaptersDir, mdFile);
        const htmlFile = path.join(pagesDir, relativePath.replace('.md', '.html'));
        
        // Ensure directory exists
        const htmlDir = path.dirname(htmlFile);
        if (!fs.existsSync(htmlDir)) {
            fs.mkdirSync(htmlDir, { recursive: true });
        }
        
        fs.writeFileSync(htmlFile, pageHtml);
        console.log(`Converted: ${mdFile} -> ${htmlFile}`);
    });
    
    console.log(`\nBuilt ${markdownFiles.length} pages`);
}

buildPages();
