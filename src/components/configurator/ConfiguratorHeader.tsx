import Link from "next/link";
import Logo from "@/components/layout/Logo";

export function ConfiguratorHeader() {
  return (
    <header className="flex items-center justify-between py-8">
      <Link href="/">
        <Logo className="w-28" />
      </Link>

      <Link
        href="/"
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Terug naar Assymo
      </Link>
    </header>
  );
}
