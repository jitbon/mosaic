import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";

import { StoryDetail } from "../../types/story";
import { Colors } from "../../constants/theme";
import BiasBar from "../feed/BiasBar";
import BlindspotBadge from "../feed/BlindspotBadge";

interface StoryHeaderProps {
  story: StoryDetail;
}

export default function StoryHeader({ story }: StoryHeaderProps) {
  const firstImage = story.articles.find((a) => a.image_url)?.image_url;

  return (
    <View style={styles.container}>
      {firstImage && (
        <Image
          source={{ uri: firstImage }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      )}
      <View style={styles.content}>
        <Text style={styles.headline}>{story.headline}</Text>
        {story.summary && <Text style={styles.summary}>{story.summary}</Text>}
        <BiasBar
          leftCount={story.left_count}
          centerCount={story.center_count}
          rightCount={story.right_count}
        />
        {story.is_blindspot && story.blindspot_perspective && (
          <BlindspotBadge perspective={story.blindspot_perspective} />
        )}
        <Text style={styles.sourceCount}>
          {story.articles.length} source{story.articles.length !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
  },
  image: {
    width: "100%",
    height: 220,
  },
  content: {
    padding: 16,
  },
  headline: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  summary: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },
  sourceCount: {
    fontSize: 12,
    color: Colors.textFaint,
    marginTop: 12,
  },
});
