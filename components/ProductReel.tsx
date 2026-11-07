"use client";

import { useRef, type ReactNode } from "react";

/**
 * Horizontal, scroll-snapping product reel: swipe on touch, arrow buttons on
 * wider screens. Children are the `<li>` items (server-rendered cards).
 */
export function ProductReel({
  title,
  previousLabel,
  nextLabel,
  children,
}: {
  title: string;
  previousLabel: string;
  nextLabel: string;
  children: ReactNode;
}) {
  const listRef = useRef<HTMLUListElement>(null);

  function scroll(direction: 1 | -1) {
    const list = listRef.current;
    if (!list) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({ left: direction * list.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  }

  const arrow = (direction: 1 | -1) => (
    <button
      type="button"
      onClick={() => scroll(direction)}
      aria-label={direction === 1 ? nextLabel : previousLabel}
      className="button-icon focus-visible:outline-accent inline-flex h-10 w-10 items-center justify-center rounded-full border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <img
        src={direction === 1 ? "/icons/icon-chevron-right.svg" : "/icons/icon-chevron-left.svg"}
        width="20"
        height="20"
        alt=""
        aria-hidden="true"
        className="size-5"
      />
    </button>
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="type-heading-xl">{title}</h2>
        <div className="hidden gap-2 md:flex">
          {arrow(-1)}
          {arrow(1)}
        </div>
      </div>
      <ul
        ref={listRef}
        role="list"
        className="scrollbar-none relative -mx-margin px-margin scroll-px-margin flex snap-x snap-mandatory gap-4 overflow-x-auto pt-1 pb-2 [&>li]:w-[calc((100%-1rem)/2)] [&>li]:shrink-0 [&>li]:snap-start md:[&>li]:w-[calc((100%-2rem)/3)] lg:[&>li]:w-[calc((100%-4rem)/5)]"
      >
        {children}
      </ul>
    </>
  );
}
