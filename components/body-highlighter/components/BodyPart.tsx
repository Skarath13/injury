"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BodyPartProps {
  slug: string;
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
  isHighlighted?: boolean;
  patternOverlay?: string;
}

export function BodyPart({
  slug,
  paths,
  side,
  fill,
  stroke = "none",
  strokeWidth = 0,
  hitAreaStrokeWidth = 4,
  isHovered = false,
  onClick,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  tooltip,
  showTooltip = true,
  isHighlighted = false,
  patternOverlay,
}: BodyPartProps) {
  const pathGroup = (
    <g
      data-slug={slug}
      data-side={side}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={tooltip || `${side === "common" ? "" : `${side} `}${slug}`}
      style={{ outline: "none", WebkitTapHighlightColor: "transparent" }}
      className={cn(
        onClick && "cursor-pointer touch-manipulation outline-none transition-opacity focus-visible:opacity-80",
        isHighlighted && !onClick && "cursor-default",
        isHighlighted && isHovered && "opacity-80"
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {paths.map((d, index) => (
        <path
          key={`${slug}-${side}-${index}`}
          d={d}
          fill={fill}
          stroke={isHighlighted ? "#111827" : stroke}
          strokeWidth={isHighlighted ? Math.max(strokeWidth, 3) : Math.max(strokeWidth, onClick ? 0.8 : 0)}
          vectorEffect="non-scaling-stroke"
          className="transition-[fill,stroke,stroke-width,opacity] duration-200 ease-out"
        />
      ))}
      {onClick &&
        paths.map((d, index) => (
          <path
            key={`${slug}-${side}-${index}-fill-hit-area`}
            d={d}
            fill="transparent"
            stroke="none"
            pointerEvents="fill"
            aria-hidden="true"
          />
        ))}
      {onClick &&
        paths.map((d, index) => (
          <path
            key={`${slug}-${side}-${index}-hit-area`}
            d={d}
            fill="none"
            stroke="transparent"
            strokeWidth={hitAreaStrokeWidth}
            vectorEffect="non-scaling-stroke"
            pointerEvents="stroke"
            aria-hidden="true"
          />
        ))}
      {/* Pattern overlay for texture (e.g., hair strands) */}
      {patternOverlay &&
        paths.map((d, index) => (
          <path
            key={`${slug}-${side}-${index}-overlay`}
            d={d}
            fill={patternOverlay}
            stroke="none"
            pointerEvents="none"
          />
        ))}
    </g>
  );

  // Show tooltip for highlighted or interactive body parts.
  if (showTooltip && tooltip && isHighlighted) {
    // Split tooltip into title (first line) and content (rest)
    const [title, ...contentLines] = tooltip.split("\n");
    const content = contentLines.join("\n");

    return (
      <Tooltip>
        <TooltipTrigger asChild>{pathGroup}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[min(18rem,calc(100vw-2rem))] text-left">
          <div className="text-sm leading-5">
            <div className="mb-1 font-semibold">{title}</div>
            {content && (
              <div className="whitespace-pre-line text-background/80">{content}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return pathGroup;
}
