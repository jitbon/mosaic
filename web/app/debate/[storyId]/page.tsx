import DebateClient from "./DebateClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default async function DebatePage({ params }: { params: Promise<{ storyId: string }> }) {
  const { storyId } = await params;
  return <DebateClient storyId={storyId} />;
}
