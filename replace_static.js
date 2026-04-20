const fs = require('fs');
const path = require('path');

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!['node_modules', '.git', 'unpackage', 'static'].includes(file)) {
                walk(fullPath);
            }
        } else if (/\.(vue|js)$/.test(file)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            // 处理 <image :src="sheep.$url.static('/static/xxx')" /> -> <image :src="sheep.$url.static('/static/xxx')" />
            const imgRegex = /<image([^>]*?)src="(\/static\/[^"]+)"([^>]*?)>/g;
            if (imgRegex.test(content)) {
                content = content.replace(imgRegex, '<image$1:src="sheep.$url.static(\'$2\')"$3>');
                changed = true;
            }
            
            const imgRegexSingle = /<image([^>]*?)src='(\/static\/[^']+)'([^>]*?)>/g;
            if (imgRegexSingle.test(content)) {
                content = content.replace(imgRegexSingle, '<image$1:src="sheep.$url.static(\'$2\')"$3>');
                changed = true;
            }

            // 处理 s-empty 等组件的 :icon="sheep.$url.static('/static/xxx')" -> :icon="sheep.$url.static('/static/xxx')"
            const iconRegex = /icon="(\/static\/[^"]+)"/g;
            if (iconRegex.test(content)) {
                content = content.replace(iconRegex, ':icon="sheep.$url.static(\'$1\')"');
                changed = true;
            }

            // 处理 JS 中返回的 sheep.$url.static('/static/xxx') -> sheep.$url.static('/static/xxx')
            // 注意避开已经是 sheep.$url.static() 包裹的，或 css() 包裹的
            const jsStrRegex = /(?<!sheep\.\$url\.(static|css|avatar)\()\s*'(\/static\/[^']+)'(?!\s*\))/g;
            if (jsStrRegex.test(content)) {
                content = content.replace(jsStrRegex, (match, p1, p2) => {
                    return match.replace(p2, `${p2}`).replace(/'(\/static\/[^']+)'/, "sheep.$url.static('$1')");
                });
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated:', fullPath);
            }
        }
    }
}
walk(__dirname);
