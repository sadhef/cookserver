const fs = require('fs');
const path = require('path');

// Paths for client and server public directories
const clientPublicDir = path.join(__dirname, '../public');
const serverPublicDir = path.join(__dirname, '../server/public');

// Create directories if they don't exist
const makeDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
};

// Client side directories
makeDirectory(clientPublicDir);
makeDirectory(path.join(clientPublicDir, 'images'));

// Server side directories
makeDirectory(serverPublicDir);
makeDirectory(path.join(serverPublicDir, 'images'));

// 1x1 transparent pixel in base64
const transparentPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// A simple avatar placeholder (colored circle with user silhouette)
const defaultAvatar = `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="100" fill="#e0e0e0"/>
  <path d="M100,40 C82.3,40 68,54.3 68,72 C68,89.7 82.3,104 100,104 C117.7,104 132,89.7 132,72 C132,54.3 117.7,40 100,40 Z M100,112 C66.6,112 40,138.6 40,172 L160,172 C160,138.6 133.4,112 100,112 Z" fill="#9e9e9e"/>
</svg>
`;

// A simple recipe placeholder image (plate with fork and knife)
const defaultRecipe = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f5f5f5"/>
  <circle cx="200" cy="150" r="120" fill="#e0e0e0" stroke="#9e9e9e" stroke-width="2"/>
  <path d="M170,90 L170,210 M230,90 L230,210" stroke="#9e9e9e" stroke-width="10" stroke-linecap="round"/>
  <path d="M140,100 C140,130 170,130 170,160 M260,100 C260,130 230,130 230,160" stroke="#9e9e9e" stroke-width="8" stroke-linecap="round"/>
  <text x="200" y="240" font-family="Arial" font-size="16" text-anchor="middle" fill="#9e9e9e">Recipe Image</text>
</svg>
`;

// Create buffer from base64 string
const svgToBuffer = (svgString) => {
  return Buffer.from(svgString);
};

// Convert SVG to PNG (using base64 encoding for simplicity)
const createDefaultImage = (filePath, svgContent) => {
  try {
    // Write the SVG file
    fs.writeFileSync(filePath, svgContent);
    console.log(`Created file: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error creating ${filePath}:`, error);
    return false;
  }
};

// Create default avatar images
createDefaultImage(path.join(clientPublicDir, 'default-avatar.svg'), defaultAvatar);
createDefaultImage(path.join(serverPublicDir, 'images', 'default-avatar.svg'), defaultAvatar);

// Create default recipe images
createDefaultImage(path.join(clientPublicDir, 'default-recipe.svg'), defaultRecipe);
createDefaultImage(path.join(serverPublicDir, 'images', 'default-recipe.svg'), defaultRecipe);

// Also create a transparent pixel fallback for avatar
const pixelBuffer = Buffer.from(transparentPixel, 'base64');
fs.writeFileSync(path.join(clientPublicDir, 'transparent-pixel.png'), pixelBuffer);
fs.writeFileSync(path.join(serverPublicDir, 'images', 'transparent-pixel.png'), pixelBuffer);

console.log('Default images created successfully!');