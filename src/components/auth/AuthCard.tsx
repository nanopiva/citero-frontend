"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
};

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  icon,
}: AuthCardProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-3xl border border-hairline bg-paper p-5 shadow-sm-2 sm:p-10"
    >
      <div className="text-center">
        {icon ? (
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-signal-blue">
            {icon}
          </div>
        ) : (
          <div className="flex justify-center">
            <Image
              src="/logos/LogoCi.webp"
              alt="Citero"
              width={582}
              height={697}
              sizes="48px"
              className="h-12 w-auto object-contain transition-transform duration-300 ease-out hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"
            />
          </div>
        )}
        <h1 className="mt-5 text-subheading font-bold leading-subheading text-ink-navy">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-body leading-body-lg text-slate-gray">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-8">{children}</div>

      {footer && (
        <div className="mt-8 border-t border-hairline pt-6 text-center text-body-sm text-slate-gray">
          {footer}
        </div>
      )}
    </motion.div>
  );
}
