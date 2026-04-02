const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'jimp-compact': path.resolve(__dirname, 'web', 'jimp-compact.js'),
    'jimp': path.resolve(__dirname, 'web', 'jimp-compact.js'),
  };

  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    fs: false,
    path: false,
    os: false,
    crypto: false,
  };

  return config;
};
