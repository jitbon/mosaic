import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/theme";
import type { Perspective, PerspectiveAvailability } from "../../types/chat";

const PERSPECTIVES: { key: Perspective; label: string; color: string }[] = [
  { key: "left", label: "Left", color: Colors.left },
  { key: "center", label: "Center", color: Colors.center },
  { key: "right", label: "Right", color: Colors.right },
];

interface Props {
  availability: PerspectiveAvailability;
  onStart: (personas: Perspective[]) => void;
}

export default function DebatePersonaSelector({
  availability,
  onStart,
}: Props) {
  const [selected, setSelected] = useState<Set<Perspective>>(new Set());

  const toggle = (p: Perspective) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) {
        next.delete(p);
      } else if (next.size < 3) {
        next.add(p);
      }
      return next;
    });
  };

  const canStart = selected.size >= 2;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Perspectives</Text>
      <Text style={styles.subtitle}>Select 2 or 3 personas for the debate</Text>

      <View style={styles.options}>
        {PERSPECTIVES.map(({ key, label, color }) => {
          const info = availability.perspectives[key];
          const disabled = !info?.available;
          const active = selected.has(key);

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.option,
                active && { backgroundColor: color, borderColor: color },
                disabled && styles.optionDisabled,
              ]}
              onPress={() => !disabled && toggle(key)}
              disabled={disabled}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active, disabled }}
              accessibilityLabel={`${label} perspective${disabled ? " (no sources available)" : ""}`}
            >
              <Text
                style={[
                  styles.optionLabel,
                  active && styles.optionLabelActive,
                  disabled && styles.optionLabelDisabled,
                ]}
              >
                {label}
              </Text>
              {disabled && <Text style={styles.noSources}>No sources</Text>}
              {!disabled && info && (
                <Text
                  style={[
                    styles.sourceCount,
                    active && styles.sourceCountActive,
                  ]}
                >
                  {info.source_count} sources
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.startButton, !canStart && styles.startButtonDisabled]}
        onPress={() => canStart && onStart(Array.from(selected))}
        disabled={!canStart}
        accessibilityRole="button"
        accessibilityLabel="Start debate"
        accessibilityState={{ disabled: !canStart }}
      >
        <Text
          style={[
            styles.startButtonText,
            !canStart && styles.startButtonTextDisabled,
          ]}
        >
          Start Debate
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  options: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  option: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: "center",
    gap: 4,
  },
  optionDisabled: {
    opacity: 0.4,
    backgroundColor: Colors.skeletonShine,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  optionLabelActive: {
    color: Colors.cardBg,
  },
  optionLabelDisabled: {
    color: Colors.textFaint,
  },
  noSources: {
    fontSize: 11,
    color: Colors.textFaint,
  },
  sourceCount: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sourceCountActive: {
    color: "rgba(255,255,255,0.8)",
  },
  startButton: {
    backgroundColor: Colors.success,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  startButtonDisabled: {
    backgroundColor: Colors.borderLight,
  },
  startButtonText: {
    color: Colors.cardBg,
    fontSize: 16,
    fontWeight: "700",
  },
  startButtonTextDisabled: {
    color: Colors.textFaint,
  },
});
