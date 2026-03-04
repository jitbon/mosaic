import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

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
      accessibilityLabel={isStreaming ? "AI is responding" : `AI response: ${text}`}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.aiBadge}>
        <Text style={styles.aiBadgeText}>AI</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
      {isStreaming && (
        <ActivityIndicator
          size="small"
          color="#8B5CF6"
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
    backgroundColor: "#F3F4F6",
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
    color: "#1F2937",
  },
  aiBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
  },
  indicator: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
});
