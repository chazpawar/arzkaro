/**
 * Font Constants
 * Maps font weights to League Spartan font families
 */

export const Fonts = {
  thin: 'LeagueSpartan_100Thin',
  extraLight: 'LeagueSpartan_200ExtraLight',
  light: 'LeagueSpartan_300Light',
  regular: 'LeagueSpartan_400Regular',
  medium: 'LeagueSpartan_500Medium',
  semiBold: 'LeagueSpartan_600SemiBold',
  bold: 'LeagueSpartan_700Bold',
  extraBold: 'LeagueSpartan_800ExtraBold',
  black: 'LeagueSpartan_900Black',
} as const;

// Mapping of fontWeight values to League Spartan fonts
export const getFontFamily = (fontWeight?: string | number): string => {
  const weight = String(fontWeight);

  switch (weight) {
    case '100':
      return Fonts.thin;
    case '200':
      return Fonts.extraLight;
    case '300':
      return Fonts.light;
    case 'normal':
    case '400':
      return Fonts.regular;
    case '500':
      return Fonts.medium;
    case '600':
      return Fonts.semiBold;
    case 'bold':
    case '700':
      return Fonts.bold;
    case '800':
      return Fonts.extraBold;
    case '900':
      return Fonts.black;
    default:
      return Fonts.regular;
  }
};
