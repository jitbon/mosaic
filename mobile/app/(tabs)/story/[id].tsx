import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "../../../constants/theme";

import StoryHeader from "../../../components/story/StoryHeader";
import SourceList from "../../../components/story/SourceList";
import { useStory } from "../../../hooks/useStory";

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const storyId = parseInt(id ?? "0", 10);
  const { story, isLoading, error } = useStory(storyId);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !story) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Unable to load story details. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StoryHeader story={story} />

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/chat/[storyId]",
            params: { storyId: String(storyId), headline: story.headline },
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Explore perspectives on this story"
      >
        <Text style={styles.chatButtonText}>Explore Perspectives</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.debateButton}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/debate/[storyId]",
            params: { storyId: String(storyId), headline: story.headline },
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Start a debate between AI perspectives"
      >
        <Text style={styles.debateButtonText}>Start Debate</Text>
      </TouchableOpacity>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Sources</Text>
      <SourceList articles={story.articles} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceBg,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: Colors.surfaceBg,
  },
  errorText: {
    fontSize: 14,
    color: Colors.errorFg,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  chatButton: {
    backgroundColor: Colors.center,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  chatButtonText: {
    color: Colors.cardBg,
    fontSize: 16,
    fontWeight: "700",
  },
  debateButton: {
    backgroundColor: Colors.success,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  debateButtonText: {
    color: Colors.cardBg,
    fontSize: 16,
    fontWeight: "700",
  },
});
