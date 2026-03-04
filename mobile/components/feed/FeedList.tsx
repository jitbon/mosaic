import React from "react";
import { View, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";

import { Story } from "../../types/story";
import StoryCard from "./StoryCard";

interface FeedListProps {
  stories: Story[];
  onRefresh?: () => void;
  refreshing?: boolean;
  onEndReached?: () => void;
  ListHeaderComponent?: React.ReactElement;
}

export default function FeedList({
  stories,
  onRefresh,
  refreshing = false,
  onEndReached,
  ListHeaderComponent,
}: FeedListProps) {
  return (
    <View style={styles.container}>
      <FlashList
        data={stories}
        renderItem={({ item }) => <StoryCard story={item} />}
        keyExtractor={(item) => item.id.toString()}
        estimatedItemSize={300}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingVertical: 8,
  },
});
