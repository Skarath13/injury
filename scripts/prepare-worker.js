const fs = require('fs');
const path = require('path');

// Create dist directory for assets
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy static files from public directory
const publicDir = path.join(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  };
  
  copyDir(publicDir, distDir);
}

// Copy Next.js static assets
const nextStaticDir = path.join(__dirname, '../.next/static');
if (fs.existsSync(nextStaticDir)) {
  const destStaticDir = path.join(distDir, '_next/static');
  const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  };
  
  copyDir(nextStaticDir, destStaticDir);
}

// Copy pre-rendered HTML files if they exist
const nextServerDir = path.join(__dirname, '../.next/server/app');
if (fs.existsSync(nextServerDir)) {
  // Copy static HTML files
  const copyHtmlFiles = (srcDir, destPath = '') => {
    const fullSrcPath = path.join(nextServerDir, destPath);
    if (!fs.existsSync(fullSrcPath)) return;
    
    const items = fs.readdirSync(fullSrcPath);
    items.forEach(item => {
      const srcPath = path.join(fullSrcPath, item);
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        copyHtmlFiles(srcDir, path.join(destPath, item));
      } else if (item.endsWith('.html')) {
        const relativePath = destPath ? path.join(destPath, item) : item;
        const destFilePath = path.join(distDir, relativePath);
        
        // Ensure destination directory exists
        const destDirPath = path.dirname(destFilePath);
        if (!fs.existsSync(destDirPath)) {
          fs.mkdirSync(destDirPath, { recursive: true });
        }
        
        fs.copyFileSync(srcPath, destFilePath);
      }
    });
  };
  
  copyHtmlFiles(nextServerDir);
}

// Copy the actual Next.js HTML files
const htmlFiles = {
  'index.html': '.next/server/app/index.html',
  'about.html': '.next/server/app/about.html', 
  'contact.html': '.next/server/app/contact.html',
  'privacy.html': '.next/server/app/privacy.html',
  'terms.html': '.next/server/app/terms.html',
  'test-page.html': '.next/server/app/test-page.html',
  '404.html': '.next/server/app/_not-found.html'
};

Object.entries(htmlFiles).forEach(([destName, srcPath]) => {
  const fullSrcPath = path.join(__dirname, '..', srcPath);
  const destPath = path.join(distDir, destName);
  
  if (fs.existsSync(fullSrcPath)) {
    fs.copyFileSync(fullSrcPath, destPath);
  }
});

console.log('Worker preparation complete. Static assets copied to dist/');