import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  compact?: boolean;
};

export function BrandMark({
  href = "/admin/dashboard",
  compact = false
}: BrandMarkProps) {
  return (
    <Link href={href} className={`brand-mark ${compact ? "compact" : ""}`}>
      <Image
        src="/brand/k-minari-logo.png"
        alt="K-minari"
        width={compact ? 170 : 210}
        height={compact ? 54 : 68}
        className="brand-logo"
        priority
      />

      <div className="brand-copy">
        <strong>K-minari</strong>
        <span>Ichiban Kuji Digital</span>
      </div>
    </Link>
  );
}