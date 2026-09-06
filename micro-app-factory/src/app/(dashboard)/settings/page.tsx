export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Editable scoring-rule weights, checklist templates, and category/source
        management come in a later phase. The scoring rules table already
        exists in the database so this screen can be added without a schema
        change.
      </p>
    </div>
  );
}
