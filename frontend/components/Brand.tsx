import Link from "next/link";

type BrandProps = {
  href?: string;
  compact?: boolean;
  product?: string;
  className?: string;
};

export default function Brand({ href = "/", compact = false, product = "Loyalty", className = "" }: BrandProps) {
  const content = (
    <span className={`orbitica-brand ${compact ? "compact" : ""} ${className}`.trim()}>
      <img src="/brand/orbitica-mark.svg" alt="" aria-hidden="true" />
      <span className="orbitica-brand-copy">
        <strong>Orbítica</strong>
        <span className="orbitica-studio">Studio</span>
        <small>{product}</small>
      </span>
    </span>
  );

  if (!href) return content;
  return <Link href={href} aria-label={`Orbítica Studio · ${product}`}>{content}</Link>;
}
