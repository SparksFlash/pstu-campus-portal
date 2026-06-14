const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const publicDir = path.resolve(__dirname, '../public/assets/images');
    const fileName = 'Nilkomol.jpg';
    const src = path.join(publicDir, fileName);
    const tmp = path.join(publicDir, fileName + '.tmp');

    if (!fs.existsSync(src)) {
      console.error('Source image not found:', src);
      process.exit(1);
    }

    console.log('Optimizing', src);
    await sharp(src)
      .resize({ width: 1600 })
      .jpeg({ quality: 78 })
      .toFile(tmp);

    fs.renameSync(tmp, src);
    console.log('Optimization complete — overwritten', src);
  } catch (err) {
    console.error('Image optimization failed:', err);
    process.exit(1);
  }
})();
