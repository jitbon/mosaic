import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

import type { Perspective, PerspectiveAvailability } from "../../types/chat";

const PERSPECTIVE_CONFIG: Record<
  Perspective,
  { label: string; color: string; activeColor: string }
> = {
  left: { label: "Left", color: "#3B82F6", activeColor: "#2563EB" },
  center: { label: "Center", color: "#8B5CF6", activeColor: "#7C3AED" },
  right: { label: "Right", color: "#EF4444", activeColor: "#DC2626" },
};

interface Props {
  activePerspective: Perspective;
  onSelect: (perspective: Perspective) => void;
  availability: PerspectiveAvailability | null;
  loading?: boolean;
  conversationCounts?: Record<Perspective, number>;
}

export default function PerspectiveSelector({
  activePerspective,
  onSelect,
  availability,
  loading = false,
  conversationCounts,
}: Props) {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {(["left", "center", "right"] as Perspective[]).map((perspective) => {
        const config = PERSPECTIVE_CONFIG[perspective];
        const isActive = activePerspective === perspective;
        const isAvailable =
          availability?.perspectives[perspective]?.available ?? true;
        const messageCount = conversationCounts?.[perspective] ?? 0;

        return (
          <TouchableOpacity
            key={perspective}
            style={[
              styles.tab,
              isActive && { backgroundColor: config.activeColor },
              !isAvailable && styles.disabledTab,
            ]}
            onPress={() => isAvailable && onSelect(perspective)}
            disabled={!isAvailable}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive, disabled: !isAvailable }}
            accessibilityLabel={`${config.label} perspective${!isAvailable ? ", no sources available" : ""}`}
          >
            <Text
              style={[
                styles.tabText,
                isActive && styles.activeTabText,
                !isAvailable && styles.disabledTabText,
              ]}
            >
              {config.label}
            </Text>
            {!isAvailable && (
              <Text style={styles.unavailableText}>No sources</Text>
            )}
            {messageCount > 0 && isAvailable && (
              <View
                style={[styles.badge, { backgroundColor: config.color }]}
              >
                <Text style={styles.badgeText}>{messageCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  disabledTab: {
    backgroundColor: "#F3F4F6",
    opacity: 0.6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  disabledTabText: {
    color: "#9CA3AF",
  },
  unavailableText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
