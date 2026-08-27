export default function EmptyState({ title, detail }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-line py-16 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {detail && <p className="mt-1 max-w-sm text-sm text-muted">{detail}</p>}
    </div>
  );
}
