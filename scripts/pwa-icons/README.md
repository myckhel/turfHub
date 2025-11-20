# PWA Icon Generator

This directory contains scripts to generate PWA icons from the logo SVG.

## Quick Start

### Option 1: Using Node.js (Recommended)

```bash
cd scripts/pwa-icons
npm install
npm run generate-icons
```

### Option 2: Using ImageMagick

```bash
# Install ImageMagick first
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Ubuntu

# Run the script
./scripts/generate-pwa-icons.sh
```

## Generated Icons

The script will create:

- `/public/icons/icon-{size}x{size}.png` - Standard icons (72, 96, 128, 144, 152, 192, 384, 512px)
- `/public/icons/icon-{size}x{size}-maskable.png` - Maskable icons (192, 512px)
- `/public/apple-touch-icon.png` - Apple touch icon (180x180px)
- `/public/favicon-32x32.png` - Favicon 32x32
- `/public/favicon-16x16.png` - Favicon 16x16

## After Generating Icons

1. Rebuild the app: `npm run build`
2. Test the manifest: Open DevTools → Application → Manifest
3. Test installation on mobile devices
