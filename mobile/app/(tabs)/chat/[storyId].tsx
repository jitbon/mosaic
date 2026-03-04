import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ChatBubble from "../../../components/chat/ChatBubble";
import ChatDisclaimer from "../../../components/chat/ChatDisclaimer";
import ChatInput from "../../../components/chat/ChatInput";
import CitationSheet from "../../../components/chat/CitationSheet";
import PerspectiveSelector from "../../../components/chat/PerspectiveSelector";
import StreamingText from "../../../components/chat/StreamingText";
import { useChat } from "../../../hooks/useChat";
import { getPerspectives } from "../../../services/chatApi";
import { getConversationsForStory } from "../../../services/chatStorage";
import type {
  Citation,
  Perspective,
  PerspectiveAvailability,
} from "../../../types/chat";

export default function ChatScreen() {
  const { storyId, headline } = useLocalSearchParams<{
    storyId: string;
    headline?: string;
  }>();
  const router = useRouter();

  const [perspective, setPerspective] = useState<Perspective>("left");
  const [availability, setAvailability] =
    useState<PerspectiveAvailability | null>(null);
  const [loadingPerspectives, setLoadingPerspectives] = useState(true);
  const [conversationCounts, setConversationCounts] = useState<
    Record<Perspective, number>
  >({ left: 0, center: 0, right: 0 });

  const [citationSheetVisible, setCitationSheetVisible] = useState(false);
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);

  const storyHeadline = headline || "Story";
  const flatListRef = useRef<FlatList>(null);

  const {
    messages,
    streamingText,
    isStreaming,
    error,
    isEnded,
    sendMessage,
    loadConversation,
  } = useChat(storyId!, perspective, storyHeadline);

  // Load perspectives on mount
  useEffect(() => {
    if (!storyId) return;
    setLoadingPerspectives(true);
    getPerspectives(storyId)
      .then(setAvailability)
      .catch(() => {})
      .finally(() => setLoadingPerspectives(false));
  }, [storyId]);

  // Load existing conversation when perspective changes and refresh counts
  useEffect(() => {
    if (!storyId) return;
    loadConversation(storyId, perspective);

    // Refresh conversation counts for all perspectives
    getConversationsForStory(storyId).then((convs) => {
      const counts: Record<Perspective, number> = { left: 0, center: 0, right: 0 };
      for (const conv of convs) {
        counts[conv.perspective] = conv.messages.length;
      }
      setConversationCounts(counts);
    });
  }, [storyId, perspective, loadConversation]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 || streamingText) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, streamingText]);

  const handleCitationPress = useCallback((citations: Citation[]) => {
    setActiveCitations(citations);
    setCitationSheetVisible(true);
  }, []);

  const handlePerspectiveChange = useCallback((p: Perspective) => {
    setPerspective(p);
  }, []);

  const renderMessage = useCallback(
    ({ item }: { item: (typeof messages)[0] }) => (
      <ChatBubble
        role={item.role}
        content={item.content}
        citations={item.citations}
        onCitationPress={handleCitationPress}
      />
    ),
    [handleCitationPress]
  );

  if (!storyId) {
    return (
      <View style={styles.center}>
        <Text>No story selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PerspectiveSelector
        activePerspective={perspective}
        onSelect={handlePerspectiveChange}
        availability={availability}
        loading={loadingPerspectives}
        conversationCounts={conversationCounts}
      />

      <ChatDisclaimer perspective={perspective} />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        ListFooterComponent={
          streamingText || isStreaming ? (
            <StreamingText text={streamingText} isStreaming={isStreaming} />
          ) : null
        }
        ListEmptyComponent={
          !isStreaming ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Ask a question to start exploring the{" "}
                {perspective} perspective on this story.
              </Text>
            </View>
          ) : null
        }
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isEnded ? (
        <View style={styles.endedContainer}>
          <Text style={styles.endedText}>
            This conversation has ended. You can start a new one.
          </Text>
        </View>
      ) : (
        <ChatInput
          onSend={sendMessage}
          disabled={isStreaming}
          placeholder={`Ask the ${perspective} persona...`}
        />
      )}

      <CitationSheet
        visible={citationSheetVisible}
        citations={activeCitations}
        onClose={() => setCitationSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#991B1B",
  },
  endedContainer: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  endedText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
});
