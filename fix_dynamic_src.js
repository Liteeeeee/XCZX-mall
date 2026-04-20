const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      if (!['node_modules', '.git', 'unpackage', 'dist'].includes(f)) {
        walk(dirPath, callback);
      }
    } else if (f.endsWith('.vue')) {
      callback(dirPath);
    }
  });
}

walk(process.cwd(), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Change :src="'../../static/...'" to src="../../static/..."
  content = content.replace(/:src=(['"])['"](\.?\.\/.*?static\/.*?)['"]\1/g, 'src=$1$2$1');

  // Same for icon
  content = content.replace(/:icon=(['"])['"](\.?\.\/.*?static\/.*?)['"]\1/g, 'icon=$1$2$1');

  // And for bg-image
  content = content.replace(/:style=(['"])\{\s*backgroundImage:\s*['"]url\((['"]?)(\.?\.\/.*?static\/.*?)\2\)['"]\s*\}\1/g, 'style="background-image: url($3)"');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed dynamic bindings in: ${path.relative(process.cwd(), filePath)}`);
  }
});
