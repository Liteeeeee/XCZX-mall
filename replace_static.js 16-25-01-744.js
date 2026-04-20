const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'unpackage' && f !== 'static' && f !== 'dist') {
        walk(dirPath, callback);
      }
    } else {
      if (f.endsWith('.vue') || f.endsWith('.js') || f.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

const root = process.cwd();

walk(root, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Calculate relative path to static
  const relativeToRoot = path.relative(root, filePath);
  const depth = relativeToRoot.split(path.sep).length - 1;
  const prefix = depth === 0 ? './' : '../'.repeat(depth);
  const relativeStatic = prefix + 'static/';

  // 1. Replace './static/...'
  // It looks like: './static/img/shop/goods/score1.svg'
  content = content.replace(/sheep\.\$url\.static\(['"]\/static\/(.*?)['"]\)/g, (match, p1) => {
    return `'${relativeStatic}${p1}'`;
  });

  // 2. Replace :src="'../../static/...'" -> src="../../static/..."
  // If the string is now literal, we should ideally change :src="'...'" to src="..."
  // but it's okay to leave it as :src="'...'" for now, Vue handles it.
  
  // 3. Replace bare /static/ in strings
  // Regex looks for quotes followed by /static/
  content = content.replace(/(['"])\/static\/(.*?)(['"])/g, (match, q1, p1, q2) => {
    return `${q1}${relativeStatic}${p1}${q2}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${relativeToRoot} (depth: ${depth} -> ${relativeStatic})`);
  }
});
