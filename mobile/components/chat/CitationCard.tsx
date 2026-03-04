import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Citation } from "../../types/chat";

const BIAS_COLORS: Record<string, string> = {
  left: "#3B82F6",
  "center-left": "#6366F1",
  center: "#8B5CF6",
  "center-right": "#EC4899",
  right: "#EF4444",
};

interface Props {
  citation: Citation;
}

export default function CitationCard({ citation }: Props) {
  const biasColor = BIAS_COLORS[citation.bias_label] || "#6B7280";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.biasBadge, { backgroundColor: biasColor }]}>
          <Text style={styles.biasBadgeText}>
            {citation.bias_label.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.indexText}>[{citation.index}]</Text>
      </View>

      <Text style={styles.sourceName}>{citation.source_name}</Text>
      <Text style={styles.articleTitle} numberOfLines={2}>
        {citation.article_title}
      </Text>

      {citation.quoted_text ? (
        <Text style={styles.quotedText} numberOfLines={3}>
          "{citation.quoted_text}"
        </Text>
      ) : null}

      {citation.article_url ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(citation.article_url)}
          accessibilityRole="link"
          accessibilityLabel={`Read original article from ${citation.source_name}`}
        >
          <Text style={styles.linkText}>Read original article →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  biasBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  biasBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  indexText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  sourceName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    lineHeight: 20,
    marginBottom: 6,
  },
  quotedText: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
    lineHeight: 18,
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#D1D5DB",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },
});
