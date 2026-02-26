"use client";

import { useState } from "react";

export interface PyramidCarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  percent: number;
  description: string;
  icon: React.ReactNode;
}

interface PyramidCarouselProps {
  items: PyramidCarouselItem[];
  defaultActiveIndex?: number;
  themeColor?: string;
}

export function PyramidCarousel({
  items,
  defaultActiveIndex = 1,
  themeColor = "#004492",
}: PyramidCarouselProps) {
  const [activeIndex, setActiveIndex] = useState<number>(defaultActiveIndex);

  const darkThemeColor = "#003366";
  const almostBlackColor = "#001122";
  const blackColor = "#000000";

  const VERTICAL_CARDS_BORDER_RADIUS = {
    active: 18,
    inactive: 12,
  };

  const activeCardHeight = 88;
  const inactiveCardHeight = 55;
  const overlapPercentage = 0.3;
  const visiblePart = Math.round(inactiveCardHeight * (1 - overlapPercentage));
  const overlapAmount = inactiveCardHeight - visiblePart;

  return (
    <div className="relative flex items-center justify-center py-2">
      <div
        className="relative w-full"
        style={{ height: `${items.length * 75}px` }}
      >
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          const currentActive = activeIndex;

          let topOffset = 0;
          const containerHeight = items.length * 75;
          let centerY = (containerHeight - activeCardHeight) / 2;

          if (currentActive === 0) {
            centerY = (containerHeight - activeCardHeight) / 2 - 20;
          }

          if (isActive) {
            topOffset = centerY;
          } else if (index < currentActive) {
            const cardsAbove = currentActive - index;
            topOffset = centerY - visiblePart * cardsAbove;
          } else {
            const cardsBelow = index - currentActive;
            if (currentActive === 0) {
              if (cardsBelow === 1) {
                const visiblePart1to2 = Math.round(
                  inactiveCardHeight * (1 - overlapPercentage),
                );
                const overlapAmount1to2 = inactiveCardHeight - visiblePart1to2;
                topOffset = centerY + activeCardHeight - overlapAmount1to2;
              } else if (cardsBelow === 2) {
                const visiblePart1to2 = Math.round(
                  inactiveCardHeight * (1 - overlapPercentage),
                );
                const overlapAmount1to2 = inactiveCardHeight - visiblePart1to2;
                const secondTop =
                  centerY + activeCardHeight - overlapAmount1to2;
                const visiblePart2to3 = Math.round(
                  inactiveCardHeight * (1 - overlapPercentage),
                );
                const overlapAmount2to3 = inactiveCardHeight - visiblePart2to3;
                topOffset = secondTop + inactiveCardHeight - overlapAmount2to3;
              }
            } else {
              topOffset =
                centerY + activeCardHeight - overlapAmount * cardsBelow;
            }
          }

          let zIndex = 10;
          if (isActive) {
            zIndex = 30;
          } else {
            if (currentActive === 0) {
              zIndex = 20 - index;
            } else if (currentActive === 1) {
              zIndex = index === 0 || index === 2 ? 15 : 30;
            } else if (currentActive === 2) {
              zIndex = 20 + index;
            }
          }

          const borderRadiusActive = VERTICAL_CARDS_BORDER_RADIUS.active;
          const borderRadiusInactive = VERTICAL_CARDS_BORDER_RADIUS.inactive;

          return (
            <div
              key={item.id}
              onClick={() => setActiveIndex(index)}
              className={`absolute left-0 right-0 flex cursor-pointer items-start gap-2.5 rounded-xl transition-all duration-300 ease-in-out ${
                isActive ? "shadow-lg" : ""
              }`}
              style={{
                ...(isActive
                  ? {
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                    }
                  : {
                      backgroundColor: "#F3F4F6",
                      border: "1px solid #E5E7EB",
                    }),
                top: `${topOffset}px`,
                height: isActive
                  ? `${activeCardHeight}px`
                  : `${inactiveCardHeight}px`,
                width: "100%",
                paddingLeft: isActive ? "11px" : "8px",
                paddingRight: isActive ? "11px" : "8px",
                paddingTop: isActive ? "11px" : "5px",
                paddingBottom: isActive ? "11px" : "5px",
                zIndex: zIndex,
                borderRadius: isActive
                  ? `${borderRadiusActive}px`
                  : `${borderRadiusInactive}px`,
                transition: "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
            >
              {/* Icon */}
              <div
                className="flex shrink-0 items-start justify-center"
                style={{
                  width: isActive ? "36px" : "28px",
                  height: isActive ? "36px" : "28px",
                  color: isActive ? "#004492" : "#6B7280",
                  paddingTop: isActive ? "1px" : "0px",
                }}
              >
                <div
                  style={{ transform: isActive ? "scale(0.8)" : "scale(0.7)" }}
                >
                  {item.icon}
                </div>
              </div>

              {/* Content */}
              <div
                className="flex-1 overflow-hidden"
                style={{
                  opacity: isActive ? 1 : 1,
                  transition: isActive
                    ? "opacity 0.25s ease-out 0.7s"
                    : "opacity 0.1s ease-in",
                }}
              >
                {isActive ? (
                  <>
                    {/* Title and Percent in same line */}
                    <div className="mb-1 flex items-baseline gap-1.5">
                      <h3 className="text-[11px] font-semibold leading-tight text-gray-900">
                        {item.title}
                      </h3>
                      <span className="text-xs font-bold text-gray-900">
                        {item.percent}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="mb-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: "#10B981",
                        }}
                      />
                    </div>
                    <p className="text-[9px] leading-snug text-gray-700">
                      {item.description}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium leading-tight text-gray-700">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="mt-0.5 text-[10px] text-gray-500">
                        {item.subtitle} {item.percent}%
                      </p>
                    )}
                    {!item.subtitle && (
                      <p className="mt-0.5 text-[10px] text-gray-500">
                        {item.percent}%
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
