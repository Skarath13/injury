import type { Severity } from "./types";

// Severity colors - rich, saturated colors for injury highlights
export const SEVERITY_COLORS: Record<Severity, string> = {
  minor: "#FACC15", // yellow-400 - richer yellow
  moderate: "#F97316", // orange-500 - vibrant orange
  severe: "#DC2626", // red-600 - rich red
  catastrophic: "#7F1D1D", // red-900 - deep dark red
};

// Intensity to severity mapping
export const INTENSITY_COLORS: Record<1 | 2 | 3 | 4, string> = {
  1: SEVERITY_COLORS.minor,
  2: SEVERITY_COLORS.moderate,
  3: SEVERITY_COLORS.severe,
  4: SEVERITY_COLORS.catastrophic,
};

// Default colors for unhighlighted body parts
export const DEFAULT_FILL = "#D1D5DB"; // gray-300 - light gray for inactive parts
export const UNKNOWN_HIGHLIGHT_FILL = "#64748B"; // slate-500 - neutral severity state
export const HAIR_FILL = "#5D4037"; // dark brown - works in light and dark mode
export const DEFAULT_STROKE = "#FFFFFF"; // white outline for highlighted parts
export const DEFAULT_STROKE_WIDTH = 0.5;

// Hover/selection styles
export const HOVER_OPACITY = 0.8;
export const SELECTED_STROKE = "#3B82F6"; // blue-500
export const SELECTED_STROKE_WIDTH = 2;

// SVG viewBox dimensions (from react-native-body-highlighter)
// Both use same width (724) for consistent sizing
export const VIEWBOX = {
  front: "0 0 724 1448",
  back: "724 0 724 1448",
};

// Body part labels for tooltips (human readable)
export const BODY_PART_LABELS: Record<string, string> = {
  head: "Head",
  hair: "Hair / scalp",
  neck: "Base of neck / collarbone",
  trapezius: "Shoulders / upper neck",
  deltoids: "Shoulder",
  chest: "Chest / ribs",
  biceps: "Upper arm",
  triceps: "Upper arm",
  forearm: "Forearm",
  hands: "Hand / wrist",
  abs: "Stomach / abdomen",
  obliques: "Side / ribs",
  "upper-back": "Upper Back",
  "lower-back": "Lower Back",
  adductors: "Inner Thigh",
  quadriceps: "Thigh",
  hamstring: "Back of thigh",
  gluteal: "Hip / buttock",
  knees: "Knee",
  tibialis: "Shin",
  calves: "Calf",
  ankles: "Ankle",
  feet: "Foot",
};
