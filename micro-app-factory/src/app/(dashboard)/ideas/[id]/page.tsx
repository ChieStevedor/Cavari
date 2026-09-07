import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ExternalLink, Trash2 } from "lucide-react";

import { getIdeaById, getResearchItemsForIdea } from "@/lib/data/ideas";
import { getProductByIdeaId } from "@/lib/data/products";
import { ScoreBadges } from "@/components/score-badge";
import { IdeaStatusBadge } from "@/components/status-badge";
import { IdeaStatusControl } from "@/components/idea-status-control";
import { ResearchItemForm } from "@/components/research-item-form";
import { deleteResearchItem } from "@/actions/ideas";
import { formatCents, formatDate, formatHours } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idea = await getIdeaById(id);
  if (!idea) notFound();

  const [researchItems, product] = await Promise.all([
    getResearchItemsForIdea(id),
    getProductByIdeaId(id),
  ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">{idea.name}</h1>
            <IdeaStatusBadge status={idea.status} />
          </div>
          <ScoreBadges
            opportunityScore={idea.opportunity_score}
            evidenceConfidence={idea.evidence_confidence}
          />
        </div>
        <div className="flex items-center gap-2">
          {product ? (
            <Button asChild size="sm">
              <Link href={`/products/${product.id}`}>View product</Link>
            </Button>
          ) : (
            <IdeaStatusControl
              ideaId={idea.id}
              ideaName={idea.name}
              status={idea.status}
              evidence={{
                opportunityScore: idea.opportunity_score,
                evidenceConfidence: idea.evidence_confidence,
              }}
            />
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/ideas/${idea.id}/edit`}>
              <Pencil />
              Edit
            </Link>
          </Button>
          {idea.status === "VALIDATING" && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/ideas/${idea.id}/validate`}>Validation workspace</Link>
            </Button>
          )}
        </div>
      </div>
      {product && (
        <p className="text-xs text-muted-foreground">
          This idea became a product — status and further progress are now tracked on the product page.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="Category" value={idea.category?.name} />
            <DetailRow label="Source" value={idea.source?.name} />
            <DetailRow
              label="Source URL"
              value={
                idea.source_url && (
                  <a
                    href={idea.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-info hover:underline"
                  >
                    {idea.source_url} <ExternalLink className="size-3" />
                  </a>
                )
              }
            />
            <DetailRow label="Created" value={formatDate(idea.created_at)} />
          </dl>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <DetailRow label="Description" value={idea.description} />
            <DetailRow label="Target customer" value={idea.target_customer} />
            <DetailRow label="Problem" value={idea.problem} />
            <DetailRow label="Proposed solution" value={idea.solution} />
            <DetailRow label="Founder notes" value={idea.founder_notes} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Market</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="Existing alternatives" value={idea.existing_alternatives} />
            <DetailRow label="Main competitor" value={idea.main_competitor} />
            <DetailRow
              label="Competitor URL"
              value={
                idea.competitor_url && (
                  <a
                    href={idea.competitor_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-info hover:underline"
                  >
                    {idea.competitor_url}
                  </a>
                )
              }
            />
            <DetailRow label="Competitor pricing" value={idea.competitor_pricing} />
            <DetailRow label="Competitor reviews" value={idea.competitor_reviews} />
            <DetailRow label="Market size estimate" value={idea.market_size_estimate} />
            <DetailRow label="Search intent" value={idea.search_intent_notes} />
          </dl>
          <div className="mt-4">
            <DetailRow label="Evidence of demand" value={idea.evidence_of_demand} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product planning</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="MVP complexity" value={idea.mvp_complexity} />
            <DetailRow
              label="Estimated build hours"
              value={idea.estimated_build_hours != null ? formatHours(idea.estimated_build_hours) : null}
            />
            <DetailRow label="Required integrations" value={idea.required_integrations} />
            <DetailRow label="Distribution channel" value={idea.distribution_channel} />
            <DetailRow label="Potential moat" value={idea.potential_moat} />
            <DetailRow label="Monetization model" value={idea.monetization_model} />
            <DetailRow
              label="Expected price"
              value={idea.expected_price_cents != null ? formatCents(idea.expected_price_cents) : null}
            />
          </dl>
          <div className="mt-4">
            <DetailRow label="Technical risks" value={idea.technical_risks} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evidence ({researchItems.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ResearchItemForm ideaId={idea.id} />
          <div className="flex flex-col gap-2">
            {researchItems.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No evidence logged yet — every conclusion here should trace back to something real.
              </p>
            )}
            {researchItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.type.replace("_", " ")}</Badge>
                    {item.evidence_strength !== null && (
                      <span className="text-xs text-muted-foreground">
                        strength {item.evidence_strength}/5
                      </span>
                    )}
                  </div>
                  {item.title && <p className="text-sm font-medium">{item.title}</p>}
                  {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-info hover:underline"
                    >
                      {item.url}
                    </a>
                  )}
                </div>
                <form
                  action={async () => {
                    "use server";
                    await deleteResearchItem(idea.id, item.id);
                  }}
                >
                  <Button type="submit" variant="ghost" size="icon">
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
