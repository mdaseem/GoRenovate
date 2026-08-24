import CategoryDetailView from "@/app/component/Molecules/CategoryDetailView/CategoryDetailView";

type PageProps = {
  params: Promise<{ categorySlug: string }>;
};

export default async function RoomCategoryDetailPage({ params }: PageProps) {
  const { categorySlug } = await params;
  return <CategoryDetailView categorySlug={categorySlug} />;
}
