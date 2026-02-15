import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AIHomeScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>Hi, Name</Text>
                    <Text style={styles.subGreeting}>How may I help you today ?</Text>
                </View>

                {/* Pro Banner */}
                <View style={styles.proBannerContainer}>
                    <LinearGradient
                        colors={['#E8F5E9', '#F1F8E9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.proBanner}
                    >
                        {/* Avatar Container */}
                        <View style={styles.avatarContainer}>
                            <Image
                                source={require('../../assets/AI_Avatar.png')}
                                style={styles.avatar}
                                resizeMode="contain"
                            />
                        </View>
                        
                        {/* Text and Button */}
                        <View style={styles.proContent}>
                            <Text style={styles.proTitle}>Use AI at full power{'\n'}with pro</Text>
                            <TouchableOpacity style={styles.upgradeButton}>
                                <Text style={styles.upgradeText}>Upgrade Now</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsRow}>
                    <ActionCard image={require('../../assets/Budget.png')} title="Budget" />
                    <ActionCard image={require('../../assets/People.png')} title="People" />
                    <ActionCard image={require('../../assets/Activities.png')} title="Activities" />
                </View>

                {/* Chat History */}
                <Text style={styles.sectionTitle}>Chat History</Text>
                <View style={styles.historyCard}>
                    <View style={styles.historyContent}>
                        <Text style={styles.historyTitle}>Hotel Search</Text>
                        <Text style={styles.historySubtitle}>I'm looking for a budget friendly hotel in Colombo</Text>
                    </View>
                    <View style={styles.historyIconContainer}>
                         <Ionicons name="arrow-down-circle-outline" size={24} color="#000" />
                    </View>
                </View>

            </ScrollView>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
                {/* Input Area */}
                <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                        <TouchableOpacity style={styles.inputIconLeft}>
                            <MaterialCommunityIcons name="paperclip" size={22} color="#555" />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.input}
                            placeholder="Message"
                            placeholderTextColor="#888"
                        />
                        <TouchableOpacity style={styles.inputIconRight}>
                             <MaterialCommunityIcons name="star-four-points" size={22} color="#F9D423" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom Navigation */}
                <View style={styles.bottomNav}>
                    <NavItem icon="home-outline" label="Home" active={true} />
                    <NavItem icon="chatbubble-outline" label="Chat" active={false} />
                    
                    {/* Center Mic Button */}
                    <View style={styles.micButtonContainer}>
                        <TouchableOpacity style={styles.micButton}>
                             <Ionicons name="mic" size={28} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <NavItem icon="star-outline" label="Favorites" active={false} />
                    <NavItem icon="map-outline" label="Map" active={false} />
                </View>
            </View>
        </SafeAreaView>
    );
};

// Helper Components
const ActionCard = ({ image, title }: { image: any, title: string }) => (
    <TouchableOpacity style={styles.actionCard}>
        <Image source={image} style={styles.actionImage} resizeMode="contain" />
        <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
);

const NavItem = ({ icon, label, active }: { icon: any, label: string, active: boolean }) => (
   <TouchableOpacity style={styles.navItem}>
       <Ionicons name={icon} size={24} color={active ? '#000' : '#555'} />
       <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
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
        paddingBottom: 160, // Ensure space for fixed bottom section
    },
    header: {
        marginBottom: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    subGreeting: {
        fontSize: 16,
        color: '#666',
    },
    proBannerContainer: {
        marginBottom: 25,
        borderRadius: 20,
        overflow: 'hidden',
    },
    proBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        padding: 20,
        height: 150,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatar: {
        width: 120, // Slightly larger than container for overlaps if needed
        height: 120,
        marginBottom: -10, // Adjust position
    },
    proContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    proTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 22,
    },
    upgradeButton: {
        backgroundColor: '#F9D423',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 25,
        shadowColor: 'rgba(249, 212, 35, 0.4)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
    },
    upgradeText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    actionCard: {
        width: (width - 60) / 3, // 3 items with padding
        aspectRatio: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    actionImage: {
        width: '60%',
        height: '60%',
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 15,
    },
    historyCard: {
        backgroundColor: '#F7F7F7',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    historyContent: {
        marginBottom: 15,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
        marginBottom: 6,
    },
    historySubtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    historyIconContainer: {
        alignItems: 'center',
    },
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingBottom: 25, // Bottom padding for home indicator
    },
    inputWrapper: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFFFF5', // Very light mint green to match mock
        borderRadius: 30,
        height: 54,
        paddingHorizontal: 15,
    },
    inputIconLeft: {
        padding: 5,
        marginRight: 5,
    },
    inputIconRight: {
        padding: 5,
        marginLeft: 5,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Changed to space-between for better distribution
        alignItems: 'flex-end',
        paddingHorizontal: 25,
        height: 60,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingBottom: 10,
    },
    navLabel: {
        fontSize: 10,
        color: '#888',
        marginTop: 4,
        fontWeight: '500',
    },
    navLabelActive: {
        color: '#000',
        fontWeight: '700',
    },
    micButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginTop: -30, // Lift it up
    },
    micButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F9D423',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 5,
        borderColor: '#FFFFFF',
        // Shadow
        shadowColor: '#F9D423',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    }
});

export default AIHomeScreen;
