"use client";

import { type KeyboardEvent, useMemo, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { bodyFront, bodyBack, bodyFemaleFront, bodyFemaleBack } from "../assets";
import { BodyPart } from "./BodyPart";
import {
  VIEWBOX,
  DEFAULT_FILL,
  DEFAULT_STROKE,
  DEFAULT_STROKE_WIDTH,
  INTENSITY_COLORS,
  BODY_PART_LABELS,
} from "../constants";
import type { BodyHighlighterProps, BodyPartHighlight, BodySide } from "../types";

const INTERACTION_RENDER_PRIORITY: Record<string, number> = {
  chest: 1,
  abs: 1,
  obliques: 1,
  "upper-back": 1,
  "lower-back": 1,
  head: 2,
  hair: 12,
  biceps: 3,
  triceps: 3,
  forearm: 5,
  calves: 7,
  tibialis: 8,
  deltoids: 5,
  trapezius: 9,
  gluteal: 6,
  adductors: 8,
  quadriceps: 6,
  hamstring: 6,
  knees: 7,
  ankles: 10,
  hands: 10,
  feet: 10,
  neck: 11,
};

const MODEL_CENTERING_TRANSFORM: Record<string, string | undefined> = {
  "male-front": undefined,
  "male-back": undefined,
  "female-front": "translate(44 0)",
  "female-back": "translate(-56 0)",
};

const MODEL_VIEWBOX: Record<string, string | undefined> = {
  "male-front": undefined,
  "male-back": undefined,
  "female-front": "0 -80 724 1600",
  "female-back": "724 -80 724 1600",
};

export function BodyHighlighter({
  view,
  gender = "male",
  data,
  scale = 1,
  width = "100%",
  height = "100%",
  className,
  preserveAspectRatio = "xMidYMin meet",
  defaultFill = DEFAULT_FILL,
  defaultStroke = DEFAULT_STROKE,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  hitAreaStrokeWidth = 4,
  onBodyPartHover,
  onBodyPartClick,
  disabledSlugs = [],
  showTooltips = true,
  interactive = false,
}: BodyHighlighterProps) {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [hoveredSide, setHoveredSide] = useState<BodySide | null>(null);

  // Get the appropriate body data based on view and gender
  const bodyData = useMemo(() => {
    if (gender === "female") {
      return view === "front" ? bodyFemaleFront : bodyFemaleBack;
    }
    return view === "front" ? bodyFront : bodyBack;
  }, [view, gender]);

  const renderedBodyData = useMemo(() => {
    if (!interactive) return bodyData;

    return [...bodyData].sort((left, right) => (
      (INTERACTION_RENDER_PRIORITY[left.slug] || 0) -
      (INTERACTION_RENDER_PRIORITY[right.slug] || 0)
    ));
  }, [bodyData, interactive]);

  const disabledSlugSet = useMemo(() => new Set(disabledSlugs), [disabledSlugs]);
  const modelTransform = MODEL_CENTERING_TRANSFORM[`${gender}-${view}`];
  const modelViewBox = MODEL_VIEWBOX[`${gender}-${view}`] || VIEWBOX[view];

  // Create a lookup map for highlighted parts
  const highlightMap = useMemo(() => {
    const map = new Map<string, BodyPartHighlight>();
    data.forEach((highlight) => {
      // Key format: "slug" or "slug-left" or "slug-right"
      if (highlight.side && highlight.side !== "both") {
        map.set(`${highlight.slug}-${highlight.side}`, highlight);
      } else {
        // "both" or no side specified - apply to both sides
        map.set(`${highlight.slug}-left`, highlight);
        map.set(`${highlight.slug}-right`, highlight);
        map.set(`${highlight.slug}-common`, highlight);
      }
    });
    return map;
  }, [data]);

  // Get fill color for a body part
  const getFillColor = (slug: string, side: string): string => {
    const key = `${slug}-${side}`;
    const highlight = highlightMap.get(key);
    const baseFill = defaultFill;

    if (!highlight) return baseFill;

    // Priority: fill > intensity > baseFill
    if (highlight.fill) return highlight.fill;
    if (highlight.intensity) {
      return INTENSITY_COLORS[highlight.intensity] || baseFill;
    }

    return baseFill;
  };

  const getBodyPartLabel = (slug: string, side: string): string => {
    const baseLabel = BODY_PART_LABELS[slug] || slug;
    if (side !== "common" && (side === "left" || side === "right")) {
      return `${side.charAt(0).toUpperCase() + side.slice(1)} ${baseLabel.toLowerCase()}`;
    }
    return baseLabel;
  };

  // Get tooltip text for a body part
  const getTooltip = (slug: string, side: string): string => {
    const key = `${slug}-${side}`;
    const highlight = highlightMap.get(key);

    if (highlight?.label) return highlight.label;

    return getBodyPartLabel(slug, side);
  };

  // Check if a part is highlighted
  const isHighlighted = (slug: string, side: string): boolean => {
    return highlightMap.has(`${slug}-${side}`);
  };

  // Handle hover interactions (no click)
  const handleMouseEnter = (slug: string, side: string) => {
    setHoveredPart(slug);
    setHoveredSide(side as BodySide);
    if (onBodyPartHover) {
      const key = `${slug}-${side}`;
      const highlight = highlightMap.get(key);
      onBodyPartHover(highlight || null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPart(null);
    setHoveredSide(null);
    if (onBodyPartHover) {
      onBodyPartHover(null);
    }
  };

  const handleActivate = (slug: string, side: BodySide) => {
    if (!onBodyPartClick) return;
    const key = `${slug}-${side}`;
    const highlight = highlightMap.get(key);
    const sideLabel = getBodyPartLabel(slug, side);

    onBodyPartClick(
      highlight || {
        slug: slug as BodyPartHighlight["slug"],
        side,
        label: sideLabel,
      }
    );
  };

  const handleKeyDown = (slug: string, side: BodySide) => (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleActivate(slug, side);
  };

  // Check if a part is hovered
  const isHovered = (slug: string, side: string): boolean => {
    if (!hoveredPart) return false;
    if (hoveredPart !== slug) return false;
    if (!hoveredSide) return true;
    return hoveredSide === side;
  };

  return (
    <TooltipProvider delayDuration={100}>
      <svg
        viewBox={modelViewBox}
        width={width}
        height={height}
        preserveAspectRatio={preserveAspectRatio}
        style={{
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: preserveAspectRatio.includes("YMid") ? "center center" : "top center",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
        }}
        className={cn("body-map-svg block h-full w-full select-none touch-manipulation outline-none focus:outline-none", className)}
        aria-label={`${view} body view`}
      >
        <g transform={modelTransform}>
        {renderedBodyData.map((part) => {
          const { slug, path } = part;
          const partInteractive = interactive && !disabledSlugSet.has(slug);
          const partStroke = slug === "hair" ? defaultStroke : "none";
          const partStrokeWidth = slug === "hair" ? Math.max(strokeWidth, 1.4) : strokeWidth;

          // Render common paths
          const commonPaths = path.common || [];
          const leftPaths = path.left || [];
          const rightPaths = path.right || [];

          return (
            <g key={slug} data-body-part={slug}>
              {/* Common paths (center body parts) */}
              {commonPaths.length > 0 && (
                <BodyPart
                  slug={slug}
                  paths={commonPaths}
                  side="common"
                  fill={getFillColor(slug, "common")}
                  stroke={partStroke}
                  strokeWidth={partStrokeWidth}
                  hitAreaStrokeWidth={hitAreaStrokeWidth}
                  isHighlighted={isHighlighted(slug, "common")}
                  isHovered={isHovered(slug, "common")}
                  onClick={partInteractive ? () => handleActivate(slug, "common") : undefined}
                  onKeyDown={partInteractive ? handleKeyDown(slug, "common") : undefined}
                  onMouseEnter={() => handleMouseEnter(slug, "common")}
                  onMouseLeave={handleMouseLeave}
                  tooltip={getTooltip(slug, "common")}
                  showTooltip={showTooltips}
                />
              )}

              {/* Left side paths */}
              {leftPaths.length > 0 && (
                <BodyPart
                  slug={slug}
                  paths={leftPaths}
                  side="left"
                  fill={getFillColor(slug, "left")}
                  stroke={partStroke}
                  strokeWidth={partStrokeWidth}
                  hitAreaStrokeWidth={hitAreaStrokeWidth}
                  isHighlighted={isHighlighted(slug, "left")}
                  isHovered={isHovered(slug, "left")}
                  onClick={partInteractive ? () => handleActivate(slug, "left") : undefined}
                  onKeyDown={partInteractive ? handleKeyDown(slug, "left") : undefined}
                  onMouseEnter={() => handleMouseEnter(slug, "left")}
                  onMouseLeave={handleMouseLeave}
                  tooltip={getTooltip(slug, "left")}
                  showTooltip={showTooltips}
                />
              )}

              {/* Right side paths */}
              {rightPaths.length > 0 && (
                <BodyPart
                  slug={slug}
                  paths={rightPaths}
                  side="right"
                  fill={getFillColor(slug, "right")}
                  stroke={partStroke}
                  strokeWidth={partStrokeWidth}
                  hitAreaStrokeWidth={hitAreaStrokeWidth}
                  isHighlighted={isHighlighted(slug, "right")}
                  isHovered={isHovered(slug, "right")}
                  onClick={partInteractive ? () => handleActivate(slug, "right") : undefined}
                  onKeyDown={partInteractive ? handleKeyDown(slug, "right") : undefined}
                  onMouseEnter={() => handleMouseEnter(slug, "right")}
                  onMouseLeave={handleMouseLeave}
                  tooltip={getTooltip(slug, "right")}
                  showTooltip={showTooltips}
                />
              )}
            </g>
          );
        })}
        </g>
      </svg>
    </TooltipProvider>
  );
}
