import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Citation } from "../../types/chat";
import CitationCard from "./CitationCard";

interface Props {
  visible: boolean;
  citations: Citation[];
  onClose: () => void;
}

export default function CitationSheet({ visible, citations, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>
              Sources ({citations.length})
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close sources">
              <Text style={styles.closeText}>Done</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {citations.map((citation) => (
              <CitationCard key={citation.index} citation={citation} />
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },
  closeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 8,
  },
});
