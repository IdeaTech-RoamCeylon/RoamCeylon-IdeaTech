import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const router = useRouter();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);

    // Shimmer loop
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: width * 2,
        duration: 1800,
        useNativeDriver: true,
      }),
    );

    // Entrance sequence
    Animated.sequence([
      // 1. Logo fades + scales in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // 2. Tagline slides up
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // 3. Badge fades in
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start shimmer after entrance
      shimmerLoop.start();
    });

    // Navigate to register after 2s
    const timer = setTimeout(() => {
      shimmerLoop.stop();
      router.replace('/register');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background gradient — deep forest greens matching the brand */}
      <LinearGradient
        colors={['#0B3D1F', '#175C30', '#1E7A3E', '#175C30', '#0B3D1F']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Subtle radial glow behind logo */}
      <View style={styles.glowCircle} />

      {/* Main content */}
      <View style={styles.centerContent}>

        {/* Logo card with glass effect */}
        <Animated.View
          style={[
            styles.logoCard,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerAnim }] },
            ]}
          />
          <Image
            source={require('../../assets/Roam Ceylon Logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          Partner Portal
        </Animated.Text>

        {/* Sub-tagline */}
        <Animated.Text
          style={[
            styles.subTagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          Manage your Sri Lanka tourism business
        </Animated.Text>
      </View>

      {/* Bottom badge */}
      <Animated.View style={[styles.footer, { opacity: badgeOpacity }]}>
        <View style={styles.footerBadge}>
          <View style={styles.dot} />
          <Animated.Text style={styles.footerText}>INNOVATED BY IDEATECH</Animated.Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B3D1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    top: height * 0.5 - width * 0.7,
    left: -width * 0.1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 32,
    padding: 28,
    marginBottom: 28,
    width: width * 0.72,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Shadow
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ skewX: '-20deg' }],
    zIndex: 10,
  },
  logo: {
    width: width * 0.56,
    height: 90,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  subTagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 1.5,
  },
});

export default SplashScreen;
