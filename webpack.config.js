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

  // Disable image loaders to prevent jimp processing
  config.module.rules = config.module.rules.filter(rule => {
    if (rule.test && (rule.test.test('image.png') || rule.test.test('image.jpg') || rule.test.test('image.svg'))) {
      return false;
    }
    return true;
  });

  // Add a simple passthrough for images
  config.module.rules.push({
    test: /\.(png|jpg|jpeg|gif|svg)$/i,
    type: 'asset',
    parser: {
      dataUrlCondition: {
        maxSize: 8 * 1024,
      },
    },
  });

  return config;
};
