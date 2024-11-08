import React from "react";
import {
  TextInput as PaperTextInput,
  TextInputProps,
} from "react-native-paper";
import { ViewStyle, TextStyle } from "react-native";

interface CustomTextInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  containerStyle,
  inputStyle,
  ...props
}) => {
  return (
    <PaperTextInput
      style={[containerStyle, inputStyle]}
      theme={{ roundness: 8 }}
      {...props}
    />
  );
};

export default CustomTextInput;
