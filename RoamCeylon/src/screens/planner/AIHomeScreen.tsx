import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { tripStorageService, SavedTrip } from '../../services/tripStorageService';
import { usePlannerContext } from '../../context/PlannerContext';

const AIHomeScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const userName = user?.name || 'Traveler';
    const { setTripPlan, setQuery, startEditing, clearPlanner } = usePlannerContext();
    const [recentTrips, setRecentTrips] = useState<SavedTrip[]>([]);
    const [isLoadingTrips, setIsLoadingTrips] = useState(true);

    const handleNewChat = () => {
        clearPlanner();
        navigation.navigate('AIChat' as never);
    };

    useFocusEffect(
        useCallback(() => {
            const fetchTrips = async () => {
                setIsLoadingTrips(true);
                try {
                    const result = await tripStorageService.getSavedTrips();
                    const trips = Array.isArray(result) ? result : result.data;
                    // Filter to valid trips and show top 3
                    const validTrips = trips.filter(t => t?.tripPlan?.itinerary);
                    setRecentTrips(validTrips.slice(0, 3));
                } catch (error) {
                    console.error('Failed to load trips', error);
                } finally {
                    setIsLoadingTrips(false);
                }
            };
            fetchTrips();
        }, [])
    );

    const handleLoadTrip = useCallback((trip: SavedTrip) => {
        if (!trip?.tripPlan) return;
        setTripPlan(trip.tripPlan);
        setQuery(prev => ({
            ...prev,
            destination: trip.tripPlan.destination || '',
            duration: trip.tripPlan.duration || '1',
            budget: trip.tripPlan.budget || 'Medium',
        }));
        startEditing(trip.id);
        navigation.navigate('AITripPlanner' as never);
    }, [navigation, setTripPlan, setQuery, startEditing]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
            >
                {/* Greeting Header */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>Hi, {userName}.</Text>
                    <Text style={styles.subGreeting}>How may I help you today?</Text>
                </View>

                {/* Pro Banner */}
                <View style={styles.proCard}>
                    <Text style={styles.proLabel}>PREMIUM ACCESS</Text>
                    <Text style={styles.proTitle}>Use AI at full power with pro</Text>
                    <TouchableOpacity style={styles.upgradeButton} activeOpacity={0.9}>
                        <Text style={styles.upgradeText}>Upgrade Now</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions Row */}
                <View style={styles.quickActionsRow}>
                    <ActionCard 
                        iconName="wallet-outline" 
                        iconType="ionicons" 
                        title="BUDGET" 
                    />
                    <ActionCard 
                        iconName="people-outline" 
                        iconType="ionicons" 
                        title="PEOPLE" 
                    />
                    <ActionCard 
                        iconName="paper-plane-outline" 
                        iconType="ionicons" 
                        title="NEARBY" 
                    />
                </View>

                {/* Chat History Header */}
                <View style={styles.historyHeader}>
                    <Text style={styles.historySectionTitle}>CHAT HISTORY</Text>
                    {recentTrips.length > 0 && (
                        <TouchableOpacity activeOpacity={0.6} onPress={() => navigation.navigate('SavedTrips' as never)}>
                            <Text style={styles.clearAllText}>VIEW ALL</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Chat History Cards */}
                <View style={styles.historyList}>
                    {isLoadingTrips ? (
                        <ActivityIndicator size="small" color="#8A6B3E" style={{ marginVertical: 20 }} />
                    ) : recentTrips.length === 0 ? (
                        <View style={{ alignItems: 'center', padding: 20 }}>
                            <Text style={{ color: '#666', fontSize: 16 }}>There are no trips created yet.</Text>
                        </View>
                    ) : (
                        recentTrips.map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                style={styles.historyCard}
                                activeOpacity={0.7}
                                onPress={() => handleLoadTrip(item)}
                            >
                                <View style={[styles.historyImage, { backgroundColor: '#e3f2fd', alignItems: 'center', justifyContent: 'center' }]}>
                                    <Text style={{ fontSize: 24 }}>🗺️</Text>
                                </View>
                                <View style={styles.historyContent}>
                                    <Text style={styles.historyTitle}>{item.name}</Text>
                                    <Text style={styles.historySubtitle}>{item.tripPlan.destination}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" style={styles.historyChevron} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Floating Bottom Input Area */}
            <View style={styles.bottomInputContainer}>
                <View style={styles.floatingInputBar}>
                    <TouchableOpacity style={styles.addIconButton} activeOpacity={0.6}>
                        <Ionicons name="add" size={24} color="#A0A0A0" />
                    </TouchableOpacity>
                    
                    <TextInput
                        style={styles.textInput}
                        placeholder="Ask AI anything about your trip..."
                        placeholderTextColor="#A0A0A0"
                        onFocus={handleNewChat}
                    />
                    
                    <TouchableOpacity 
                        style={styles.sendIconButton} 
                        activeOpacity={0.8}
                        onPress={handleNewChat}
                    >
                        <Ionicons name="send" size={16} color="#3C2B1C" style={styles.sendIcon} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

// Helper ActionCard Component
const ActionCard = ({ iconName, iconType, title }: { iconName: string, iconType: 'ionicons' | 'mci', title: string }) => (
    <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
        <View style={styles.actionIconCircle}>
            {iconType === 'ionicons' ? (
                <Ionicons name={iconName as any} size={22} color="#8A6B3E" />
            ) : (
                <MaterialCommunityIcons name={iconName as any} size={22} color="#8A6B3E" />
            )}
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    header: {
        marginBottom: 24,
    },
    greeting: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    subGreeting: {
        fontSize: 16,
        color: '#666666',
        fontWeight: '500',
    },
    proCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 24,
        padding: 24,
        marginBottom: 28,
    },
    proLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFE06B',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    proTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        lineHeight: 24,
        marginBottom: 20,
    },
    upgradeButton: {
        backgroundColor: '#FFE06B',
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    upgradeText: {
        color: '#1E1E1E',
        fontWeight: '800',
        fontSize: 14,
    },
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    actionCard: {
        flex: 1,
        aspectRatio: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#FFF3D1',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        shadowColor: '#FFE06B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
    },
    actionIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FCF8E3',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1A1A1A',
        letterSpacing: 0.5,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 16,
    },
    historySectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#666666',
        letterSpacing: 0.5,
    },
    clearAllText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#8A6B3E',
        letterSpacing: 0.5,
    },
    historyList: {
        gap: 12,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    historyImage: {
        width: 56,
        height: 56,
        borderRadius: 14,
        marginRight: 14,
    },
    historyContent: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    historySubtitle: {
        fontSize: 12,
        color: '#888888',
    },
    historyChevron: {
        marginLeft: 8,
    },
    bottomInputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        paddingTop: 10,
    },
    floatingInputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        height: 56,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.03)',
    },
    addIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: '#1A1A1A',
        paddingHorizontal: 8,
        height: '100%',
    },
    sendIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFE06B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendIcon: {
        marginLeft: 2,
    },
});

export default AIHomeScreen;
