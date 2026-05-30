import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../types';
import { TripPlanRequest, aiService } from '../../services/aiService';
import { usePlannerContext, ChatMessage } from '../../context/PlannerContext';
import { apiService } from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type AIChatNavigationProp = StackNavigationProp<MainStackParamList, 'AIChat'>;

// ─── Component ───────────────────────────────────────────────────────────────

const AIChatScreen = () => {
  const navigation = useNavigation<AIChatNavigationProp>();
  const {
    setQuery,
    setTripPlan,
    chatMessages: messages,
    setChatMessages: setMessages,
    chatParams: tripParams,
    setChatParams: setTripParams,
    chatSessionId,
    setChatSessionId,
    setCurrentTripId,
  } = usePlannerContext();
  const flatListRef = useRef<FlatList>(null);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Derived state to check if we should block input (if summary card is shown)
  const isReady = messages.length > 0 && messages[messages.length - 1].type === 'summaryCard';

  // Initialize chat if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'init_1',
          text: "Hello! I'm your personal AI travel assistant. Let's plan your perfect Sri Lankan adventure! ✨ Where would you like to explore, for how long, and what are your main interests (e.g. beaches, wildlife, history, adventure)?",
          sender: 'ai',
          timestamp: new Date(),
          type: 'text',
        },
      ]);
    }
  }, [messages.length, setMessages]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const pushMessage = useCallback(
    (text: string, sender: 'user' | 'ai', extras?: Partial<ChatMessage>) => {
      const msg: ChatMessage = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        text,
        sender,
        timestamp: new Date(),
        type: 'text',
        ...extras,
      };
      setMessages(prev => [...prev, msg]);
      return msg.id;
    },
    [setMessages]
  );

  const removeMessage = useCallback(
    (id: string) => {
      setMessages(prev => prev.filter(m => m.id !== id));
    },
    [setMessages]
  );

  // ─── Handle Send (NLP Driven) ──────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (inputText.trim().length === 0 || isReady || isLoading) return;

    const userInput = inputText.trim();
    pushMessage(userInput, 'user');
    setInputText('');
    setIsLoading(true);

    // Show "Thinking..." message
    const thinkingId = pushMessage('Thinking...', 'ai');

    let timeoutId: NodeJS.Timeout;

    // 60-second timeout promise (generative AI calls can take up to 45-60s)
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, 60000);
    });

    try {
      // Race the API call against the timeout
      const response: any = await Promise.race([
        apiService.post('/ai/chat/extract', {
          userMessage: userInput,
          existingParams: tripParams,
          sessionId: chatSessionId,
        }),
        timeoutPromise,
      ]);

      const { isComplete, reply, extractedData, sessionId } = response.data;

      if (sessionId && sessionId !== chatSessionId) {
        setChatSessionId(sessionId);
      }

      // Remove "Thinking..."
      removeMessage(thinkingId);

      // Merge parameters carefully so we don't overwrite valid existing ones with null
      const mergedParams = { ...tripParams };
      if (extractedData) {
        Object.keys(extractedData).forEach(key => {
          const val = extractedData[key];
          if (val !== null && val !== undefined) {
            mergedParams[key as keyof typeof tripParams] = val;
          }
        });
      }
      setTripParams(mergedParams);

      // Push AI reply
      pushMessage(reply, 'ai');

      // If complete, push summary card
      if (isComplete) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString() + '_summary',
              text: '',
              sender: 'ai',
              timestamp: new Date(),
              type: 'summaryCard',
              tripData: mergedParams,
            },
          ]);
        }, 500);
      }
    } catch (error: any) {
      removeMessage(thinkingId);
      console.error('NLP Chat Error:', error);

      if (error.message === 'TIMEOUT') {
        pushMessage(
          "It's taking a bit longer than usual to process. Could you try sending that again? 🐢",
          'ai'
        );
      } else {
        pushMessage(
          "I'm having a little trouble understanding right now. Could you rephrase your last message? 😔",
          'ai'
        );
      }
    } finally {
      clearTimeout(timeoutId!);
      setIsLoading(false);
    }
  }, [
    inputText,
    isReady,
    isLoading,
    pushMessage,
    removeMessage,
    tripParams,
    setTripParams,
    setMessages,
  ]);

  // ─── Edit Details (reset) ─────────────────────────────────────────────────

  const handleEditDetails = useCallback(() => {
    setMessages(prev => {
      const withoutSummary = prev.filter(m => m.type !== 'summaryCard');
      return [
        ...withoutSummary,
        {
          id: Date.now().toString(),
          text: "No problem! What would you like to change? (e.g., 'Make it 5 days instead' or 'Change my budget to High')",
          sender: 'ai',
          timestamp: new Date(),
          type: 'text',
        },
      ];
    });
  }, [setMessages]);

  // ─── Generate Trip Plan (handoff) ─────────────────────────────────────────

  /**
   * Build a compact keyword summary from the AI messages in the chat so the
   * backend search engine can surface places that actually match what was
   * discussed (specific beaches, cultural sites, preferences, etc.).
   */
  const buildChatContext = useCallback((): string => {
    const aiReplies = messages
      .filter(m => m.sender === 'ai' && m.type === 'text' && m.text && m.text.length > 20)
      .map(m => m.text)
      .slice(-6); // Use last 6 AI messages for freshness

    const combined = aiReplies.join(' ');
    // Extract meaningful words only (strip pronouns / filler)
    const stopWords = new Set([
      'the', 'and', 'for', 'you', 'your', 'that', 'this', 'with',
      'have', 'are', 'will', 'can', 'all', 'any', 'its', 'has',
      'also', 'about', 'from', 'which', 'what', 'some', 'our',
      'into', 'more', 'than', 'they', 'their', 'when', 'here', 'how',
    ]);
    const words = combined
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !stopWords.has(w));

    // Deduplicate and take top 20 keywords
    const unique = [...new Set(words)].slice(0, 20);
    return unique.join(' ');
  }, [messages]);

  const handleGeneratePlan = useCallback(async () => {
    if (isLoading) return;

    // Guard Check
    if (!tripParams.destination || !tripParams.duration) {
      Alert.alert(
        'Missing Info',
        'Please provide destination and duration before generating plan.'
      );
      return;
    }

    setIsLoading(true);
    pushMessage('Generating your trip plan... please wait! 🚀', 'ai');

    try {
      const chatContext = buildChatContext();

      const request: TripPlanRequest = {
        destination: tripParams.destination || '',
        duration: tripParams.duration || '3',
        budget: tripParams.budget || 'Medium',
        interests: tripParams.interests || [],
        pax: tripParams.pax,
        chatContext: chatContext || undefined,
        useSavedContext: false,
        mode: 'new',
      };

      const plan = await aiService.generateTripPlan(request);

      // Update PlannerContext
      setQuery({
        destination: request.destination,
        duration: request.duration,
        budget: request.budget,
        interests: request.interests || [],
        pace: 'Moderate',
      });
      setTripPlan(plan);

      // Navigate to the trip planner screen
      navigation.navigate('AITripPlanner');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      pushMessage(`Oops! ${errorMessage}. Please try again. 😔`, 'ai');
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tripParams, isLoading, pushMessage, setQuery, setTripPlan, navigation, buildChatContext]);

  // ─── Summary Card Renderer ────────────────────────────────────────────────

  const renderSummaryCard = useCallback(
    (item: ChatMessage) => {
      const data = item.tripData || {};
      return (
        <View style={styles.messageRow}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/AI_Avatar.png')}
              style={styles.avatar}
              resizeMode="contain"
            />
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>✈️ Trip Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>📍 Destination</Text>
              <Text style={styles.summaryValue}>{data.destination || '—'}</Text>
            </View>
            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>📅 Duration</Text>
              <Text style={styles.summaryValue}>{data.duration || '—'}</Text>
            </View>
            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>👥 Travelers</Text>
              <Text style={styles.summaryValue}>{data.pax || '—'}</Text>
            </View>
            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>💰 Budget</Text>
              <Text style={styles.summaryValue}>{data.budget || '—'}</Text>
            </View>
            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>🎯 Interests</Text>
              <Text style={styles.summaryValue}>
                {data.interests && data.interests.length > 0 ? data.interests.join(', ') : '—'}
              </Text>
            </View>

            <View style={styles.summaryCardButtons}>
              <TouchableOpacity
                style={styles.editDetailsButton}
                onPress={handleEditDetails}
                disabled={isLoading}
              >
                <Text style={styles.editDetailsText}>Edit Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
                onPress={handleGeneratePlan}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#333" />
                ) : (
                  <Text style={styles.generateButtonText}>Generate Trip Plan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [handleEditDetails, handleGeneratePlan, isLoading]
  );

  // ─── Message Renderer ─────────────────────────────────────────────────────

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      if (item.type === 'summaryCard') {
        return renderSummaryCard(item);
      }

      if (item.type === 'planLink' && item.planLinkData) {
        return (
          <View style={[styles.messageRow, styles.messageRowAI]}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../../assets/AI_Avatar.png')}
                style={styles.avatar}
                resizeMode="contain"
              />
            </View>
            <View
              style={[
                styles.messageBubble,
                styles.aiBubble,
                { backgroundColor: '#F0F8FF', borderColor: '#0066CC', borderWidth: 1 },
              ]}
            >
              <Text
                style={[styles.messageText, styles.aiText, { fontWeight: 'bold', marginBottom: 8 }]}
              >
                🗺️ Your Trip Plan to {item.planLinkData.destination} is ready!
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#0066CC',
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  alignItems: 'center',
                }}
                onPress={() => {
                  setCurrentTripId(item.planLinkData!.tripId);
                  navigation.navigate('AITripPlanner' as never);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>View Generated Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      const isUser = item.sender === 'user';
      const isThinking = item.text === 'Thinking...';

      return (
        <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}>
          {!isUser && (
            <View style={styles.avatarContainer}>
              <Image
                source={require('../../assets/AI_Avatar.png')}
                style={styles.avatar}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
            {isThinking ? (
              <ActivityIndicator size="small" color="#888" style={{ margin: 5 }} />
            ) : (
              <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
                {item.text}
              </Text>
            )}

            {!isThinking && (
              <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
                {item.timestamp
                  ? new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </Text>
            )}
          </View>
        </View>
      );
    },
    [renderSummaryCard]
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 50}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          // Performance Optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={15}
          updateCellsBatchingPeriod={50}
        />

        {/* Input Area */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <MaterialCommunityIcons name="paperclip" size={22} color="#555" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder={isReady ? 'Tap a button above...' : 'Message...'}
              placeholderTextColor="#888"
              multiline
              value={inputText}
              onChangeText={setInputText}
              editable={!isReady && !isLoading}
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={isReady || isLoading}
            >
              {inputText.length > 0 ? (
                <Ionicons name="send" size={22} color="#F9D423" />
              ) : (
                <MaterialCommunityIcons
                  name={'star-four-points' as any}
                  size={22}
                  color="#F9D423"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

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
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 0,
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
    backgroundColor: '#EFFFF5',
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
    paddingVertical: 10,
  },
  sendButton: {
    padding: 10,
  },

  // ─── Summary Card Styles ─────────────────────────────────────────────────
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E0F2E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  summaryCardButtons: {
    flexDirection: 'column',
    marginTop: 20,
    gap: 12,
  },
  editDetailsButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E0F2E9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  editDetailsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
  },
  generateButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
});

export default AIChatScreen;
