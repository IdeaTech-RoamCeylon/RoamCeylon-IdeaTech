import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  title, 
  subtitle, 
  children,
  containerStyle 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={[styles.content, containerStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  }
});
