import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

import { Colors } from "../../constants/theme";
import FeedList from "../../components/feed/FeedList";
import FilterButtons from "../../components/feed/FilterButtons";
import { useFeed } from "../../hooks/useFeed";
import { registerBackgroundRefresh } from "../../services/backgroundRefresh";
import { FeedFilter } from "../../types/feed";

export default function FeedScreen() {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const { stories, isLoading, isRefreshing, error, refresh, loadMore } =
    useFeed(filter);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    registerBackgroundRefresh();
  }, []);

  useEffect(() => {
    if (!isRefreshing && stories.length > 0) {
      setLastUpdated(new Date());
    }
  }, [isRefreshing, stories.length]);

  if (isLoading && stories.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading stories...</Text>
      </View>
    );
  }

  if (error && stories.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Unable to load stories. Please check your connection and try again.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FeedList
        stories={stories}
        onRefresh={refresh}
        refreshing={isRefreshing}
        onEndReached={() => loadMore()}
        ListHeaderComponent={
          <View>
            <FilterButtons activeFilter={filter} onFilterChange={setFilter} />
            <Text style={styles.updatedText}>
              Updated {getTimeAgo(lastUpdated)}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: Colors.appBg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
  },
  errorText: {
    fontSize: 14,
    color: Colors.errorFg,
    textAlign: "center",
    lineHeight: 20,
  },
  updatedText: {
    fontSize: 11,
    color: Colors.textFaint,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
});

function getTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
}
