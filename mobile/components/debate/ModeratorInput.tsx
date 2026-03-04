import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { DEBATE_CONFIG } from "../../constants/config";

interface Props {
  disabled: boolean;
  onSubmit: (message: string, directedAt: string | null) => void;
}

export default function ModeratorInput({ disabled, onSubmit }: Props) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSubmit(trimmed, null);
    setMessage("");
  };

  const charCount = message.length;
  const overLimit = charCount > DEBATE_CONFIG.maxMessageLength;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={message}
          onChangeText={setMessage}
          placeholder={
            disabled
              ? "Wait for the round to complete..."
              : "Ask a question or steer the debate..."
          }
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={DEBATE_CONFIG.maxMessageLength + 50}
          editable={!disabled}
          accessibilityLabel="Moderator input"
          accessibilityHint="Type a question or comment for the debate personas"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (disabled || !message.trim() || overLimit) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={disabled || !message.trim() || overLimit}
          accessibilityRole="button"
          accessibilityLabel="Send interjection"
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
      {charCount > DEBATE_CONFIG.maxMessageLength * 0.8 && (
        <Text style={[styles.charCount, overLimit && styles.charCountOver]}>
          {charCount}/{DEBATE_CONFIG.maxMessageLength}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1F2937",
    maxHeight: 100,
  },
  inputDisabled: {
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
  },
  sendButton: {
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  charCount: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 2,
  },
  charCountOver: {
    color: "#EF4444",
  },
});
