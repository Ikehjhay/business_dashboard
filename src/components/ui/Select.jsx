export default function Select({ label, value, onChange, options, className = "" }) {
  return (
    <div className={className}>
      {label && <label className="mb-1 block text-xs font-medium text-muted">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
