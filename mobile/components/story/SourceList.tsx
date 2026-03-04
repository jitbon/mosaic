import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { Article } from "../../types/story";
import ArticleLink from "./ArticleLink";

interface SourceListProps {
  articles: Article[];
}

export default function SourceList({ articles }: SourceListProps) {
  const grouped = groupByBias(articles);

  return (
    <View style={styles.container}>
      {grouped.map(({ label, articles: groupArticles }) => (
        <View key={label} style={styles.group}>
          <Text style={styles.groupLabel}>{label}</Text>
          {groupArticles.map((article) => (
            <ArticleLink key={article.id} article={article} />
          ))}
        </View>
      ))}
    </View>
  );
}

function groupByBias(articles: Article[]) {
  const groups: Record<string, Article[]> = {
    Left: [],
    Center: [],
    Right: [],
  };

  for (const article of articles) {
    const rating = article.source?.bias_rating ?? "center";
    if (rating.includes("left")) {
      groups["Left"].push(article);
    } else if (rating.includes("right")) {
      groups["Right"].push(article);
    } else {
      groups["Center"].push(article);
    }
  }

  return Object.entries(groups)
    .filter(([, arts]) => arts.length > 0)
    .map(([label, arts]) => ({ label, articles: arts }));
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  group: {
    marginBottom: 16,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    paddingHorizontal: 16,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
