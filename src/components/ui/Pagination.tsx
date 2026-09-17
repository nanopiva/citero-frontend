"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const isFirst = page <= 0;
  const isLast = page >= totalPages - 1;

  return (
    <nav
      aria-label="Paginación"
      className={`flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={isFirst}
        onClick={() => onPageChange(page - 1)}
        leftIcon={<CaretLeft className="h-4 w-4" weight="bold" />}
      >
        Anterior
      </Button>

      <span className="text-body-sm text-slate-gray">
        Página{" "}
        <strong className="font-semibold text-ink-navy">{page + 1}</strong> de{" "}
        {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={isLast}
        onClick={() => onPageChange(page + 1)}
        rightIcon={<CaretRight className="h-4 w-4" weight="bold" />}
      >
        Siguiente
      </Button>
    </nav>
  );
}
