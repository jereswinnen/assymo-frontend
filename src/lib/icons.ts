// Shared icon map for all components
// Add new icons here and they'll be available everywhere

import {
  ArrowDownAZIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  Calendar1Icon,
  DownloadIcon,
  EyeIcon,
  HardHatIcon,
  InfoIcon,
  LeafIcon,
  ListTreeIcon,
  LucideIcon,
  MailIcon,
  MessagesSquareIcon,
  PaintbrushIcon,
  PhoneIcon,
  RouteIcon,
  RulerDimensionLineIcon,
  SplinePointerIcon,
  WarehouseIcon,
} from "lucide-react";

// Icon definitions with display labels
// Add new icons here - they'll automatically appear in admin forms
const iconDefinitions = {
  arrow: { label: "Arrow", icon: ArrowRightIcon },
  badgecheck: { label: "Badge Check", icon: BadgeCheckIcon },
  calendar: { label: "Calendar", icon: Calendar1Icon },
  chat: { label: "Chat", icon: MessagesSquareIcon },
  cursor: { label: "Cursor", icon: SplinePointerIcon },
  download: { label: "Download", icon: DownloadIcon },
  eye: { label: "Eye", icon: EyeIcon },
  hardhat: { label: "Hard Hat", icon: HardHatIcon },
  info: { label: "Info", icon: InfoIcon },
  leaf: { label: "Leaf", icon: LeafIcon },
  list: { label: "List", icon: ListTreeIcon },
  mail: { label: "Mail", icon: MailIcon },
  paintbrush: { label: "Paintbrush", icon: PaintbrushIcon },
  phone: { label: "Phone", icon: PhoneIcon },
  route: { label: "Route", icon: RouteIcon },
  ruler: { label: "Ruler", icon: RulerDimensionLineIcon },
  sort: { label: "Sort", icon: ArrowDownAZIcon },
  warehouse: { label: "Warehouse", icon: WarehouseIcon },
} as const;

// Icon map for rendering (used by components)
export const iconMap: Record<string, LucideIcon> = Object.fromEntries(
  Object.entries(iconDefinitions).map(([key, { icon }]) => [key, icon]),
);

// Icon options for admin forms (derived from iconDefinitions)
export const ICON_OPTIONS = Object.entries(iconDefinitions).map(
  ([value, { label, icon }]) => ({ label, value, icon }),
);

// Icon options with "None" option for optional icon fields
export const ICON_OPTIONS_WITH_NONE: Array<{
  label: string;
  value: string;
  icon?: LucideIcon;
}> = [{ label: "Geen", value: "" }, ...ICON_OPTIONS];
