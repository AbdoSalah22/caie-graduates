"use client";

import { useEffect, useRef, useState } from "react";
import { Node } from "@/types";
import { useForceGraph } from "@/hooks/useForceGraph";
import LogoNode from "./LogoNode";

interface ArtboardProps {
  nodes: Node[];
}

/**
 * Artboard component - the main canvas for displaying company logos
 *
 * Manages the force simulation and renders all logo nodes
 * Automatically adjusts to full screen dimensions
 * Provides a dark, clean aesthetic background
 * Supports zoom (mouse wheel) and pan (drag)
 */
export default function Artboard({ nodes }: ArtboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const MIN_ZOOM = 0.3;
  const MAX_ZOOM = 2.5;

  // Track container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        setDimensions({ width, height });
      }
    };

    // Initial dimensions
    updateDimensions();

    // Add resize listener
    window.addEventListener("resize", updateDimensions);

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateDimensions, 100);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timeoutId);
    };
  }, []);

  // Get simulated node positions from force graph hook
  const simulatedNodes = useForceGraph({
    nodes,
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

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
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
          <LogoNode key={node.id} node={node} />
        ))}
      </div>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-400 mb-4">
              No submissions yet
            </h2>
            <p className="text-gray-500">
              Be the first to submit your company!
            </p>
          </div>
        </div>
      )}

      {/* Zoom indicator and reset button */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
        <div className="bg-gray-800/80 text-white px-4 py-2 rounded-full text-sm pointer-events-none">
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>
        <button
          onClick={handleReset}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm transition-all pointer-events-auto shadow-lg hover:scale-105"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}
