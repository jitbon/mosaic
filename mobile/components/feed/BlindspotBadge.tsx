import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

interface BlindspotBadgeProps {
  perspective: string;
  onPress?: () => void;
}

const PERSPECTIVE_COLORS: Record<string, string> = {
  left: "#3b82f6",
  center: "#a855f7",
  right: "#ef4444",
};

export default function BlindspotBadge({
  perspective,
  onPress,
}: BlindspotBadgeProps) {
  const color = PERSPECTIVE_COLORS[perspective] || "#f59e0b";

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.badge, { backgroundColor: color + "20", borderColor: color }]}>
        <Text style={[styles.text, { color }]}>
          Blindspot — {perspective.charAt(0).toUpperCase() + perspective.slice(1)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
  },
});
