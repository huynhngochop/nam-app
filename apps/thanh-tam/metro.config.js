// Expo SDK 52+ tự nhận monorepo (npm workspaces).
const { getDefaultConfig } = require('expo/metro-config');
module.exports = getDefaultConfig(__dirname);
