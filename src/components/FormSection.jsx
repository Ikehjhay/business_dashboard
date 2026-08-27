import Card from "./ui/Card";

export default function FormSection({ title, description, children }) {
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </Card>
  );
}
