declare module '@react-native-community/slider' {
  import { Component } from 'react';
  import { ViewProps, StyleProp, ViewStyle } from 'react-native';

  export interface SliderProps extends ViewProps {
    disabled?: boolean;
    maximumTrackTintColor?: string;
    maximumValue?: number;
    minimumTrackTintColor?: string;
    minimumValue?: number;
    onSlidingComplete?: (value: number) => void;
    onValueChange?: (value: number) => void;
    step?: number;
    style?: StyleProp<ViewStyle>;
    thumbTintColor?: string;
    value?: number;
  }

  export default class Slider extends Component<SliderProps> {}
}
