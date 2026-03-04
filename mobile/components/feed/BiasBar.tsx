import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface BiasBarProps {
  leftCount: number;
  centerCount: number;
  rightCount: number;
}

export default function BiasBar({ leftCount, centerCount, rightCount }: BiasBarProps) {
  const total = leftCount + centerCount + rightCount;
  if (total === 0) return null;

  const leftPct = (leftCount / total) * 100;
  const centerPct = (centerCount / total) * 100;
  const rightPct = (rightCount / total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {leftPct > 0 && (
          <View style={[styles.segment, styles.left, { flex: leftCount }]} />
        )}
        {centerPct > 0 && (
          <View style={[styles.segment, styles.center, { flex: centerCount }]} />
        )}
        {rightPct > 0 && (
          <View style={[styles.segment, styles.right, { flex: rightCount }]} />
        )}
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, styles.leftText]}>L: {leftCount}</Text>
        <Text style={[styles.label, styles.centerText]}>C: {centerCount}</Text>
        <Text style={[styles.label, styles.rightText]}>R: {rightCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  barContainer: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  segment: {
    height: "100%",
  },
  left: {
    backgroundColor: "#3b82f6",
  },
  center: {
    backgroundColor: "#a855f7",
  },
  right: {
    backgroundColor: "#ef4444",
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
  },
  leftText: {
    color: "#3b82f6",
  },
  centerText: {
    color: "#a855f7",
  },
  rightText: {
    color: "#ef4444",
  },
});
