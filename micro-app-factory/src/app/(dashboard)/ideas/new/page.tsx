import { createIdea } from "@/actions/ideas";
import { getCategories, getIdeaSources } from "@/lib/data/lookups";
import { IdeaForm } from "@/components/idea-form";

export default async function NewIdeaPage() {
  const [categories, sources] = await Promise.all([
    getCategories(),
    getIdeaSources(),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-lg font-semibold tracking-tight">New idea</h1>
      <IdeaForm categories={categories} sources={sources} action={createIdea} />
    </div>
  );
}
