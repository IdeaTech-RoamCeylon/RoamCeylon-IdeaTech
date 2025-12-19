import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Input, Card, Loader } from '../components';

const ComponentShowcaseScreen = () => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePrimaryButton = () => {
    // Button pressed
  };

  const handleSecondaryButton = () => {
    // Button pressed
  };

  const handleOutlineButton = () => {
    // Button pressed
  };

  const handleLoadingButton = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handleCardPress = () => {
    // Card pressed
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    if (text.length < 3 && text.length > 0) {
      setInputError('Must be at least 3 characters');
    } else {
      setInputError('');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Button Components</Text>
      
      <Card>
        <Text style={styles.cardTitle}>Primary Button</Text>
        <Button title="Primary Button" onPress={handlePrimaryButton} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Secondary Button</Text>
        <Button 
          title="Secondary Button" 
          onPress={handleSecondaryButton}
          variant="secondary"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Outline Button</Text>
        <Button 
          title="Outline Button" 
          onPress={handleOutlineButton}
          variant="outline"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Loading Button</Text>
        <Button 
          title="Click to Load" 
          onPress={handleLoadingButton}
          loading={loading}
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Disabled Button</Text>
        <Button 
          title="Disabled Button" 
          onPress={() => {}}
          disabled
        />
      </Card>

      <Text style={styles.sectionTitle}>Input Components</Text>

      <Card>
        <Text style={styles.cardTitle}>Normal Input</Text>
        <Input
          placeholder="Enter your name"
          value={inputValue}
          onChangeText={handleInputChange}
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Input with Error</Text>
        <Input
          placeholder="Type at least 3 characters"
          value={inputValue}
          onChangeText={handleInputChange}
          error={inputError}
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Phone Input</Text>
        <Input
          placeholder="+94 XX XXX XXXX"
          value=""
          onChangeText={() => {}}
          keyboardType="phone-pad"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Disabled Input</Text>
        <Input
          placeholder="Disabled input"
          value="Cannot edit this"
          onChangeText={() => {}}
          disabled
        />
      </Card>

      <Text style={styles.sectionTitle}>Card Components</Text>

      <Card>
        <Text style={styles.cardTitle}>Basic Card</Text>
        <Text style={styles.cardText}>
          This is a basic card component with some content inside.
        </Text>
      </Card>

      <Card onPress={handleCardPress}>
        <Text style={styles.cardTitle}>Clickable Card</Text>
        <Text style={styles.cardText}>
          Tap this card to see console log. It uses TouchableOpacity.
        </Text>
      </Card>

      <Card style={{ backgroundColor: '#f0f8ff' }}>
        <Text style={styles.cardTitle}>Styled Card</Text>
        <Text style={styles.cardText}>
          This card has a custom background color applied via style prop.
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Loader Components</Text>

      <Card>
        <Text style={styles.cardTitle}>Inline Loader - Small</Text>
        <Loader size="small" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Inline Loader - Large</Text>
        <Loader size="large" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Loader with Text</Text>
        <Loader text="Loading data..." />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Custom Color Loader</Text>
        <Loader color="#dc3545" text="Loading..." />
      </Card>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ComponentShowcaseScreen;
