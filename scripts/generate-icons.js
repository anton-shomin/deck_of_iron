import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// SVG with high-contrast iron deck badge
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="crimson" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#b91c1c"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Dark Shield Base -->
  <rect width="512" height="512" rx="104" fill="url(#bg)"/>
  <rect x="16" y="16" width="480" height="480" rx="90" fill="none" stroke="#27272a" stroke-width="6"/>

  <circle cx="256" cy="256" r="210" fill="url(#glow)"/>

  <!-- Card Contour -->
  <rect x="136" y="116" width="240" height="320" rx="28" fill="#1e1e24" stroke="#3f3f46" stroke-width="6"/>
  <rect x="148" y="128" width="216" height="296" rx="20" fill="#121216"/>

  <!-- Spade Emblem in Center -->
  <path d="M256 160 C240 210, 185 242, 185 285 C185 320, 215 340, 246 325 C242 345, 235 365, 220 380 L292 380 C277 365, 270 345, 266 325 C297 340, 327 320, 327 285 C327 242, 272 210, 256 160 Z" fill="url(#crimson)" filter="drop-shadow(0 6px 12px rgba(239,68,68,0.4))"/>

  <!-- Iron Kettlebell Handle Accent -->
  <path d="M206 170 Q256 120 306 170" fill="none" stroke="#f43f5e" stroke-width="12" stroke-linecap="round"/>

  <!-- Text Top Accent -->
  <text x="256" y="80" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="36" fill="#f43f5e" letter-spacing="4">IRON DECK</text>
  <text x="256" y="465" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="24" fill="#a1a1aa" letter-spacing="3">WORKOUT</text>
</svg>`;

// Safe-zone maskable version with 15% padding
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="crimson2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#b91c1c"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg2)"/>
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <rect x="136" y="116" width="240" height="320" rx="28" fill="#1e1e24" stroke="#3f3f46" stroke-width="6"/>
    <path d="M256 160 C240 210, 185 242, 185 285 C185 320, 215 340, 246 325 C242 345, 235 365, 220 380 L292 380 C277 365, 270 345, 266 325 C297 340, 327 320, 327 285 C327 242, 272 210, 256 160 Z" fill="url(#crimson2)"/>
    <text x="256" y="80" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="38" fill="#f43f5e">DECK OF IRON</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

async function generate() {
  const svgBuf = Buffer.from(svgContent);
  const maskBuf = Buffer.from(maskableSvg);

  await sharp(svgBuf).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(svgBuf).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(svgBuf).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(maskBuf).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  await sharp(svgBuf).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Icons generated successfully.');
}

generate().catch(console.error);
