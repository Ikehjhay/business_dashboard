const VARIANTS = {
  primary: "bg-accent text-white hover:bg-accent-dark disabled:bg-accent/40",
  secondary: "bg-surface text-ink border border-line hover:bg-paper disabled:text-muted/50",
  danger: "bg-danger text-white hover:bg-danger/90 disabled:bg-danger/40",
  ghost: "text-muted hover:text-ink hover:bg-paper",
};

export default function Button({ variant = "primary", className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
