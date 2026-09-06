import { notFound } from "next/navigation";

import { getIdeaById } from "@/lib/data/ideas";
import { getCategories, getIdeaSources } from "@/lib/data/lookups";
import { updateIdea } from "@/actions/ideas";
import { IdeaForm } from "@/components/idea-form";

export default async function EditIdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [idea, categories, sources] = await Promise.all([
    getIdeaById(id),
    getCategories(),
    getIdeaSources(),
  ]);
  if (!idea) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-lg font-semibold tracking-tight">Edit idea</h1>
      <IdeaForm
        idea={idea}
        categories={categories}
        sources={sources}
        action={updateIdea.bind(null, idea.id)}
      />
    </div>
  );
}
