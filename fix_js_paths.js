const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      if (!['node_modules', '.git'].includes(f)) {
        walk(dirPath, callback);
      }
    } else if (f.endsWith('.vue')) {
      callback(dirPath);
    }
  });
}

walk(path.join(process.cwd(), 'sheep/components'), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace all ../../../static/ with ../../static/
  content = content.replace(/\.\.\/\.\.\/\.\.\/static\//g, '../../static/');
  
  // Restore src, icon, url to ../../../static/ because they are static attributes processed by Vite
  content = content.replace(/src="\.\.\/\.\.\/static\//g, 'src="../../../static/');
  content = content.replace(/icon="\.\.\/\.\.\/static\//g, 'icon="../../../static/');
  // What about url(../../../static/...) in <style>?
  content = content.replace(/url\(\.\.\/\.\.\/static\//g, 'url(../../../static/');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed JS relative paths in: ${path.relative(process.cwd(), filePath)}`);
  }
});
