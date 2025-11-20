const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const LOGO_SVG = path.join(__dirname, '../../public/logo.svg');
const OUTPUT_DIR = path.join(__dirname, '../../public/icons');

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎨 Generating PWA icons from logo.svg...\n');

// Generate standard icons
async function generateIcons() {
  try {
    for (const size of sizes) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
      await sharp(LOGO_SVG)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath);
      console.log(`   ✅ Created icon-${size}x${size}.png`);
    }

    // Generate maskable icons with padding
    console.log('\n🎭 Generating maskable icons...\n');
    for (const size of maskableSizes) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}-maskable.png`);
      const padding = Math.floor(size * 0.2); // 20% padding for safe area
      const innerSize = size - padding * 2;

      await sharp(LOGO_SVG)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 16, g: 185, b: 129, alpha: 1 }, // #10b981
        })
        .png()
        .toFile(outputPath);
      console.log(`   ✅ Created icon-${size}x${size}-maskable.png`);
    }

    // Generate Apple touch icon
    console.log('\n🍎 Generating Apple touch icon...\n');
    const appleTouchPath = path.join(__dirname, '../../public/apple-touch-icon.png');
    await sharp(LOGO_SVG)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(appleTouchPath);
    console.log('   ✅ Created apple-touch-icon.png');

    // Generate favicons
    console.log('\n🌐 Generating favicons...\n');
    const favicon32Path = path.join(__dirname, '../../public/favicon-32x32.png');
    const favicon16Path = path.join(__dirname, '../../public/favicon-16x16.png');

    await sharp(LOGO_SVG)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(favicon32Path);
    console.log('   ✅ Created favicon-32x32.png');

    await sharp(LOGO_SVG)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(favicon16Path);
    console.log('   ✅ Created favicon-16x16.png');

    console.log('\n✅ All PWA icons generated successfully!');
    console.log(`📁 Icons saved to: ${OUTPUT_DIR}`);
    console.log('\nNext steps:');
    console.log('1. Rebuild your app: npm run build');
    console.log('2. Test PWA installation on mobile devices');
    console.log('3. Check manifest in DevTools (Application → Manifest)');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
