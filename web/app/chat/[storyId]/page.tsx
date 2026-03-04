import ChatClient from "./ChatClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default async function ChatPage({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  return <ChatClient storyId={storyId} />;
}
