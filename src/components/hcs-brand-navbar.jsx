"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared HCS brand navbar shell.
 * Layout: logo + system name (left) · actions (right)
 */
export function HcsBrandNavbar({
  title,
  subtitle,
  homeHref = "/",
  right = null,
  bottom = null,
  className,
  logoWidthClass = "w-[118px] sm:w-[148px] xl:w-[160px] 2xl:w-[184px]",
}) {
  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full shadow-[0_2px_0_rgba(0,0,0,0.12)]",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#4d087c] via-[#37259b] to-[#047bd5]" />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 84% 63%, rgba(255,255,255,0.23) 0 1px, transparent 1.8px)",
            backgroundSize: "14px 14px",
          }}
        />
        <div className="absolute -right-8 top-0 h-full w-1/3 skew-x-[-28deg] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute bottom-0 right-[9%] h-[120%] w-[35%] rounded-full bg-[#7949ff]/30 blur-2xl" />
      </div>

      <div className="relative z-10 flex h-16 min-w-0 items-center gap-2 px-3 sm:px-4 md:px-5 xl:px-6">
        <Link
          href={homeHref}
          className="relative z-10 flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
          aria-label="Hilton Car Supermarket home"
        >
          <div className={cn("relative h-8 sm:h-9", logoWidthClass)}>
            <Image
              src="/logo-hilton.svg"
              alt="Hilton Car Supermarket"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          {title ? (
            <div className="hidden min-w-0 border-l border-white/25 pl-3 sm:block">
              {subtitle ? (
                <p className="text-[0.55rem] font-bold uppercase tracking-[0.22em] text-blue-200/70">
                  {subtitle}
                </p>
              ) : null}
              <p className="truncate bg-gradient-to-r from-white to-blue-200 bg-clip-text text-sm font-extrabold leading-tight tracking-tight text-transparent">
                {title}
              </p>
            </div>
          ) : null}
        </Link>

        <div className="relative z-30 ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5">
          {right}
        </div>
      </div>

      {bottom ? <div className="relative z-20">{bottom}</div> : null}
    </nav>
  );
}

/** Glass action button style matching HCS brand navbar */
export const navActionClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/15 px-3 py-2 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm transition-all duration-200 hover:border-white/50 hover:bg-white/25 sm:px-4 sm:py-2.5";

export const navActionPrimaryClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/25 px-3 py-2 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm transition-all duration-200 hover:border-white/50 hover:bg-white/35 sm:px-4 sm:py-2.5";
