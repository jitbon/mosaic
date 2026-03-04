import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../../constants/theme";
import type { DebateHistoryItem } from "../../hooks/useDebateHistory";

const PERSPECTIVE_COLORS: Record<string, string> = {
  left: Colors.left,
  center: Colors.center,
  right: Colors.right,
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
                    {
                      backgroundColor:
                        PERSPECTIVE_COLORS[p] || Colors.textMuted,
                    },
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
    backgroundColor: Colors.cardBg,
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
    color: Colors.textPrimary,
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
    color: Colors.cardBg,
  },
  stats: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  preview: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 11,
    color: Colors.textFaint,
  },
  status: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  statusActive: {
    color: Colors.success,
  },
  statusCompleted: {
    color: Colors.textMuted,
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
    color: Colors.textMuted,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textFaint,
    marginTop: 4,
  },
});
