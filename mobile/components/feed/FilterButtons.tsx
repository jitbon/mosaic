import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors } from "../../constants/theme";

import { FeedFilter } from "../../types/feed";

interface FilterButtonsProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "blindspot", label: "Blindspots" },
  { key: "balanced", label: "Balanced" },
];

export default function FilterButtons({
  activeFilter,
  onFilterChange,
}: FilterButtonsProps) {
  return (
    <View style={styles.container}>
      {FILTERS.map((f) => (
        <Pressable
          key={f.key}
          style={[styles.button, activeFilter === f.key && styles.active]}
          onPress={() => onFilterChange(f.key)}
        >
          <Text
            style={[styles.label, activeFilter === f.key && styles.activeLabel]}
          >
            {f.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.skeletonBase,
  },
  active: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  activeLabel: {
    color: Colors.cardBg,
  },
});
