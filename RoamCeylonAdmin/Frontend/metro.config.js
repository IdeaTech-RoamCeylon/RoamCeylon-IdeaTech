const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure Metro watches both the root assets/ and src/ directories
// using absolute paths — relative paths get URL-encoded by Metro's
// asset resolver and cause ENOENT errors like ".%2Fsrc%2Fassets".
config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(__dirname, 'src'),
  path.resolve(__dirname, 'assets'),
];

// Map the @/ alias to ./src so Metro resolves TypeScript path aliases
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

module.exports = config;
