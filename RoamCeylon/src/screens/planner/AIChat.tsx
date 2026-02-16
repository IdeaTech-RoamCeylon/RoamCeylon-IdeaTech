import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    TextInput, 
    FlatList, 
    KeyboardAvoidingView, 
    Platform,
    SafeAreaView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const AIChatScreen = () => {
    const navigation = useNavigation();
    const flatListRef = useRef<FlatList>(null);
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hello! I am your personal AI travel assistant. How can I help you explore Sri Lanka today?',
            sender: 'ai',
            timestamp: new Date()
        }
    ]);

    const handleSend = () => {
        if (inputText.trim().length === 0) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');

        // Simulate AI response
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: "That sounds like a great plan! I can help you with that. Would you like some recommendations?",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 1000);
    };

    useEffect(() => {
        // Scroll to bottom when messages change
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        
        return (
            <View style={[
                styles.messageRow, 
                isUser ? styles.messageRowUser : styles.messageRowAI
            ]}>
                {!isUser && (
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={require('../../assets/AI_Avatar.png')} 
                            style={styles.avatar} 
                            resizeMode="contain"
                        />
                    </View>
                )}
                
                <View style={[
                    styles.messageBubble, 
                    isUser ? styles.userBubble : styles.aiBubble
                ]}>
                    <Text style={[
                        styles.messageText, 
                        isUser ? styles.userText : styles.aiText
                    ]}>
                        {item.text}
                    </Text>
                    <Text style={[
                        styles.timestamp, 
                        isUser ? styles.userTimestamp : styles.aiTimestamp
                    ]}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>RoamCeylon AI</Text>
                    <View style={styles.statusIndicator}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Online</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.menuButton}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <KeyboardAvoidingView 
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messageList}
                    showsVerticalScrollIndicator={false}
                />

                {/* Input Area */}
                <View style={styles.inputSection}>
                    <View style={styles.inputContainer}>
                        <TouchableOpacity style={styles.attachButton}>
                            <MaterialCommunityIcons name="paperclip" size={22} color="#555" />
                        </TouchableOpacity>
                        
                        <TextInput
                            style={styles.input}
                            placeholder="Message..."
                            placeholderTextColor="#888"
                            multiline
                            value={inputText}
                            onChangeText={setInputText}
                        />
                        
                        <TouchableOpacity 
                            style={styles.sendButton} 
                            onPress={handleSend}
                        >
                            {inputText.length > 0 ? (
                                <Ionicons name="send" size={22} color="#F9D423" />
                            ) : (
                                <MaterialCommunityIcons name="star-four-points" size={22} color="#F9D423" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 50,  
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    backButton: {
        padding: 5,
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#888',
    },
    menuButton: {
        padding: 5,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    messageList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 20,
    },
    messageRow: {
        marginBottom: 20,
        flexDirection: 'row',
        maxWidth: '85%',
    },
    messageRowUser: {
        alignSelf: 'flex-end',
        justifyContent: 'flex-end',
    },
    messageRowAI: {
        alignSelf: 'flex-start',
    },
    avatarContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0FDF4', // Light green bg for avatar
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginTop: 0, // Align with top of bubble
    },
    avatar: {
        width: 28,
        height: 28,
    },
    messageBubble: {
        padding: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        minWidth: 60,
    },
    userBubble: {
        backgroundColor: '#EFFFF5', // Matching the mint green theme
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: '#333',
    },
    aiText: {
        color: '#333',
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    userTimestamp: {
        color: '#888',
    },
    aiTimestamp: {
        color: '#999',
    },
    inputSection: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFFFF5',
        borderRadius: 25,
        paddingHorizontal: 10,
        paddingVertical: 5,
        minHeight: 50,
    },
    attachButton: {
        padding: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        maxHeight: 100,
        fontSize: 16,
        color: '#333',
        marginHorizontal: 5,
        paddingVertical: 10, // For multiline centering
    },
    sendButton: {
        padding: 10,
    },
});

export default AIChatScreen;
