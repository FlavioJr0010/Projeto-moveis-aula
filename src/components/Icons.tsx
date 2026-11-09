import type { ReactNode } from "react";
const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const I = (d: ReactNode) => function Icon(props: { size?: number }) {
  return <svg {...base} width={props.size ?? 22} height={props.size ?? 22}>{d}</svg>;
};
export const SearchIcon = I(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const CartIcon = I(<><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6" /><circle cx="9" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" /></>);
export const RulerIcon = I(<><rect x="2" y="8" width="20" height="8" rx="1.5" /><path d="M6 8v3M10 8v4M14 8v3M18 8v4" /></>);
export const SparkIcon = I(<><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" /></>);
export const HomeIcon = I(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>);
export const TagIcon = I(<><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.2" /></>);
export const LeafIcon = I(<><path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15" /><path d="M5 19c3-5 6-8 10-10" /></>);
export const ChatIcon = I(<><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></>);
export const TruckIcon = I(<><path d="M2 6h11v10H2zM13 9h4l4 3v4h-8" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>);
export const ShieldIcon = I(<><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></>);
export const WrenchIcon = I(<><path d="M14.5 6.5a4 4 0 0 0 4.9 4.9L21 13l-8 8-3.5-3.5 8-8z" /><path d="M10 14 4 20" /></>);
export const PixIcon = I(<><path d="M12 3 6 9l6 6 6-6zM12 15l-6 6M12 15l6 6" /></>);
