import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Citation } from "../../types/chat";
import type { DebateRole } from "../../types/debate";
import TurnSummary from "./TurnSummary";

const ROLE_LABELS: Record<string, string> = {
  persona_left: "Left Perspective",
  persona_center: "Center Perspective",
  persona_right: "Right Perspective",
  moderator: "You (Moderator)",
};

const ROLE_COLORS: Record<string, string> = {
  persona_left: "#3B82F6",
  persona_center: "#8B5CF6",
  persona_right: "#EF4444",
  moderator: "#6B7280",
};

interface Props {
  role: DebateRole;
  content: string;
  summary: string | null;
  citations: Citation[] | null;
  isStreaming: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function DebateTurn({
  role,
  content,
  summary,
  citations,
  isStreaming,
  isExpanded,
  onToggleExpand,
}: Props) {
  const isModeratorTurn = role === "moderator";

  // Moderator turns are always shown expanded, no collapse
  if (isModeratorTurn) {
    return (
      <View style={[styles.container, styles.moderatorContainer]}>
        <View style={[styles.header, { borderLeftColor: ROLE_COLORS[role] }]}>
          <Text style={styles.roleLabel}>{ROLE_LABELS[role]}</Text>
        </View>
        <Text style={styles.content}>{content}</Text>
      </View>
    );
  }

  // Collapsed summary view
  if (!isStreaming && !isExpanded && summary) {
    return (
      <TurnSummary role={role} summary={summary} onExpand={onToggleExpand} />
    );
  }

  // Expanded or streaming view
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={!isStreaming ? onToggleExpand : undefined}
      disabled={isStreaming}
      accessibilityRole="button"
      accessibilityLabel={`${ROLE_LABELS[role]} turn. ${isStreaming ? "Currently streaming." : "Tap to collapse."}`}
    >
      <View style={[styles.header, { borderLeftColor: ROLE_COLORS[role] }]}>
        <Text style={styles.roleLabel}>{ROLE_LABELS[role]}</Text>
        <Text style={styles.aiTag}>AI</Text>
        {isStreaming && <Text style={styles.streamingTag}>● Live</Text>}
      </View>
      <Text style={styles.content}>{content}</Text>
      {citations && citations.length > 0 && (
        <View style={styles.citationsContainer}>
          {citations.map((c) => (
            <View key={c.index} style={styles.citation}>
              <Text style={styles.citationIndex}>[{c.index}]</Text>
              <Text style={styles.citationText}>
                {c.source_name} — {c.article_title}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  moderatorContainer: {
    backgroundColor: "#F3F4F6",
    borderLeftWidth: 3,
    borderLeftColor: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    paddingLeft: 8,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  aiTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  streamingTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
  },
  content: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 22,
  },
  citationsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 4,
  },
  citation: {
    flexDirection: "row",
    gap: 4,
  },
  citationIndex: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
  },
  citationText: {
    flex: 1,
    fontSize: 11,
    color: "#6B7280",
  },
});
