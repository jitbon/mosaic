import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";

import StoryHeader from "../../../components/story/StoryHeader";
import SourceList from "../../../components/story/SourceList";
import { useStory } from "../../../hooks/useStory";

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const storyId = parseInt(id ?? "0", 10);
  const { story, isLoading, error } = useStory(storyId);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
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
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Sources</Text>
      <SourceList articles={story.articles} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f8fafc",
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
});
