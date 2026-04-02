"use client"

import { cn } from "@/lib/utils"

export type TodoStatus = "scheduled" | "running" | "success" | "error"

export function TodoMark({ status }: { status: TodoStatus }) {
  return (
    <span
      className={cn(
        "grid h-[19px] w-[19px] shrink-0 place-items-center rounded-[6px] border bg-transparent p-[1.5px]",
        "border-neutral-400/70",
      )}
    >
      <span
        className={cn(
          "grid h-full w-full place-items-center rounded-[4px]",
          status === "scheduled" && "bg-transparent",
          status === "running" && "bg-sky-500",
          status === "success" && "bg-emerald-500",
          status === "error" && "bg-[#ec3844]",
        )}
      />
    </span>
  )
}
