export default function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`rounded-[10px] border border-line bg-surface p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
