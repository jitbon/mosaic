import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/theme";
import type { Perspective } from "../../types/chat";

const PERSPECTIVE_LABELS: Record<Perspective, string> = {
  left: "left-leaning",
  center: "centrist",
  right: "right-leaning",
};

interface Props {
  personas: Perspective[];
}

export default function DebateDisclaimer({ personas }: Props) {
  const labels = personas.map((p) => PERSPECTIVE_LABELS[p]).join(" and ");

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.icon}>🤖</Text>
      <Text style={styles.text}>
        This is a debate between AI personas representing{" "}
        <Text style={styles.bold}>{labels}</Text> viewpoints. These are not real
        people. All arguments are grounded in source articles.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warningBg,
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
    color: Colors.warningText,
    lineHeight: 16,
  },
  bold: {
    fontWeight: "700",
  },
});
