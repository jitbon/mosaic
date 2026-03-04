import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/theme";
import type {
  ChatHistoryItem,
  GroupedChatHistory,
} from "../../hooks/useChatHistory";
import type { Perspective } from "../../types/chat";

const PERSPECTIVE_COLORS: Record<Perspective, string> = {
  left: Colors.left,
  center: Colors.center,
  right: Colors.right,
};

interface Props {
  groups: GroupedChatHistory[];
  loading: boolean;
  onDelete: (conversationId: string) => void;
  onRefresh: () => void;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function ConversationRow({
  item,
  onDelete,
  onPress,
}: {
  item: ChatHistoryItem;
  onDelete: (id: string) => void;
  onPress: (item: ChatHistoryItem) => void;
}) {
  const color = PERSPECTIVE_COLORS[item.perspective];

  return (
    <Pressable
      style={styles.conversationRow}
      onPress={() => onPress(item)}
      onLongPress={() => onDelete(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`${item.perspective} conversation, ${item.message_count} messages`}
      accessibilityHint="Tap to continue, long press to delete"
    >
      <View style={[styles.perspectiveDot, { backgroundColor: color }]} />
      <View style={styles.conversationInfo}>
        <Text style={styles.perspectiveLabel}>
          {item.perspective.charAt(0).toUpperCase() + item.perspective.slice(1)}
        </Text>
        <Text style={styles.messageCount}>
          {item.message_count} message{item.message_count !== 1 ? "s" : ""}
          {item.is_ended ? " · Ended" : ""}
        </Text>
      </View>
      <Text style={styles.timeAgo}>{formatTimeAgo(item.updated_at)}</Text>
    </Pressable>
  );
}

function StoryGroup({
  group,
  onDelete,
}: {
  group: GroupedChatHistory;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  const handlePress = useCallback(
    (item: ChatHistoryItem) => {
      router.push({
        pathname: "/(tabs)/chat/[storyId]",
        params: {
          storyId: item.story_id,
          headline: group.story_headline,
        },
      });
    },
    [router, group.story_headline],
  );

  return (
    <View style={styles.storyGroup}>
      <Text style={styles.storyHeadline} numberOfLines={2}>
        {group.story_headline}
      </Text>
      {group.conversations.map((conv) => (
        <ConversationRow
          key={conv.id}
          item={conv}
          onDelete={onDelete}
          onPress={handlePress}
        />
      ))}
    </View>
  );
}

export default function ChatHistoryList({
  groups,
  loading,
  onDelete,
  onRefresh,
}: Props) {
  const renderGroup = useCallback(
    ({ item }: { item: GroupedChatHistory }) => (
      <StoryGroup group={item} onDelete={onDelete} />
    ),
    [onDelete],
  );

  if (!loading && groups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No chat history</Text>
        <Text style={styles.emptyText}>
          Start a conversation from any story to see it here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={groups}
      renderItem={renderGroup}
      keyExtractor={(item) => item.story_id}
      contentContainerStyle={styles.listContent}
      refreshing={loading}
      onRefresh={onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    gap: 12,
  },
  storyGroup: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storyHeadline: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.skeletonShine,
  },
  perspectiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  conversationInfo: {
    flex: 1,
  },
  perspectiveLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  messageCount: {
    fontSize: 12,
    color: Colors.textFaint,
    marginTop: 1,
  },
  timeAgo: {
    fontSize: 12,
    color: Colors.textFaint,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textFaint,
    textAlign: "center",
    lineHeight: 20,
  },
});
