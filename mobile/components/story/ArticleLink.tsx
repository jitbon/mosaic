import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";

import { Article } from "../../types/story";

interface ArticleLinkProps {
  article: Article;
}

const BIAS_COLORS: Record<string, string> = {
  left: "#3b82f6",
  "center-left": "#8b5cf6",
  center: "#a855f7",
  "center-right": "#f97316",
  right: "#ef4444",
};

export default function ArticleLink({ article }: ArticleLinkProps) {
  const biasRating = article.source?.bias_rating ?? "center";
  const badgeColor = BIAS_COLORS[biasRating] || "#6b7280";

  const handlePress = () => {
    Linking.openURL(article.url);
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.row}>
        <View style={[styles.biasBadge, { backgroundColor: badgeColor + "20", borderColor: badgeColor }]}>
          <Text style={[styles.biasText, { color: badgeColor }]}>
            {biasRating.charAt(0).toUpperCase() + biasRating.slice(1)}
          </Text>
        </View>
        <Text style={styles.sourceName} numberOfLines={1}>
          {article.source?.name ?? "Unknown Source"}
        </Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {article.title}
      </Text>
      {article.snippet && (
        <Text style={styles.snippet} numberOfLines={2}>
          {article.snippet}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  biasBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  biasText: {
    fontSize: 10,
    fontWeight: "700",
  },
  sourceName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    lineHeight: 19,
  },
  snippet: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    lineHeight: 16,
  },
});
