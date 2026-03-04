import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        headerStyle: { backgroundColor: "#f8fafc" },
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
