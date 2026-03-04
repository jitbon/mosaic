import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Perspective } from "../../types/chat";

const PERSPECTIVE_LABELS: Record<Perspective, string> = {
  left: "left-leaning / progressive",
  center: "centrist / moderate",
  right: "right-leaning / conservative",
};

interface Props {
  perspective: Perspective;
}

export default function ChatDisclaimer({ perspective }: Props) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.icon}>🤖</Text>
      <Text style={styles.text}>
        You are chatting with an AI persona representing{" "}
        <Text style={styles.bold}>{PERSPECTIVE_LABELS[perspective]}</Text>{" "}
        viewpoints. This is not a real person.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 16,
  },
  bold: {
    fontWeight: "700",
  },
});
