import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { CHAT_CONFIG } from "../../constants/config";
import { Colors } from "../../constants/theme";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask a question...",
}: Props) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const remaining = CHAT_CONFIG.maxMessageLength - text.length;
  const isOverLimit = remaining < 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.container}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, disabled && styles.inputDisabled]}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textFaint}
            multiline
            maxLength={CHAT_CONFIG.maxMessageLength + 10}
            editable={!disabled}
            accessibilityLabel="Message input"
            accessibilityHint="Type your message to the AI persona"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!text.trim() || disabled || isOverLimit) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!text.trim() || disabled || isOverLimit}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
        {text.length > CHAT_CONFIG.maxMessageLength - 100 && (
          <Text style={[styles.charCount, isOverLimit && styles.charCountOver]}>
            {remaining}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: Colors.textSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.borderLight,
  },
  sendButtonText: {
    color: Colors.cardBg,
    fontWeight: "600",
    fontSize: 15,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textFaint,
    textAlign: "right",
    marginTop: 4,
  },
  charCountOver: {
    color: Colors.errorFg,
  },
});
