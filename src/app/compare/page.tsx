import { CompareView } from "@/components/compare/CompareView";

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { ids } = await searchParams;
  const idList = (ids ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  return <CompareView ids={idList} />;
}
