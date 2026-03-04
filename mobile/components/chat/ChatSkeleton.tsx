import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

function PulsingBar({ width, height = 12 }: { width: number | string; height?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.bar,
        { width: width as number, height, opacity },
      ]}
    />
  );
}

function SkeletonBubble({ isUser }: { isUser: boolean }) {
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      <PulsingBar width="90%" />
      <PulsingBar width="70%" />
      {!isUser && <PulsingBar width="50%" />}
    </View>
  );
}

export default function ChatSkeleton() {
  return (
    <View style={styles.container}>
      {/* Perspective selector skeleton */}
      <View style={styles.selectorRow}>
        <PulsingBar width={80} height={32} />
        <PulsingBar width={80} height={32} />
        <PulsingBar width={80} height={32} />
      </View>

      {/* Disclaimer skeleton */}
      <View style={styles.disclaimer}>
        <PulsingBar width="80%" height={14} />
      </View>

      {/* Message skeletons */}
      <View style={styles.messages}>
        <SkeletonBubble isUser={false} />
        <SkeletonBubble isUser={true} />
        <SkeletonBubble isUser={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  selectorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  disclaimer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messages: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  bubble: {
    maxWidth: "75%",
    padding: 14,
    borderRadius: 16,
    gap: 6,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#DBEAFE",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  bar: {
    backgroundColor: "#D1D5DB",
    borderRadius: 4,
  },
});
