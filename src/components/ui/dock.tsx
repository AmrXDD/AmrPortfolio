"use client";

/*
 * Dock — magnifying macOS-style dock (adapted from reactbits.dev).
 * Replaces the top navbar. Items magnify on hover and float a label above.
 */

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  type SpringOptions,
  type MotionValue,
} from "framer-motion";
import {
  Children,
  Fragment,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export type DockItemData = {
  icon: ReactNode;
  label: ReactNode;
  onClick: () => void;
  className?: string;
  /** a hairline after this item (sets a control apart from the nav) */
  divider?: boolean;
  /** for a toggle: its pressed state */
  pressed?: boolean;
};

type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
};

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  pressed,
}: {
  children: ReactNode;
  className?: string;
  pressed?: boolean;
  onClick: () => void;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  magnification: number;
  baseItemSize: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onClick={onClick}
      data-cursor="link"
      className={cn(
        // solid, no backdrop blur: the dock is phone-only, where every blurred
        // layer over a moving page is re-rendered each frame
        "relative inline-flex items-center justify-center rounded-full border border-bone/15 bg-ash before:absolute before:-inset-1 before:content-['']",
        className
      )}
      tabIndex={0}
      role="button"
      aria-pressed={pressed}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {Children.map(children, (child) =>
        cloneElement(child as React.ReactElement<{ hovered?: boolean }>, { hovered })
      )}
    </motion.div>
  );
}

function DockLabel({
  children,
  hovered,
}: {
  children: ReactNode;
  hovered?: boolean;
}) {
  return (
    <AnimatePresence>
      {hovered ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none absolute -top-8 left-1/2 w-fit -translate-x-1/2 whitespace-nowrap rounded-md border border-bone/15 bg-ink/90 px-2 py-1 text-mono text-[10px] uppercase tracking-[0.18em] text-bone"
          role="tooltip"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DockIcon({ children }: { children: ReactNode; hovered?: boolean }) {
  return (
    <div className="flex items-center justify-center text-bone">{children}</div>
  );
}

export function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div style={{ height }} className="pointer-events-none flex items-end">
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={cn(
          "pointer-events-auto mx-auto flex w-fit items-end gap-2 rounded-full border border-bone/15 bg-ink/90 px-2.5 pb-2.5 pt-2 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.8)]",
          className
        )}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Site navigation dock"
      >
        {items.map((item, i) => (
          <Fragment key={i}>
            <DockItem
              onClick={item.onClick}
              className={item.className}
              pressed={item.pressed}
              mouseX={mouseX}
              spring={spring}
              distance={distance}
              magnification={magnification}
              baseItemSize={baseItemSize}
            >
              <DockIcon>{item.icon}</DockIcon>
              <DockLabel>{item.label}</DockLabel>
            </DockItem>
            {item.divider ? <span aria-hidden className="mb-1.5 h-6 w-px self-end bg-bone/15" /> : null}
          </Fragment>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default Dock;
