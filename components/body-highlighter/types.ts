import type * as React from "react";

// Body part slug identifiers
export type BodyPartSlug =
  | "head"
  | "hair"
  | "neck"
  | "trapezius"
  | "deltoids"
  | "chest"
  | "biceps"
  | "triceps"
  | "forearm"
  | "hands"
  | "abs"
  | "obliques"
  | "upper-back"
  | "lower-back"
  | "adductors"
  | "quadriceps"
  | "hamstring"
  | "gluteal"
  | "knees"
  | "tibialis"
  | "calves"
  | "ankles"
  | "feet";

// Side of the body (for bilateral parts)
export type BodySide = "left" | "right" | "both" | "common";

// View direction
export type BodyView = "front" | "back";

// Gender for body model
export type BodyGender = "male" | "female";

// Raw SVG path data for a body part
export interface BodyPartPath {
  left?: string[];
  right?: string[];
  common?: string[];
}

// Body part definition from SVG assets
export interface BodyPartDefinition {
  slug: BodyPartSlug;
  color: string;
  path: BodyPartPath;
}

// Severity levels matching existing system
export type Severity = "minor" | "moderate" | "severe" | "catastrophic";

// Data for highlighting a body part
export interface BodyPartHighlight {
  slug: BodyPartSlug;
  side?: BodySide;
  intensity?: 1 | 2 | 3 | 4; // Maps to severity colors
  fill?: string; // Direct color override
  label?: string; // Tooltip label
  data?: unknown; // Custom data (injury details)
}

// Props for BodyHighlighter component
export interface BodyHighlighterProps {
  // View
  view: BodyView;

  // Gender for body model
  gender?: BodyGender;

  // Highlighted body parts
  data: BodyPartHighlight[];

  // Styling
  scale?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
  preserveAspectRatio?: string;
  defaultFill?: string;
  defaultStroke?: string;
  strokeWidth?: number;
  hitAreaStrokeWidth?: number;

  // Interaction
  onBodyPartHover?: (part: BodyPartHighlight | null) => void;
  onBodyPartClick?: (part: BodyPartHighlight) => void;
  disabledSlugs?: BodyPartSlug[];

  // Accessibility
  showTooltips?: boolean;
  interactive?: boolean;
}

// Props for individual BodyPart component
export interface BodyPartProps {
  slug: BodyPartSlug;
  paths: string[];
  side: "left" | "right" | "common";
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  hitAreaStrokeWidth?: number;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onKeyDown?: React.KeyboardEventHandler<SVGGElement>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  tooltip?: string;
  showTooltip?: boolean;
}
