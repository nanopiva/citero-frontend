import Image from "next/image";
import Link from "next/link";

export function Logo({
  href = "/",
  showWordmark = true,
}: {
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="Citero — Inicio"
      className="group inline-flex shrink-0 items-center"
    >
      {showWordmark ? (
        <>
          <Image
            src="/logos/LogoCi.webp"
            alt="Citero"
            width={582}
            height={697}
            sizes="24px"
            className="h-7 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:hidden"
          />
          <Image
            src="/logos/LogoCitero.webp"
            alt="Citero"
            width={1401}
            height={467}
            sizes="84px"
            className="hidden h-7 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:block"
          />
        </>
      ) : (
        <Image
          src="/logos/LogoCi.webp"
          alt="Citero"
          width={582}
          height={697}
          sizes="24px"
          className="h-7 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      )}
    </Link>
  );
}
