import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';

export interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  text?: string;
  style?: ViewStyle;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  color = '#0066CC',
  fullScreen = false,
  text,
  style,
}) => {
  const containerStyle = fullScreen
    ? [styles.fullScreenContainer, style]
    : [styles.inlineContainer, style];

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  inlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default Loader;
