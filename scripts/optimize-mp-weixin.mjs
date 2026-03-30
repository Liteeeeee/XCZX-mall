import fs from 'node:fs';
import path from 'node:path';
import { transform } from 'esbuild';

const inputDir = process.argv[2];
if (!inputDir) {
  process.stderr.write('Missing input dir, e.g. unpackage/dist/dev/mp-weixin\n');
  process.exit(1);
}

const root = path.resolve(process.cwd(), inputDir);

function walk(dir, onFile) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(p, onFile);
    } else if (ent.isFile()) {
      onFile(p);
    }
  }
}

function minifyWxml(s) {
  return s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function minifyFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.map') {
    fs.unlinkSync(filePath);
    return;
  }
  if (ext === '.js') {
    const code = fs.readFileSync(filePath, 'utf8');
    const out = await transform(code, {
      loader: 'js',
      minify: true,
      target: 'es2017',
      legalComments: 'none',
    });
    fs.writeFileSync(filePath, out.code, 'utf8');
    return;
  }
  if (ext === '.wxss' || ext === '.css') {
    const code = fs.readFileSync(filePath, 'utf8');
    const out = await transform(code, {
      loader: 'css',
      minify: true,
      legalComments: 'none',
    });
    fs.writeFileSync(filePath, out.code, 'utf8');
    return;
  }
  if (ext === '.wxml') {
    const code = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, minifyWxml(code), 'utf8');
  }
}

const tasks = [];
walk(root, (p) => tasks.push(p));

for (const p of tasks) {
  await minifyFile(p);
}

process.stdout.write(`Optimized: ${root}\n`);
