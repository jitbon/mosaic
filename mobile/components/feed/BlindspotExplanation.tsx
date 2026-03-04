import React from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";

interface BlindspotExplanationProps {
  visible: boolean;
  onClose: () => void;
  perspective: string;
  leftCount: number;
  centerCount: number;
  rightCount: number;
}

export default function BlindspotExplanation({
  visible,
  onClose,
  perspective,
  leftCount,
  centerCount,
  rightCount,
}: BlindspotExplanationProps) {
  const total = leftCount + centerCount + rightCount;
  const dominant = perspective.charAt(0).toUpperCase() + perspective.slice(1);

  const counts: Record<string, number> = {
    Left: leftCount,
    Center: centerCount,
    Right: rightCount,
  };

  const missingPerspectives = Object.entries(counts)
    .filter(([, count]) => count === 0)
    .map(([name]) => name);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modal}>
          <Text style={styles.title}>Blindspot Story</Text>
          <Text style={styles.description}>
            This story is primarily covered by{" "}
            <Text style={styles.bold}>{dominant}</Text> sources (
            {Math.round((counts[dominant] / total) * 100)}% of coverage).
          </Text>

          {missingPerspectives.length > 0 && (
            <Text style={styles.description}>
              {missingPerspectives.join(" and ")}{" "}
              {missingPerspectives.length === 1 ? "perspective has" : "perspectives have"}{" "}
              little to no coverage of this story.
            </Text>
          )}

          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Coverage Breakdown:</Text>
            <Text style={styles.breakdownItem}>Left: {leftCount} sources</Text>
            <Text style={styles.breakdownItem}>Center: {centerCount} sources</Text>
            <Text style={styles.breakdownItem}>Right: {rightCount} sources</Text>
          </View>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Got it</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 360,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: "700",
  },
  breakdown: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  breakdownItem: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
