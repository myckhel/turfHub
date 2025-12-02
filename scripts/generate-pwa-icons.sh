#!/bin/bash

# PWA Icon Generator Script
# This script converts the logo.svg to various PNG sizes needed for PWA

LOGO_SVG="public/logo.svg"
OUTPUT_DIR="public/icons"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick is not installed. Please install it first:"
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "🎨 Generating PWA icons from $LOGO_SVG..."

# Generate various icon sizes
sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
    echo "   Creating ${size}x${size}..."
    convert -background none -resize "${size}x${size}" "$LOGO_SVG" "$OUTPUT_DIR/icon-${size}x${size}.png"
done

# Generate maskable icons (with padding for safe area)
echo "🎭 Generating maskable icons..."
for size in 192 512; do
    echo "   Creating maskable ${size}x${size}..."
    # Add 20% padding for safe area
    padding=$((size / 5))
    convert -background "#10b981" -gravity center -extent "$((size + padding))x$((size + padding))" \
            -resize "${size}x${size}" "$LOGO_SVG" "$OUTPUT_DIR/icon-${size}x${size}-maskable.png"
done

# Generate Apple touch icons
echo "🍎 Generating Apple touch icons..."
convert -background none -resize "180x180" "$LOGO_SVG" "public/apple-touch-icon.png"

# Generate favicon
echo "🌐 Generating favicon..."
convert -background none -resize "32x32" "$LOGO_SVG" "public/favicon-32x32.png"
convert -background none -resize "16x16" "$LOGO_SVG" "public/favicon-16x16.png"

echo "✅ PWA icons generated successfully!"
echo "📁 Icons saved to: $OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "1. Update your manifest icons paths in workbox.config.ts"
echo "2. Rebuild your app: npm run build"
echo "3. Test PWA installation on mobile devices"
