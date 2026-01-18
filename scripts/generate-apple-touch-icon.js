import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateAppleTouchIcon() {
  const logoPath = path.join(__dirname, '../public/souschefy.png');
  const outputPath = path.join(__dirname, '../public/apple-touch-icon.png');

  try {
    // Load and resize the logo to 180x180 (standard Apple touch icon size)
    await sharp(logoPath)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(outputPath);

    console.log('✓ Generated: apple-touch-icon.png (180x180)');
    console.log('Apple touch icon generated successfully!');
  } catch (error) {
    console.error('Error generating apple touch icon:', error);
    process.exit(1);
  }
}

// Run the script
generateAppleTouchIcon();
