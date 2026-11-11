import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const IconGraduation = (p: P) => (<svg {...base} {...p}><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 2.5 9 2.5 12 0v-5" /></svg>);
export const IconHeartPulse = (p: P) => (<svg {...base} {...p}><path d="M19.5 12.6 12 20l-7.5-7.4a4.9 4.9 0 0 1 7-6.9l.5.5.5-.5a4.9 4.9 0 0 1 7 6.9Z" /><path d="M3.5 12h4l2-3 3 6 2-3h6" /></svg>);
export const IconAlert = (p: P) => (<svg {...base} {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>);
export const IconUsers = (p: P) => (<svg {...base} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></svg>);
export const IconShield = (p: P) => (<svg {...base} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>);
export const IconLock = (p: P) => (<svg {...base} {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>);
export const IconFile = (p: P) => (<svg {...base} {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>);
export const IconChart = (p: P) => (<svg {...base} {...p}><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></svg>);
export const IconCard = (p: P) => (<svg {...base} {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></svg>);
export const IconPointer = (p: P) => (<svg {...base} {...p}><path d="m9 9 11 4-5 2-2 5-4-11Z" /><path d="M5 5 3 3M9 4V2M4 9H2" /></svg>);
export const IconArrow = (p: P) => (<svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IconCheck = (p: P) => (<svg {...base} {...p}><path d="m5 13 4 4L19 7" /></svg>);
export const IconMenu = (p: P) => (<svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const IconClose = (p: P) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconChevron = (p: P) => (<svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>);
export const IconHand = (p: P) => (<svg {...base} {...p}><path d="M11 14h2a2 2 0 0 0 0-4H9.5a3 3 0 0 0-2.1.9L3 15.5M7 19l-4-4M21 8.5 16 14M11 20.5l3.2 1 6.3-6a2 2 0 0 0-2.8-2.8L15 15" /><path d="M14.5 6.2a2.7 2.7 0 0 1 4.7-1.8c1 1 .9 2.5-.1 3.5L16 11" /></svg>);

export const CATEGORY_META = {
  PENDIDIKAN: { label: "Pendidikan", Icon: IconGraduation },
  KESEHATAN: { label: "Kesehatan", Icon: IconHeartPulse },
  BENCANA: { label: "Bencana", Icon: IconAlert },
  SOSIAL: { label: "Sosial", Icon: IconUsers },
  LAINNYA: { label: "Lainnya", Icon: IconHand },
} as const;
