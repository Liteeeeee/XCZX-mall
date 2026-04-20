const sharp = require('sharp');
const fs = require('fs');

async function run() {
  const metadata = await sharp('static/loginBg.webp').metadata();
  console.log('Original metadata:', metadata);
  
  await sharp('static/loginBg.webp')
    .resize(750) // Resize to 750px width, suitable for mobile
    .webp({ quality: 60 })
    .toFile('static/loginBg_compressed.webp');
    
  const stat = fs.statSync('static/loginBg_compressed.webp');
  console.log('Compressed size:', stat.size / 1024, 'KB');
}
run();
