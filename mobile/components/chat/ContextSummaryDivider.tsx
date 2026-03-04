import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/theme";

export default function ContextSummaryDivider() {
  return (
    <View
      style={styles.container}
      accessibilityLabel="Earlier messages have been summarized"
    >
      <View style={styles.line} />
      <Text style={styles.text}>Earlier messages summarized</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  text: {
    fontSize: 11,
    color: Colors.textFaint,
    marginHorizontal: 8,
  },
});
