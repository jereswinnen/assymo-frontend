// Shared icon map for all components
// Add new icons here and they'll be available everywhere

import {
  AnvilIcon,
  ArrowDownAZIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  BicepsFlexedIcon,
  Calendar1Icon,
  DownloadIcon,
  EyeIcon,
  FenceIcon,
  HardHatIcon,
  HeartHandshakeIcon,
  HousePlusIcon,
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
  ScaleIcon,
  SmileIcon,
  SolarPanelIcon,
  SparklesIcon,
  SplinePointerIcon,
  TreesIcon,
  WarehouseIcon,
} from "lucide-react";

// Icon definitions with display labels
// Add new icons here - they'll automatically appear in admin forms
const iconDefinitions = {
  anvil: { label: "Anvil", icon: AnvilIcon },
  arrow: { label: "Arrow", icon: ArrowRightIcon },
  badgecheck: { label: "Badge Check", icon: BadgeCheckIcon },
  bicepsflexed: { label: "Biceps Flexed", icon: BicepsFlexedIcon },
  calendar: { label: "Calendar", icon: Calendar1Icon },
  chat: { label: "Chat", icon: MessagesSquareIcon },
  cursor: { label: "Cursor", icon: SplinePointerIcon },
  download: { label: "Download", icon: DownloadIcon },
  eye: { label: "Eye", icon: EyeIcon },
  fence: { label: "Fence", icon: FenceIcon },
  hardhat: { label: "Hard Hat", icon: HardHatIcon },
  hearthandshake: { label: "Heart Handshake", icon: HeartHandshakeIcon },
  houseplus: { label: "House Plus", icon: HousePlusIcon },
  info: { label: "Info", icon: InfoIcon },
  leaf: { label: "Leaf", icon: LeafIcon },
  list: { label: "List", icon: ListTreeIcon },
  mail: { label: "Mail", icon: MailIcon },
  paintbrush: { label: "Paintbrush", icon: PaintbrushIcon },
  phone: { label: "Phone", icon: PhoneIcon },
  route: { label: "Route", icon: RouteIcon },
  ruler: { label: "Ruler", icon: RulerDimensionLineIcon },
  scale: { label: "Scale", icon: ScaleIcon },
  smile: { label: "Smile", icon: SmileIcon },
  solarpanel: { label: "Solar Panel", icon: SolarPanelIcon },
  sort: { label: "Sort", icon: ArrowDownAZIcon },
  sparkles: { label: "Sparkles", icon: SparklesIcon },
  trees: { label: "Trees", icon: TreesIcon },
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
