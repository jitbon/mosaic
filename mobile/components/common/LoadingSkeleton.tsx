import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Colors } from "../../constants/theme";

interface LoadingSkeletonProps {
  count?: number;
}

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.content}>
        <View style={styles.titleLine} />
        <View style={[styles.titleLine, { width: "60%" }]} />
        <View style={styles.subtitleLine} />
        <View style={styles.barPlaceholder} />
      </View>
    </Animated.View>
  );
}

export default function LoadingSkeleton({ count = 3 }: LoadingSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: "hidden",
  },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: Colors.skeletonBase,
  },
  content: {
    padding: 14,
  },
  titleLine: {
    height: 14,
    backgroundColor: Colors.skeletonBase,
    borderRadius: 4,
    marginBottom: 8,
    width: "90%",
  },
  subtitleLine: {
    height: 10,
    backgroundColor: Colors.skeletonShine,
    borderRadius: 4,
    marginBottom: 8,
    width: "70%",
  },
  barPlaceholder: {
    height: 6,
    backgroundColor: Colors.skeletonShine,
    borderRadius: 3,
    marginTop: 8,
  },
});
