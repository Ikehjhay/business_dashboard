export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-accent ${className}`}
      {...props}
    />
  );
}
