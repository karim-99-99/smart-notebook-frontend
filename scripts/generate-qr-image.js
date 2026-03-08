/**
 * Generate a QR code image for testing the Smart Notebook app.
 * Saves PNG to the mobile folder AND to Windows Desktop so you can find it easily.
 *
 * Run: npm run generate-qr
 * (from the mobile folder: cd mobile && npm run generate-qr)
 */

const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Data that your app expects (NotebookQRData format)
const qrData = {
  notebook_id: 'notebook-001',
  page_number: 1,
  layout: 'ruled',
  language_hint: 'ar',
};

const qrString = JSON.stringify(qrData);

// Save to mobile folder (so it's in your project)
const mobileDir = path.join(__dirname, '..');
const filename = 'qr-code-for-app-test.png';
const outPathMobile = path.join(mobileDir, filename);

// Also try to save to Windows Desktop so you can open it easily
const desktopPath = path.join('/mnt/c/Users/DELL/Desktop', filename);

async function generate() {
  try {
    await QRCode.toFile(outPathMobile, qrString, {
      width: 400,
      margin: 3,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
    console.log('QR code saved to:', outPathMobile);

    if (fs.existsSync('/mnt/c/Users/DELL/Desktop')) {
      await QRCode.toFile(desktopPath, qrString, {
        width: 400,
        margin: 3,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      console.log('QR code also saved to your Windows Desktop:', desktopPath);
      console.log('Open your Desktop and use the image "qr-code-for-app-test.png" to test the app.');
    } else {
      console.log('Desktop path not found; file is only in the mobile folder.');
    }

    console.log('\nQR code contains this data:', qrString);
    console.log('\nTo test: open this image on your phone (or print it) and scan it with the Smart Notebook app.');
  } catch (err) {
    console.error('Error generating QR code:', err.message);
    process.exit(1);
  }
}

generate();
