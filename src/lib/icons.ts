// Shared icon map for all components
// Add new icons here and they'll be available everywhere

import {
  ArrowRightIcon,
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
  PhoneIcon,
  RulerDimensionLineIcon,
  WarehouseIcon,
} from "lucide-react";

// Icon definitions with display labels
// Add new icons here - they'll automatically appear in admin forms
const iconDefinitions = {
  arrow: { label: "Arrow", icon: ArrowRightIcon },
  calendar: { label: "Calendar", icon: Calendar1Icon },
  chat: { label: "Chat", icon: MessagesSquareIcon },
  download: { label: "Download", icon: DownloadIcon },
  eye: { label: "Eye", icon: EyeIcon },
  hardhat: { label: "Hard Hat", icon: HardHatIcon },
  info: { label: "Info", icon: InfoIcon },
  leaf: { label: "Leaf", icon: LeafIcon },
  list: { label: "List", icon: ListTreeIcon },
  mail: { label: "Mail", icon: MailIcon },
  phone: { label: "Phone", icon: PhoneIcon },
  ruler: { label: "Ruler", icon: RulerDimensionLineIcon },
  warehouse: { label: "Warehouse", icon: WarehouseIcon },
} as const;

// Icon map for rendering (used by components)
export const iconMap: Record<string, LucideIcon> = Object.fromEntries(
  Object.entries(iconDefinitions).map(([key, { icon }]) => [key, icon])
);

// Icon options for admin forms (derived from iconDefinitions)
export const ICON_OPTIONS = Object.entries(iconDefinitions).map(
  ([value, { label }]) => ({ label, value })
);

// Icon options with "None" option for optional icon fields
export const ICON_OPTIONS_WITH_NONE = [
  { label: "Geen", value: "" },
  ...ICON_OPTIONS,
];
