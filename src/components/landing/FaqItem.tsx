"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PlusIcon } from "@phosphor-icons/react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  return (
    <div className="py-5">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full cursor-pointer list-none items-center justify-between gap-4 text-left text-body-lg font-semibold text-ink-navy"
      >
        {q}
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline text-signal-blue transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
        >
          <PlusIcon className="h-3.5 w-3.5" weight="bold" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pt-3 text-body text-slate-gray">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
