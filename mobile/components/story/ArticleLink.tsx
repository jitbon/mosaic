import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";

import { Article } from "../../types/story";
import { Colors, Spectrum } from "../../constants/theme";

interface ArticleLinkProps {
  article: Article;
}

const BIAS_COLORS: Record<string, string> = {
  left: Colors.left,
  "center-left": Spectrum.centerLeft,
  center: Colors.center,
  "center-right": Spectrum.centerRight,
  right: Colors.right,
};

export default function ArticleLink({ article }: ArticleLinkProps) {
  const biasRating = article.source?.bias_rating ?? "center";
  const badgeColor = BIAS_COLORS[biasRating] || Colors.neutral;

  const handlePress = () => {
    Linking.openURL(article.url);
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.row}>
        <View
          style={[
            styles.biasBadge,
            { backgroundColor: badgeColor + "20", borderColor: badgeColor },
          ]}
        >
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
    backgroundColor: Colors.cardBg,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.skeletonShine,
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
    color: Colors.textSecondary,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  snippet: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
});
