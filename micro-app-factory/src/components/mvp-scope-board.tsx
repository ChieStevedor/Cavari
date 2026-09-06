import { cn } from "@/lib/utils";

function ScopeColumn({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "must" | "should" | "not-now" | "future";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3",
        tone === "not-now" && "border-danger/40 bg-danger/5",
      )}
    >
      <h4
        className={cn(
          "text-xs font-semibold tracking-wide uppercase",
          tone === "must" && "text-success",
          tone === "should" && "text-info",
          tone === "not-now" && "text-danger",
          tone === "future" && "text-muted-foreground",
        )}
      >
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">—</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MvpScopeBoard({
  mustHave,
  shouldHave,
  notNow,
  future,
}: {
  mustHave: string[];
  shouldHave: string[];
  notNow: string[];
  future: string[];
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <ScopeColumn title="Must have" items={mustHave} tone="must" />
      <ScopeColumn title="Should have" items={shouldHave} tone="should" />
      <ScopeColumn title="Not now" items={notNow} tone="not-now" />
      <ScopeColumn title="Future" items={future} tone="future" />
    </div>
  );
}
