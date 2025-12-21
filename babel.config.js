module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@contexts': './src/contexts',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@constants': './src/constants',
            '@types': './src/types',
            '@utils': './src/utils',
            '@backend': './backend',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
    ],
  };
};
