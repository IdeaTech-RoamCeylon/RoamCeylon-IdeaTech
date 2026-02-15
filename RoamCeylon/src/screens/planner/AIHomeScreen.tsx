import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { Card } from '../../components';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MainStackParamList } from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AIHomeScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const AIHomeScreen = () => {
    const navigation = useNavigation<AIHomeScreenNavigationProp>();

    const handlePlanTrip = () => {
        // Navigate to AI trip planner screen
        navigation.navigate('AITripPlanner' as any);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Roam Ceylon</Text>
                <Text style={styles.headerSubtitle}>AI Assistant{'\n'}Here</Text>
            </View>

            {/* AI Avatar */}
            <View style={styles.avatarContainer}>
                <View style={styles.avatarGlow}>
                    <Image 
                        source={require('../../assets/AI_Avatar.png')}
                        style={styles.avatarImage}
                        resizeMode="contain"
                    />
                    <Image 
                        source={require('../../assets/AI_Avatar_Shadow.png')}
                        style={styles.avatarShadow}
                        resizeMode="contain"
                    />
                </View>
            </View>

            {/* Description */}
            <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionText}>
                    Personalized Sri Lankan{'\n'}itineraries, curated instantly{'\n'}by AI
                </Text>
            </View>

            {/* CTA Button */}
            <TouchableOpacity 
                style={styles.ctaButton}
                onPress={handlePlanTrip}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#F9D423', '#F7C815']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                >
                    <Text style={styles.ctaText}>ASK AI TO PLAN MY TRIP</Text>
                    <Ionicons name="chevron-forward" size={20} color="#000" style={styles.ctaIcon} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#4CAF50',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#000000',
        textAlign: 'center',
        lineHeight: 36,
    },
    avatarContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        height: 200,
    },
    avatarGlow: {
        width: 280,
        height: 280,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarShadow: {
        position: 'absolute',
        width: 400,
        height: 100,
        bottom: -80,
        opacity: 1,
        zIndex: 10,
        marginTop: 20,  
        alignSelf: 'center',
    },
    descriptionContainer: {
        alignItems: 'center',
        marginTop: 140,
        marginBottom: 0,
        paddingHorizontal: 20,
    },
    descriptionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666666',
        textAlign: 'center',
        lineHeight: 24,
    },
    ctaButton: {
        marginTop: 'auto',
        marginBottom: 80,
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 30,
    },
    ctaText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000000',
        letterSpacing: 0.5,
    },
    ctaIcon: {
        marginLeft: 8,
    },
});

export default AIHomeScreen; 