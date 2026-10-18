import Link from "next/link";

export default function Brand({ href }: { href: string }) {
  return (
    <Link className="brand" href={href} aria-label="Suprima home">
      <i className="brand-mark">
        <b />
        <b />
        <b />
      </i>
      <span className="brand-name">
        suprima<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
