import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/theme";

import ChatHistoryList from "../../components/chat/ChatHistoryList";
import DebateHistoryList from "../../components/debate/DebateHistoryList";
import { useChatHistory } from "../../hooks/useChatHistory";
import { useDebateHistory } from "../../hooks/useDebateHistory";

type Tab = "chats" | "debates";

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const router = useRouter();

  const { grouped, loading, refresh, remove } = useChatHistory();
  const {
    debates,
    isLoading: debatesLoading,
    deleteDebate,
  } = useDebateHistory();

  const handleDeleteConversation = (conversationId: string) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => remove(conversationId),
        },
      ],
    );
  };

  const handleDeleteDebate = (debateId: string) => {
    Alert.alert(
      "Delete Debate",
      "Are you sure you want to delete this debate?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteDebate(debateId),
        },
      ],
    );
  };

  const handleOpenDebate = (debateId: string, storyId: string) => {
    router.push({
      pathname: "/(tabs)/debate/[storyId]",
      params: { storyId, debateId },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "chats" && styles.activeTab]}
          onPress={() => setActiveTab("chats")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "chats" && styles.activeTabText,
            ]}
          >
            Chats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "debates" && styles.activeTab]}
          onPress={() => setActiveTab("debates")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "debates" && styles.activeTabText,
            ]}
          >
            Debates
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "chats" ? (
        <ChatHistoryList
          groups={grouped}
          loading={loading}
          onDelete={handleDeleteConversation}
          onRefresh={refresh}
        />
      ) : (
        <DebateHistoryList
          debates={debates}
          isLoading={debatesLoading}
          onOpenDebate={handleOpenDebate}
          onDeleteDebate={handleDeleteDebate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceBg,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  activeTabText: {
    color: Colors.primary,
  },
});
