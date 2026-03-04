import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { DebateRole } from "../../types/debate";

const ROLE_LABELS: Record<string, string> = {
  persona_left: "Left",
  persona_center: "Center",
  persona_right: "Right",
  moderator: "You",
};

const ROLE_COLORS: Record<string, string> = {
  persona_left: "#3B82F6",
  persona_center: "#8B5CF6",
  persona_right: "#EF4444",
  moderator: "#6B7280",
};

interface Props {
  role: DebateRole;
  summary: string;
  onExpand: () => void;
}

export default function TurnSummary({ role, summary, onExpand }: Props) {
  const label = ROLE_LABELS[role] || role;
  const color = ROLE_COLORS[role] || "#6B7280";

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onExpand}
      accessibilityRole="button"
      accessibilityLabel={`${label} turn summary. Tap to expand. ${summary}`}
      accessibilityHint="Double tap to show full response"
    >
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
      <Text style={styles.summaryText} numberOfLines={2}>
        {summary}
      </Text>
      <Text style={styles.chevron}>▸</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginVertical: 2,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  chevron: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});
