import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Eyebrow({
  index,
  children,
  className,
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 eyebrow", className)}>
      {index ? (
        <>
          <span className="inline-block h-px w-6 bg-bone/30" />
          <span>{index}</span>
          <span className="text-bone/30">·</span>
        </>
      ) : null}
      <span>{children}</span>
    </div>
  );
}
