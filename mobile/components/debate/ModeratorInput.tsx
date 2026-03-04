import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../../constants/theme";
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
          placeholderTextColor={Colors.textFaint}
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
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    maxHeight: 100,
  },
  inputDisabled: {
    backgroundColor: Colors.skeletonShine,
    color: Colors.textFaint,
  },
  sendButton: {
    backgroundColor: Colors.success,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.borderLight,
  },
  sendButtonText: {
    color: Colors.cardBg,
    fontSize: 14,
    fontWeight: "700",
  },
  charCount: {
    fontSize: 11,
    color: Colors.textFaint,
    textAlign: "right",
    marginTop: 2,
  },
  charCountOver: {
    color: Colors.errorFg,
  },
});
