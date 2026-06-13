import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Define Message interface
interface Message {
  id: string;
  sender: 'guest' | 'guide';
  text: string;
  time: string;
}

const Chat = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Retrieve search query parameters from router
  const { name = 'Guest Request', detail = 'Tour Inquiry' } = useLocalSearchParams<{
    name: string;
    detail: string;
  }>();

  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Set up custom conversation histories depending on the client
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Populate mock message history based on guest name
    if (name.includes('Sophia')) {
      setMessages([
        {
          id: '1',
          sender: 'guest',
          text: 'Hi there! We are planning our honeymoon in Ella for next October.',
          time: 'Today, 10:40 AM',
        },
        {
          id: '2',
          sender: 'guest',
          text: 'We really want a mix of adventure and romance. Nine Arch Bridge and Ella Rock are must-sees for us. Can you suggest some premium hotels?',
          time: 'Today, 10:42 AM',
        },
        {
          id: '3',
          sender: 'guide',
          text: 'Hello Sophia! Congratulations on your upcoming wedding. Ella is absolutely breathtaking and perfect for a honeymoon.',
          time: 'Today, 10:45 AM',
        },
        {
          id: '4',
          sender: 'guide',
          text: 'I highly recommend looking at 98 Acres Resort or Mountain Heaven for the best romantic views. I am drafting a custom itinerary outline for you right now.',
          time: 'Today, 10:46 AM',
        },
      ]);
    } else if (name.includes('Julian')) {
      setMessages([
        {
          id: '1',
          sender: 'guest',
          text: 'Hi Julian, is the wildlife safari at Minneriya National Park included in the 7-day Cultural Triangle tour?',
          time: 'Yesterday, 3:55 PM',
        },
        {
          id: '2',
          sender: 'guide',
          text: 'Hi Julian! Yes, the Minneriya safari is fully included in the price, along with a private 4x4 jeep and a dedicated wildlife tracker.',
          time: 'Yesterday, 4:05 PM',
        },
        {
          id: '3',
          sender: 'guest',
          text: 'Excellent. What kind of animals are we likely to see? Mainly elephants?',
          time: 'Yesterday, 4:20 PM',
        },
      ]);
    } else if (name.includes('Elena')) {
      setMessages([
        {
          id: '1',
          sender: 'guide',
          text: 'Hi Elena, I have updated the pricing draft for the East Coast Retreat. It includes all boutique stays and private transfers.',
          time: 'Oct 11, 4:10 PM',
        },
        {
          id: '2',
          sender: 'guest',
          text: 'The pricing looks great, Elena! We are ready to proceed with locking this in.',
          time: 'Oct 12, 10:50 AM',
        },
        {
          id: '3',
          sender: 'guest',
          text: 'What is the next step for payments and securing the driver reservations?',
          time: 'Oct 12, 11:00 AM',
        },
      ]);
    } else {
      setMessages([
        {
          id: '1',
          sender: 'guest',
          text: `Hi! I am interested in booking a custom tour: ${detail}. Could you share more details?`,
          time: 'Today, 9:00 AM',
        },
        {
          id: '2',
          sender: 'guide',
          text: `Hello! Thanks for reaching out. I would be delighted to customize the ${detail} package for you. Let me know your preferred dates!`,
          time: 'Today, 9:15 AM',
        },
      ]);
    }
  }, [name, detail]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'guide',
      text: inputText,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    
    // Auto scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Mock an automated quick reply from guest after 1.5 seconds for interactive feel
    setTimeout(() => {
      const autoReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'guest',
        text: 'Thank you for the quick response! I will review this and let you know.',
        time: 'Just now',
      };
      setMessages((prev) => [...prev, autoReply]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  const handleCallPress = () => {
    Alert.alert('Phone Call', `Initiating direct voice call to ${name}...`);
  };

  const handleAttachmentPress = () => {
    Alert.alert('Attach File', 'Select an itinerary layout, contract, or photo to send...');
  };

  const handleTemplatePress = (text: string) => {
    setInputText(text);
  };

  // Get corresponding avatar for the search name
  const getAvatar = () => {
    if (name.includes('Sophia')) return 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80';
    if (name.includes('Julian')) return 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80';
    if (name.includes('Elena')) return 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80';
    return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1C1917" />
        </TouchableOpacity>
        
        <View style={styles.headerProfile}>
          <Image source={{ uri: getAvatar() }} style={styles.avatar} contentFit="cover" />
          <View style={styles.profileMeta}>
            <Text style={styles.profileName} numberOfLines={1}>{name}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active Negotiation</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.callButton} activeOpacity={0.7} onPress={handleCallPress}>
          <Ionicons name="call-outline" size={20} color="#0E5E2F" />
        </TouchableOpacity>
      </View>

      {/* Sticky Context bar showing tour interest info */}
      <View style={styles.contextBar}>
        <View style={styles.contextInfo}>
          <Ionicons name="bookmark-outline" size={14} color="#0E5E2F" style={{ marginRight: 6 }} />
          <Text style={styles.contextText} numberOfLines={1}>
            Interest: <Text style={{ fontWeight: '700' }}>{detail}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.btnItineraryBadge}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Plan Customizer', 'Opening custom pricing builder for this itinerary...')}
        >
          <Text style={styles.btnItineraryBadgeText}>Draft Plan</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Message Thread */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageThread}
        contentContainerStyle={styles.messageThreadContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => {
          const isGuide = message.sender === 'guide';
          return (
            <View
              key={message.id}
              style={[
                styles.messageBubbleWrapper,
                isGuide ? styles.wrapperGuide : styles.wrapperGuest,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isGuide ? styles.bubbleGuide : styles.bubbleGuest,
                ]}
              >
                <Text style={[styles.messageTextContent, isGuide ? styles.textGuide : styles.textGuest]}>
                  {message.text}
                </Text>
              </View>
              <Text style={styles.messageTimeText}>{message.time}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Input keyboard component */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Quick template suggestions bar */}
        <View style={styles.suggestionsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
            <TouchableOpacity
              style={styles.suggestionButton}
              onPress={() => handleTemplatePress("Hi! I'd love to help configure a custom trip itinerary draft for Ella. Let me know your exact dates!")}
            >
              <Text style={styles.suggestionText}>Send Ella Intro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.suggestionButton}
              onPress={() => handleTemplatePress("I have reviewed the safari requests. We can book a private jeep transfer for $120. Proceed?")}
            >
              <Text style={styles.suggestionText}>Safari Quote</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.suggestionButton}
              onPress={() => handleTemplatePress("Great! Please confirm the total guest count so I can send the deposit transfer details.")}
            >
              <Text style={styles.suggestionText}>Ask Guest Count</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Text Input area */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7} onPress={handleAttachmentPress}>
            <Ionicons name="add" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Type a message or select template..."
            placeholderTextColor="#8A958E"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EAEFEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
  },
  profileMeta: {
    flex: 1,
    marginLeft: 10,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    color: '#8A958E',
    fontWeight: '700',
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C2F3D0',
  },
  contextBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFBF9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#EAEFEA',
  },
  contextInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  contextText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  btnItineraryBadge: {
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: '#C2F3D0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  btnItineraryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  messageThread: {
    flex: 1,
  },
  messageThreadContent: {
    padding: 16,
    gap: 16,
  },
  messageBubbleWrapper: {
    maxWidth: '80%',
    marginBottom: 4,
  },
  wrapperGuide: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  wrapperGuest: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleGuide: {
    backgroundColor: '#0E5E2F',
    borderBottomRightRadius: 4,
  },
  bubbleGuest: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEFEA',
    borderBottomLeftRadius: 4,
  },
  messageTextContent: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
  },
  textGuide: {
    color: '#FFFFFF',
  },
  textGuest: {
    color: '#1C1917',
  },
  messageTimeText: {
    fontSize: 9.5,
    color: '#8A958E',
    marginTop: 4,
    fontWeight: '600',
  },
  suggestionsBar: {
    borderTopWidth: 1,
    borderColor: '#EAEFEA',
    backgroundColor: '#FAFBF9',
    paddingVertical: 8,
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
  },
  suggestionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEFEA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#EAEFEA',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 13.5,
    color: '#1C1917',
    fontWeight: '500',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0E5E2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});

export default Chat;
