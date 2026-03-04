import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { Story } from "../../types/story";
import BiasBar from "./BiasBar";
import BlindspotBadge from "./BlindspotBadge";
import BlindspotExplanation from "./BlindspotExplanation";

interface StoryCardProps {
  story: Story;
}

export default function StoryCard({ story }: StoryCardProps) {
  const router = useRouter();
  const [showExplanation, setShowExplanation] = useState(false);

  const timeAgo = getTimeAgo(story.published_at);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/(tabs)/story/${story.id}`)}
    >
      {story.image_url && (
        <Image
          source={{ uri: story.image_url }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      )}
      <View style={styles.content}>
        <Text style={styles.headline} numberOfLines={3}>
          {story.headline}
        </Text>
        {story.summary && (
          <Text style={styles.summary} numberOfLines={2}>
            {story.summary}
          </Text>
        )}
        <Text style={styles.timestamp}>{timeAgo}</Text>
        <BiasBar
          leftCount={story.left_count}
          centerCount={story.center_count}
          rightCount={story.right_count}
        />
        {story.is_blindspot && story.blindspot_perspective && (
          <BlindspotBadge
            perspective={story.blindspot_perspective}
            onPress={() => setShowExplanation(true)}
          />
        )}
      </View>

      {story.is_blindspot && story.blindspot_perspective && (
        <BlindspotExplanation
          visible={showExplanation}
          onClose={() => setShowExplanation(false)}
          perspective={story.blindspot_perspective}
          leftCount={story.left_count}
          centerCount={story.center_count}
          rightCount={story.right_count}
        />
      )}
    </Pressable>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 180,
  },
  content: {
    padding: 14,
  },
  headline: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 22,
  },
  summary: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 6,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 8,
  },
});
