import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { Perspective } from "../../types/chat";
import type { DebateTurnState } from "../../hooks/useDebate";
import type { DebateRole } from "../../types/debate";
import DebateDisclaimer from "./DebateDisclaimer";
import DebateTurn from "./DebateTurn";
import ModeratorInput from "./ModeratorInput";

interface Props {
  personas: Perspective[];
  turns: DebateTurnState[];
  isStreaming: boolean;
  currentStreamingRole: DebateRole | null;
  streamingContent: string;
  roundComplete: boolean;
  error: string | null;
  onNextRound: () => void;
  onInterjection: (message: string, directedAt: string | null) => void;
  onToggleTurnExpanded: (turnNumber: number) => void;
  onEndDebate?: () => void;
}

export default function DebateView({
  personas,
  turns,
  isStreaming,
  currentStreamingRole,
  streamingContent,
  roundComplete,
  error,
  onNextRound,
  onInterjection,
  onToggleTurnExpanded,
  onEndDebate,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (isStreaming || turns.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isStreaming, turns.length, streamingContent]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <DebateDisclaimer personas={personas} />

        {turns.map((turn) => (
          <DebateTurn
            key={turn.turn_number}
            role={turn.role}
            content={turn.content}
            summary={turn.summary}
            citations={turn.citations}
            isStreaming={false}
            isExpanded={turn.isExpanded}
            onToggleExpand={() => onToggleTurnExpanded(turn.turn_number)}
          />
        ))}

        {/* Currently streaming turn */}
        {currentStreamingRole && (
          <DebateTurn
            role={currentStreamingRole}
            content={streamingContent}
            summary={null}
            citations={null}
            isStreaming={true}
            isExpanded={true}
            onToggleExpand={() => {}}
          />
        )}

        {/* Loading indicator between turns */}
        {isStreaming && !currentStreamingRole && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6B7280" />
            <Text style={styles.loadingText}>Next persona preparing...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Round complete actions */}
        {roundComplete && !isStreaming && (
          <View style={styles.roundActions}>
            <Text style={styles.roundCompleteText}>Round complete</Text>
            <View style={styles.roundButtonRow}>
              <TouchableOpacity
                style={styles.nextRoundButton}
                onPress={onNextRound}
                accessibilityRole="button"
                accessibilityLabel="Continue to next round"
              >
                <Text style={styles.nextRoundButtonText}>Next Round</Text>
              </TouchableOpacity>
              {onEndDebate && (
                <TouchableOpacity
                  style={styles.endDebateButton}
                  onPress={onEndDebate}
                  accessibilityRole="button"
                  accessibilityLabel="End debate"
                >
                  <Text style={styles.endDebateButtonText}>End Debate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      <ModeratorInput disabled={isStreaming} onSubmit={onInterjection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 13,
    color: "#6B7280",
  },
  errorContainer: {
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
  },
  roundActions: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  roundCompleteText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  roundButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  nextRoundButton: {
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  nextRoundButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  endDebateButton: {
    backgroundColor: "#6B7280",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  endDebateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
