"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared HCS brand navbar shell.
 * Layout: logo (left) · system name (center) · actions (right)
 */
export function HcsBrandNavbar({
  title,
  subtitle,
  homeHref = "/",
  right = null,
  bottom = null,
  className,
  logoWidthClass = "w-[160px] md:w-[200px]",
}) {
  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full overflow-hidden shadow-[0_2px_0_rgba(0,0,0,0.12)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#4d087c] via-[#37259b] to-[#047bd5]" />

      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 84% 63%, rgba(255,255,255,0.23) 0 1px, transparent 1.8px)",
          backgroundSize: "14px 14px",
        }}
        aria-hidden="true"
      />

      <div
        className="absolute -right-8 top-0 h-full w-1/3 skew-x-[-28deg] bg-gradient-to-r from-transparent via-white/8 to-transparent"
        aria-hidden="true"
      />

      <div
        className="absolute bottom-0 right-[9%] h-[120%] w-[35%] rounded-full bg-[#7949ff]/30 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative flex h-16 items-center px-4 md:px-8">
        <Link
          href={homeHref}
          className="relative z-10 flex shrink-0 items-center"
          aria-label="Hilton Car Supermarket home"
        >
          <div className={cn("relative h-9", logoWidthClass)}>
            <Image
              src="/logo-hilton.svg"
              alt="Hilton Car Supermarket"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>

        <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center px-24 sm:px-40 md:px-52">
          <div className="max-w-[min(100%,28rem)] text-center">
            {subtitle ? (
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.22em] text-blue-200/70 sm:text-[0.6rem]">
                {subtitle}
              </p>
            ) : null}
            <p className="truncate bg-gradient-to-r from-white to-blue-200 bg-clip-text text-sm font-extrabold leading-tight tracking-tight text-transparent sm:text-base md:text-lg">
              {title}
            </p>
          </div>
        </div>

        <div className="relative z-10 ml-auto flex min-w-0 shrink items-center justify-end gap-2">
          {right}
        </div>
      </div>

      {bottom ? <div className="relative z-10">{bottom}</div> : null}
    </nav>
  );
}

/** Glass action button style matching HCS brand navbar */
export const navActionClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/15 px-3 py-2 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm transition-all duration-200 hover:border-white/50 hover:bg-white/25 sm:px-4 sm:py-2.5";

export const navActionPrimaryClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/25 px-3 py-2 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm transition-all duration-200 hover:border-white/50 hover:bg-white/35 sm:px-4 sm:py-2.5";
