import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { DebateHistoryItem } from "../../hooks/useDebateHistory";

const PERSPECTIVE_COLORS: Record<string, string> = {
  left: "#3B82F6",
  center: "#8B5CF6",
  right: "#EF4444",
};

interface Props {
  debates: DebateHistoryItem[];
  isLoading: boolean;
  onOpenDebate: (debateId: string, storyId: string) => void;
  onDeleteDebate: (debateId: string) => void;
}

export default function DebateHistoryList({
  debates,
  isLoading,
  onOpenDebate,
  onDeleteDebate,
}: Props) {
  if (!isLoading && debates.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No past debates yet.</Text>
        <Text style={styles.emptySubtext}>
          Start a debate from any story to see it here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={debates}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => onOpenDebate(item.id, item.story_id)}
          onLongPress={() => onDeleteDebate(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`Debate on ${item.story_headline}. ${item.turn_count} turns, ${item.current_round} rounds. ${item.status}.`}
          accessibilityHint="Tap to open, long press to delete"
        >
          <Text style={styles.headline} numberOfLines={2}>
            {item.story_headline || "Untitled Story"}
          </Text>
          <View style={styles.meta}>
            <View style={styles.personas}>
              {item.personas.map((p) => (
                <View
                  key={p}
                  style={[
                    styles.personaBadge,
                    { backgroundColor: PERSPECTIVE_COLORS[p] || "#6B7280" },
                  ]}
                >
                  <Text style={styles.personaBadgeText}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.stats}>
              {item.current_round} rounds · {item.turn_count} turns
            </Text>
          </View>
          {item.last_turn_preview && (
            <Text style={styles.preview} numberOfLines={1}>
              {item.last_turn_preview}
            </Text>
          )}
          <View style={styles.footer}>
            <Text style={styles.date}>
              {new Date(item.updated_at).toLocaleDateString()}
            </Text>
            <Text
              style={[
                styles.status,
                item.status === "active" && styles.statusActive,
                item.status === "completed" && styles.statusCompleted,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 12,
    gap: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headline: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  personas: {
    flexDirection: "row",
    gap: 4,
  },
  personaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  personaBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stats: {
    fontSize: 12,
    color: "#6B7280",
  },
  preview: {
    fontSize: 13,
    color: "#4B5563",
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  status: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  statusActive: {
    color: "#10B981",
  },
  statusCompleted: {
    color: "#6B7280",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },
});
