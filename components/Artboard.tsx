"use client";

import { useEffect, useRef, useState } from "react";
import { Node } from "@/types";
import { useForceGraph, BoardView } from "@/hooks/useForceGraph";
import LogoNode from "./LogoNode";

interface ArtboardProps {
  nodes: Node[];
  view?: BoardView;
  /** Route prefix for per-company pages (e.g. the preview board links to /preview/company). */
  companyBaseHref?: string;
}

/**
 * Artboard component - the main canvas for displaying company logos
 *
 * Manages the D3 force simulation and renders all logo nodes.
 * Nodes are sized proportionally to employee count (bubble grid).
 * Supports zoom (mouse wheel / pinch) and pan (drag / touch drag).
 */
export default function Artboard({
  nodes,
  view = "bubble",
  companyBaseHref,
}: ArtboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const MIN_ZOOM = 0.3;
  const MAX_ZOOM = 2.5;

  // Smartphones start at 50% zoom, desktops at 100%
  // (< 640px matches Tailwind's "sm:" breakpoint)
  const getDefaultZoom = () =>
    typeof window !== "undefined" && window.innerWidth < 640 ? 0.5 : 1;

  const [zoom, setZoom] = useState(getDefaultZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Refs for touch gesture tracking
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const isTouchDragging = useRef(false);

  // Track container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        setDimensions({ width, height });
      }
    };

    updateDimensions();

    window.addEventListener("resize", updateDimensions);
    const timeoutId = setTimeout(updateDimensions, 100);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timeoutId);
    };
  }, []);

  // Get simulated node positions from force graph hook
  const simulatedNodes = useForceGraph({
    nodes,
    view,
    width:
      dimensions.width ||
      (typeof window !== "undefined" ? window.innerWidth : 1920),
    height:
      dimensions.height ||
      (typeof window !== "undefined" ? window.innerHeight : 1080),
  });

  // Handle zoom with mouse wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prevZoom) => {
        const newZoom = prevZoom * delta;
        return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, []);

  // Handle pan/drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // ── Touch handlers for mobile pan & pinch-to-zoom ──
  const getTouchDistance = (touches: TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  // Keep latest pan/dragStart in refs so native listeners always see fresh values
  const panRef = useRef(pan);
  const dragStartRef = useRef(dragStart);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);
  useEffect(() => {
    dragStartRef.current = dragStart;
  }, [dragStart]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isTouchDragging.current = true;
        lastTouchCenter.current = null;
        lastTouchDistance.current = null;
        const newDragStart = {
          x: e.touches[0].clientX - panRef.current.x,
          y: e.touches[0].clientY - panRef.current.y,
        };
        dragStartRef.current = newDragStart;
        setDragStart(newDragStart);
        setIsDragging(true);
      } else if (e.touches.length === 2) {
        isTouchDragging.current = false;
        setIsDragging(false);
        lastTouchDistance.current = getTouchDistance(e.touches);
        lastTouchCenter.current = getTouchCenter(e.touches);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isTouchDragging.current) {
        setPan({
          x: e.touches[0].clientX - dragStartRef.current.x,
          y: e.touches[0].clientY - dragStartRef.current.y,
        });
      } else if (e.touches.length === 2 && lastTouchDistance.current !== null) {
        const newDist = getTouchDistance(e.touches);

        if (newDist > 1 && lastTouchDistance.current > 1) {
          const scale = newDist / lastTouchDistance.current;

          if (isFinite(scale) && scale > 0.5 && scale < 2) {
            setZoom((prev) =>
              Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * scale)),
            );
          }

          if (lastTouchCenter.current) {
            const newCenter = getTouchCenter(e.touches);
            const dx = newCenter.x - lastTouchCenter.current.x;
            const dy = newCenter.y - lastTouchCenter.current.y;
            if (isFinite(dx) && isFinite(dy)) {
              setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
            }
            lastTouchCenter.current = newCenter;
          }
        }

        lastTouchDistance.current = newDist;
      }
    };

    const onTouchEnd = () => {
      isTouchDragging.current = false;
      lastTouchDistance.current = null;
      lastTouchCenter.current = null;
      setIsDragging(false);
    };

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", onTouchEnd);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    setZoom(getDefaultZoom());
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="artboard-container relative w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {simulatedNodes.map((node) => (
          <LogoNode key={node.id} node={node} baseHref={companyBaseHref} />
        ))}
      </div>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-4">
            <h2 className="mb-2 text-xl font-semibold text-slate-300 sm:mb-4 sm:text-3xl">
              No submissions yet
            </h2>
            <p className="text-sm text-slate-500 sm:text-base">
              Be the first to submit your company!
            </p>
          </div>
        </div>
      )}

      {/* Zoom indicator and recenter button */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 sm:gap-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4rem)" }}
      >
        <div className="rounded-full border border-slate-700/70 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-100 shadow-lg shadow-slate-950/30 sm:px-4 sm:py-2 sm:text-sm pointer-events-none">
          {(zoom * 100).toFixed(0)}%
        </div>
        <button
          onClick={handleReset}
          className="primary-btn rounded-full px-2.5 py-1 text-xs shadow-lg shadow-cyan-500/20 sm:px-4 sm:py-2 sm:text-sm"
        >
          Recenter
        </button>
      </div>
    </div>
  );
}
