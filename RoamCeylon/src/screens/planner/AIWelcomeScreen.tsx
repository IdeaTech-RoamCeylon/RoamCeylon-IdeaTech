import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MainStackParamList } from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AIWelcomeScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const AIWelcomeScreen = () => {
    const navigation = useNavigation<AIWelcomeScreenNavigationProp>();

    const handlePlanTrip = () => {
        navigation.navigate('AIHome' as any);
    };

    return (
        <LinearGradient
            colors={['#E6F7EC', '#FFFFFF', '#FFFFFF', '#E6F7EC']}
            locations={[0, 0.35, 0.65, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
        >
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.headerButton} 
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#3C2B1C" />
                    </TouchableOpacity>
                    
                    <Text style={styles.headerTitle}>
                        Roam<Text style={styles.headerTitleBold}>Ceylon</Text>
                    </Text>
                    
                    <TouchableOpacity 
                        style={styles.headerButton} 
                        onPress={() => navigation.navigate('Profile')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="settings-outline" size={24} color="#7A7570" />
                    </TouchableOpacity>
                </View>

                {/* Content Container */}
                <View style={styles.content}>
                    {/* AI Avatar */}
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={require('../../assets/AI_Avatar.png')}
                            style={styles.avatarImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Titles */}
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>AI Assistant{'\n'}Here</Text>
                        <Text style={styles.subtitle}>
                            Personalized Sri Lankan{'\n'}itineraries, curated instantly{'\n'}by AI
                        </Text>
                    </View>

                    {/* Feature Cards */}
                    <View style={styles.cardsContainer}>
                        {/* Card 1: Tailored Itinerary */}
                        <View style={styles.card}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name="creation" size={24} color="#8A6B3E" />
                            </View>
                            <Text style={styles.cardTitle}>Tailored Itinerary</Text>
                            <Text style={styles.cardDescription}>
                                Bespoke routes based on your pace and style.
                            </Text>
                        </View>

                        {/* Card 2: Local Secrets */}
                        <View style={styles.card}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#2E7D32" />
                            </View>
                            <Text style={styles.cardTitle}>Local Secrets</Text>
                            <Text style={styles.cardDescription}>
                                Hidden gems and the best artisan kitchens.
                            </Text>
                        </View>
                    </View>

                    {/* Spacer / Flex push */}
                    <View style={styles.spacer} />

                    {/* CTA Button */}
                    <TouchableOpacity 
                        style={styles.ctaButton}
                        onPress={handlePlanTrip}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.ctaText}>ASK AI TO PLAN MY TRIP</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 56,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '500',
        color: '#3C2B1C',
        letterSpacing: -0.5,
    },
    headerTitleBold: {
        fontWeight: '800',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    avatarImage: {
        width: 220,
        height: 220,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 28,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#1A1A1A',
        textAlign: 'center',
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666666',
        textAlign: 'center',
        lineHeight: 24,
        marginTop: 16,
    },
    cardsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 16,
    },
    card: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        // Shadow styling
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    iconContainer: {
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 6,
    },
    cardDescription: {
        fontSize: 11,
        lineHeight: 15,
        color: '#666666',
    },
    spacer: {
        flex: 1,
    },
    ctaButton: {
        width: '100%',
        backgroundColor: '#FFE06B',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Platform.OS === 'ios' ? 10 : 30,
        // Button Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    ctaText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1A1A1A',
        letterSpacing: 0.5,
    },
});

export default AIWelcomeScreen; 