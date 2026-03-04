import StoryClient from "./StoryClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoryClient id={id} />;
}
