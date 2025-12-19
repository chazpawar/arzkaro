/**
 * React Native configuration for autolinking
 * This ensures native modules like react-native-razorpay are properly linked
 */
module.exports = {
  dependencies: {
    'react-native-razorpay': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-razorpay/android',
          packageImportPath: 'import com.razorpay.rn.RazorpayPackage;',
          packageInstance: 'new RazorpayPackage()',
        },
        ios: null, // Configure iOS separately if needed
      },
    },
  },
};
