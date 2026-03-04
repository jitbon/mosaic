import { Tabs } from "expo-router";
import { Colors } from "../../constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        headerStyle: { backgroundColor: Colors.surfaceBg },
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarLabel: "Feed",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Chat History",
          tabBarLabel: "Chats",
        }}
      />
      <Tabs.Screen
        name="story/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat/[storyId]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
