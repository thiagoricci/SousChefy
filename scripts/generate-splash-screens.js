import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Splash screen specifications
const splashScreens = [
  { filename: 'ios-640x1136.png', width: 640, height: 1136, logoSize: 200 },
  { filename: 'ios-750x1334.png', width: 750, height: 1334, logoSize: 220 },
  { filename: 'ios-1242x2208.png', width: 1242, height: 2208, logoSize: 280 },
  { filename: 'ios-1125x2436.png', width: 1125, height: 2436, logoSize: 250 },
  { filename: 'ios-1242x2688.png', width: 1242, height: 2688, logoSize: 280 },
  { filename: 'ios-828x1792.png', width: 828, height: 1792, logoSize: 240 },
  { filename: 'ios-1284x2778.png', width: 1284, height: 2778, logoSize: 300 },
];

// Background color (white)
const backgroundColor = { r: 255, g: 255, b: 255, alpha: 1 };

async function generateSplashScreens() {
  const logoPath = path.join(__dirname, '../public/souschefy.png');
  const splashDir = path.join(__dirname, '../public/splash');

  // Create splash directory if it doesn't exist
  if (!fs.existsSync(splashDir)) {
    fs.mkdirSync(splashDir, { recursive: true });
    console.log('Created splash directory:', splashDir);
  }

  // Load the logo
  try {
    const logo = await sharp(logoPath)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    console.log('Logo loaded successfully');

    // Generate each splash screen
    for (const spec of splashScreens) {
      const outputPath = path.join(splashDir, spec.filename);

      // Calculate logo position (centered)
      const logoX = Math.floor((spec.width - spec.logoSize) / 2);
      const logoY = Math.floor((spec.height - spec.logoSize) / 2);

      // Create splash screen
      await sharp({
        create: {
          width: spec.width,
          height: spec.height,
          channels: 4,
          background: backgroundColor,
        },
      })
        .composite([
          {
            input: await sharp(logo).resize(spec.logoSize, spec.logoSize, { fit: 'contain' }).toBuffer(),
            left: logoX,
            top: logoY,
          },
        ])
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated: ${spec.filename} (${spec.width}x${spec.height})`);
    }

    console.log('\nAll splash screens generated successfully!');
  } catch (error) {
    console.error('Error generating splash screens:', error);
    process.exit(1);
  }
}

// Run the script
generateSplashScreens();
