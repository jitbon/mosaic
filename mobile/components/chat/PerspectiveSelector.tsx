import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

import { Colors } from "../../constants/theme";
import type { Perspective, PerspectiveAvailability } from "../../types/chat";

const PERSPECTIVE_CONFIG: Record<
  Perspective,
  { label: string; color: string; activeColor: string }
> = {
  left: { label: "Left", color: Colors.left, activeColor: Colors.leftActive },
  center: {
    label: "Center",
    color: Colors.center,
    activeColor: Colors.centerActive,
  },
  right: {
    label: "Right",
    color: Colors.right,
    activeColor: Colors.rightActive,
  },
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
        <ActivityIndicator size="small" color={Colors.center} />
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
              <View style={[styles.badge, { backgroundColor: config.color }]}>
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
    backgroundColor: Colors.surfaceBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.cardBg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledTab: {
    backgroundColor: Colors.skeletonShine,
    opacity: 0.6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.cardBg,
  },
  disabledTabText: {
    color: Colors.textFaint,
  },
  unavailableText: {
    fontSize: 10,
    color: Colors.textFaint,
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
    color: Colors.cardBg,
  },
});
