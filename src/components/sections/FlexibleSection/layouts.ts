import type { FlexibleLayout, VerticalAlign } from "./types";

// Grid column spans based on 9-column grid
export const layoutGridClasses: Record<
  FlexibleLayout,
  { left: string; right: string; main: string }
> = {
  "1-col": {
    main: "col-span-full md:col-span-7",
    left: "",
    right: "",
  },
  "2-col-equal": {
    left: "col-span-full md:col-span-4",
    right: "col-span-full md:col-span-5",
    main: "",
  },
  "2-col-left-wide": {
    left: "col-span-full md:col-span-5",
    right: "col-span-full md:col-span-4",
    main: "",
  },
  "2-col-right-wide": {
    left: "col-span-full md:col-span-3",
    right: "col-span-full md:col-span-6",
    main: "",
  },
};

export const alignClasses: Record<VerticalAlign, string> = {
  start: "self-start",
  center: "self-center",
  end: "self-end",
};
