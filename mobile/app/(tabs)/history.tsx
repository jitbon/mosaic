import React from "react";
import { Alert, StyleSheet, View } from "react-native";

import ChatHistoryList from "../../components/chat/ChatHistoryList";
import { useChatHistory } from "../../hooks/useChatHistory";

export default function HistoryScreen() {
  const { grouped, loading, refresh, remove } = useChatHistory();

  const handleDelete = (conversationId: string) => {
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
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ChatHistoryList
        groups={grouped}
        loading={loading}
        onDelete={handleDelete}
        onRefresh={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
});
