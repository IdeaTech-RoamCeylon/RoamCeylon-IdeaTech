import React from 'react';
import {TextInput,View,Text,StyleSheet,TextInputProps,ViewStyle,Dimensions} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export interface InputProps extends TextInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  style,
  containerStyle,
  icon,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.inputWrapper}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            icon ? styles.inputWithIcon : null,
            error ? styles.inputError : null,
            disabled ? styles.inputDisabled : null,
            style,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth * 0.8,
    marginBottom: 10,
    alignSelf: 'center',
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputWithIcon: {
    paddingLeft: 50,
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
});

export default Input;
