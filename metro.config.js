const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Fix Firebase auth exports warning
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    moduleName.startsWith('@firebase/auth') &&
    moduleName.includes('/dist/rn/')
  ) {
    return context.resolveRequest(
      context,
      moduleName.replace('/dist/rn/', '/dist/esm2017/'),
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
