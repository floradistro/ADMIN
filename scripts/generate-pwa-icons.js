const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Apple-style dark theme configuration
const DARK_BG = '#1a1a1a'; // Deep dark background
const GRADIENT_START = '#2a2a2a';
const GRADIENT_END = '#1a1a1a';

// Icon sizes to generate
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png', purpose: 'any' },
  { size: 96, name: 'icon-96x96.png', purpose: 'any' },
  { size: 128, name: 'icon-128x128.png', purpose: 'any' },
  { size: 144, name: 'icon-144x144.png', purpose: 'any' },
  { size: 152, name: 'icon-152x152.png', purpose: 'any' },
  { size: 180, name: 'apple-touch-icon.png', purpose: 'any' }, // Apple touch icon
  { size: 192, name: 'icon-192x192.png', purpose: 'maskable' },
  { size: 384, name: 'icon-384x384.png', purpose: 'any' },
  { size: 512, name: 'icon-512x512.png', purpose: 'maskable' },
  { size: 1024, name: 'icon-1024x1024.png', purpose: 'any' }, // For splash screens
];

const publicDir = path.join(__dirname, '../public');
const logoPath = path.join(publicDir, 'logonew.png');
const outputDir = path.join(publicDir, 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate Apple-style gradient background SVG
function createAppleStyleBackground(size, logoSize) {
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="appleGradient" cx="50%" cy="30%">
          <stop offset="0%" style="stop-color:${GRADIENT_START};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${GRADIENT_END};stop-opacity:1" />
        </radialGradient>
        <filter id="softShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#appleGradient)" rx="${size * 0.18}" />
    </svg>
  `);
}

async function generateIcons() {
  console.log('🎨 Generating Apple-style PWA icons...\n');

  // Check if logo exists
  if (!fs.existsSync(logoPath)) {
    console.error('❌ Logo not found at:', logoPath);
    process.exit(1);
  }

  for (const { size, name, purpose } of ICON_SIZES) {
    try {
      // Calculate logo size (70% of icon size for proper padding, like Apple)
      const logoSize = Math.floor(size * 0.7);
      const padding = (size - logoSize) / 2;

      // Create background with gradient
      const background = createAppleStyleBackground(size, logoSize);

      // Process logo
      const logoBuffer = await sharp(logoPath)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();

      // Composite logo on background
      await sharp(background)
        .resize(size, size)
        .composite([{
          input: logoBuffer,
          top: Math.floor(padding),
          left: Math.floor(padding),
        }])
        .png({
          quality: 100,
          compressionLevel: 9,
        })
        .toFile(path.join(outputDir, name));

      console.log(`✅ Generated ${name} (${size}x${size}) - ${purpose}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }

  // Copy apple-touch-icon to root for iOS
  const appleTouchIconPath = path.join(outputDir, 'apple-touch-icon.png');
  const rootAppleTouchIconPath = path.join(publicDir, 'apple-touch-icon.png');
  if (fs.existsSync(appleTouchIconPath)) {
    fs.copyFileSync(appleTouchIconPath, rootAppleTouchIconPath);
    console.log('✅ Copied apple-touch-icon.png to public root');
  }

  // Generate favicon.ico (16x16, 32x32, 48x48)
  try {
    const favicon16 = await sharp(logoPath)
      .resize(16, 16, { fit: 'contain', background: DARK_BG })
      .png()
      .toBuffer();

    const favicon32 = await sharp(logoPath)
      .resize(32, 32, { fit: 'contain', background: DARK_BG })
      .png()
      .toBuffer();

    const favicon48 = await sharp(logoPath)
      .resize(48, 48, { fit: 'contain', background: DARK_BG })
      .png()
      .toBuffer();

    // Note: Sharp doesn't support ICO directly, so we'll create PNGs
    await sharp(favicon32).toFile(path.join(publicDir, 'favicon.png'));
    console.log('✅ Generated favicon.png');

    // Generate 16x16 and 32x32 for different uses
    await sharp(favicon16).toFile(path.join(publicDir, 'favicon-16x16.png'));
    await sharp(favicon32).toFile(path.join(publicDir, 'favicon-32x32.png'));
    console.log('✅ Generated favicon-16x16.png and favicon-32x32.png');
  } catch (error) {
    console.error('❌ Failed to generate favicons:', error.message);
  }

  console.log('\n🎉 All icons generated successfully!');
  console.log('📁 Icons saved to:', outputDir);
}

generateIcons().catch(console.error);

