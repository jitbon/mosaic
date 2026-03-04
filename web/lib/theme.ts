// Mosaic theme — mirrors mobile/constants/theme.ts

export const Brand = {
  blue: "#5B9BD5",
  red: "#C0605A",
  mauve: "#A0659A",
  teal: "#3A9E82",
} as const;

export const Spectrum = {
  left: Brand.blue,
  leftActive: "#4A87BE",
  center: Brand.mauve,
  centerActive: "#8D5287",
  right: Brand.red,
  rightActive: "#A84E49",
  centerLeft: "#7B82C2",
  centerRight: "#B3606B",
} as const;

export const Primary = {
  default: Brand.blue,
  active: "#4A87BE",
  light: "#D6E8F5",
} as const;

export const Action = {
  success: Brand.teal,
  successPressed: "#318A70",
  neutral: "#8C939E",
  neutralPressed: "#757C87",
} as const;

export const Feedback = {
  warningBg: "#FEF3C7",
  warningText: "#92400E",
  errorBg: "#FDE8E8",
  errorText: "#B04040",
  errorFg: "#C0605A",
} as const;

export const Neutral = {
  appBg: "#F2EDE8",
  surfaceBg: "#F8F5F1",
  cardBg: "#FFFFFF",
  inputBg: "#F5F2EE",
  border: "#E4DDD6",
  borderLight: "#EDE8E3",
  textPrimary: "#1A1612",
  textSecondary: "#4A4440",
  textMuted: "#7A736C",
  textFaint: "#A09890",
  textDisabled: "#BDB5AE",
  skeletonBase: "#E4DDD6",
  skeletonShine: "#EDE8E3",
} as const;

export const Colors = {
  primary: Primary.default,
  primaryActive: Primary.active,
  primaryLight: Primary.light,
  left: Spectrum.left,
  leftActive: Spectrum.leftActive,
  center: Spectrum.center,
  centerActive: Spectrum.centerActive,
  right: Spectrum.right,
  rightActive: Spectrum.rightActive,
  success: Action.success,
  successPressed: Action.successPressed,
  neutral: Action.neutral,
  warningBg: Feedback.warningBg,
  warningText: Feedback.warningText,
  errorBg: Feedback.errorBg,
  errorText: Feedback.errorText,
  errorFg: Feedback.errorFg,
  ...Neutral,
} as const;

export function perspectiveColor(perspective: string): string {
  const map: Record<string, string> = {
    left: Spectrum.left,
    "center-left": Spectrum.centerLeft,
    center: Spectrum.center,
    "center-right": Spectrum.centerRight,
    right: Spectrum.right,
  };
  return map[perspective] ?? Action.neutral;
}

export function perspectiveActiveColor(perspective: string): string {
  const map: Record<string, string> = {
    left: Spectrum.leftActive,
    center: Spectrum.centerActive,
    right: Spectrum.rightActive,
  };
  return map[perspective] ?? Action.neutralPressed;
}

export const DebateRoleColors: Record<string, string> = {
  persona_left: Spectrum.left,
  persona_center: Spectrum.center,
  persona_right: Spectrum.right,
  moderator: Action.neutral,
};
