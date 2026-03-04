import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/theme";

interface Props {
  text: string;
  isStreaming: boolean;
}

export default function StreamingText({ text, isStreaming }: Props) {
  if (!text && !isStreaming) return null;

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={
        isStreaming ? "AI is responding" : `AI response: ${text}`
      }
      accessibilityLiveRegion="polite"
    >
      <View style={styles.aiBadge}>
        <Text style={styles.aiBadgeText}>AI</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
      {isStreaming && (
        <ActivityIndicator
          size="small"
          color={Colors.center}
          style={styles.indicator}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: "85%",
    alignSelf: "flex-start",
    backgroundColor: Colors.skeletonShine,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    marginVertical: 4,
    marginHorizontal: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  aiBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  indicator: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
});
