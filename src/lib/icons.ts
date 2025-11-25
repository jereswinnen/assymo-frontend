// Shared icon map for all components
// Add new icons here and they'll be available in all components that use iconMap

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

export const iconMap: Record<string, LucideIcon> = {
  arrow: ArrowRightIcon,
  calendar: Calendar1Icon,
  chat: MessagesSquareIcon,
  download: DownloadIcon,
  eye: EyeIcon,
  hardhat: HardHatIcon,
  info: InfoIcon,
  leaf: LeafIcon,
  list: ListTreeIcon,
  mail: MailIcon,
  phone: PhoneIcon,
  ruler: RulerDimensionLineIcon,
  warehouse: WarehouseIcon,
};
