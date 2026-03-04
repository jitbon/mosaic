import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { Colors } from "../../../constants/theme";
import DebatePersonaSelector from "../../../components/debate/DebatePersonaSelector";
import DebateView from "../../../components/debate/DebateView";
import { useDebate } from "../../../hooks/useDebate";
import { getPerspectives } from "../../../services/chatApi";
import { updateDebateStatus } from "../../../services/debateApi";
import type { Perspective, PerspectiveAvailability } from "../../../types/chat";

export default function DebateScreen() {
  const {
    storyId,
    headline,
    debateId: resumeDebateId,
  } = useLocalSearchParams<{
    storyId: string;
    headline?: string;
    debateId?: string;
  }>();
  const router = useRouter();

  const [availability, setAvailability] =
    useState<PerspectiveAvailability | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [started, setStarted] = useState(false);

  const {
    debate,
    turns,
    isStreaming,
    currentStreamingRole,
    streamingContent,
    roundComplete,
    error,
    startDebate,
    resumeDebate,
    requestNextRound,
    submitInterjection,
    toggleTurnExpanded,
  } = useDebate();

  // Pause debate when navigating away
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (debate && debate.status === "active" && !isStreaming) {
          updateDebateStatus(String(debate.id), "paused").catch(() => {});
        }
      };
    }, [debate, isStreaming]),
  );

  const handleEndDebate = useCallback(async () => {
    if (!debate) return;
    try {
      await updateDebateStatus(String(debate.id), "completed");
      router.back();
    } catch {
      // Already completed or error — navigate back anyway
      router.back();
    }
  }, [debate, router]);

  // Resume existing debate if debateId provided
  useEffect(() => {
    if (resumeDebateId) {
      setStarted(true);
      setLoadingAvailability(false);
      resumeDebate(resumeDebateId);
      return;
    }
    if (!storyId) return;
    setLoadingAvailability(true);
    getPerspectives(storyId)
      .then(setAvailability)
      .catch(() => setAvailability(null))
      .finally(() => setLoadingAvailability(false));
  }, [storyId, resumeDebateId]);

  const handleStart = async (personas: Perspective[]) => {
    if (!storyId) return;
    setStarted(true);
    await startDebate(storyId, personas, headline);
  };

  // Loading state
  if (loadingAvailability) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Error loading availability
  if (!availability) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Unable to load perspective data. Please try again.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Pre-debate: persona selector
  if (!started || !debate) {
    return (
      <View style={styles.container}>
        {headline && <Text style={styles.headline}>{headline}</Text>}
        <DebatePersonaSelector
          availability={availability}
          onStart={handleStart}
        />
      </View>
    );
  }

  // Active debate
  return (
    <View style={styles.container}>
      <DebateView
        personas={debate.personas as Perspective[]}
        turns={turns}
        isStreaming={isStreaming}
        currentStreamingRole={currentStreamingRole}
        streamingContent={streamingContent}
        roundComplete={roundComplete}
        error={error}
        onNextRound={requestNextRound}
        onInterjection={submitInterjection}
        onToggleTurnExpanded={toggleTurnExpanded}
        onEndDebate={handleEndDebate}
      />
    </View>
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
  headline: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: Colors.errorFg,
    textAlign: "center",
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: Colors.neutral,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.cardBg,
    fontSize: 14,
    fontWeight: "600",
  },
});
