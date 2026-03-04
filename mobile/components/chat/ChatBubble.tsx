import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Citation } from "../../types/chat";

interface Props {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[] | null;
  onCitationPress?: (citations: Citation[]) => void;
}

export default function ChatBubble({
  role,
  content,
  citations,
  onCitationPress,
}: Props) {
  const isUser = role === "user";

  const renderContent = () => {
    if (!citations?.length || isUser) {
      return <Text style={[styles.text, isUser && styles.userText]}>{content}</Text>;
    }

    // Parse [N] references and make them tappable
    const parts = content.split(/(\[\d+\])/g);
    return (
      <Text style={styles.text}>
        {parts.map((part, i) => {
          const match = part.match(/^\[(\d+)\]$/);
          if (match) {
            return (
              <Text
                key={i}
                style={styles.citationRef}
                onPress={() => onCitationPress?.(citations)}
                accessibilityRole="link"
                accessibilityLabel={`Citation ${match[1]}`}
              >
                {part}
              </Text>
            );
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <View
      style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? "You" : "AI persona"}: ${content}`}
    >
      {!isUser && (
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      )}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginVertical: 4,
    marginHorizontal: 12,
  },
  userContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#3B82F6",
    borderBottomRightRadius: 4,
  },
  assistantContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: "#1F2937",
  },
  userText: {
    color: "#FFFFFF",
  },
  citationRef: {
    color: "#2563EB",
    fontWeight: "600",
    textDecorationLine: "underline",
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
});
