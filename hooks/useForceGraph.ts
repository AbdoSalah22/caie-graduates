import { useEffect, useState } from "react";
import {
  forceSimulation,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
} from "d3-force";
import { Node } from "@/types";
import { BUBBLE_PADDING } from "@/lib/constants";

export type BoardView = "bubble" | "grid";

interface UseForceGraphProps {
  nodes: Node[];
  width: number;
  height: number;
  view?: BoardView;
}

/**
 * Custom hook that computes node positions for the board.
 *
 * - "bubble" view: deterministic, size-centered bubble layout. Companies with
 *   more graduates end up near the center of the board (sorted largest-first
 *   onto a golden-angle spiral, radial pull scaled by radius).
 * - "grid" view: every company the same fixed size on a near-square grid,
 *   centered on screen and filled alphabetically starting from the top-left.
 */
export function useForceGraph({
  nodes,
  width,
  height,
  view = "bubble",
}: UseForceGraphProps) {
  const [positionedNodes, setPositionedNodes] = useState<Node[]>([]);

  useEffect(() => {
    if (!nodes.length || !width || !height) {
      setPositionedNodes([]);
      return;
    }

    if (view === "grid") {
      // Uniform squares, alphabetical order, filled from the top-left
      const sortedNodes = [...nodes].sort((a, b) =>
        a.id.localeCompare(b.id),
      );

      const centerX = width / 2;
      const centerY = height / 2;

      const nodeSize = 120;
      const spacing = Math.round(nodeSize * 0.08);
      const cell = nodeSize + spacing;

      // Near-square grid: as many columns as rows
      const cols = Math.ceil(Math.sqrt(sortedNodes.length));
      const rows = Math.ceil(sortedNodes.length / cols);

      const positioned = sortedNodes.map((node, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        // Center the whole matrix on the screen
        return {
          ...node,
          radius: nodeSize / 2,
          x: centerX + (col - (cols - 1) / 2) * cell,
          y: centerY + (row - (rows - 1) / 2) * cell,
        };
      });

      setPositionedNodes(positioned);
      return;
    }

    const centerX = width / 2;
    const centerY = height / 2;

    // Largest companies first, so they occupy the innermost spiral slots
    const sorted = [...nodes].sort((a, b) => b.count - a.count);

    // Golden-angle phyllotaxis spiral: deterministic, evenly spaced seeds
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const simNodes: Node[] = sorted.map((n, i) => {
      const r = 10 * Math.sqrt(i);
      return {
        ...n,
        x: centerX + r * Math.cos(i * goldenAngle),
        y: centerY + r * Math.sin(i * goldenAngle),
      };
    });

    const maxRadius = Math.max(...simNodes.map((n) => n.radius));

    const simulation = forceSimulation<Node>(simNodes).stop();

    // Radial pull toward center — stronger for bigger companies
    simulation
      .force(
        "x",
        forceX<Node>(centerX).strength(
          (d) => 0.05 + 0.35 * (d.radius / maxRadius),
        ),
      )
      .force(
        "y",
        forceY<Node>(centerY).strength(
          (d) => 0.05 + 0.35 * (d.radius / maxRadius),
        ),
      )
      // Gentle repulsion so equal-size companies spread into rings
      .force(
        "charge",
        forceManyBody<Node>()
          .strength((d) => -d.radius * 1.5)
          .distanceMax(400),
      )
      // Collision — each node's radius + padding
      .force(
        "collide",
        forceCollide<Node>()
          .radius((d) => d.radius + BUBBLE_PADDING)
          .strength(0.9)
          .iterations(4),
      );

    // Run synchronously until settled — same input, same output, every time
    let ticks = 0;
    while (ticks++ < 600 && simulation.alpha() > simulation.alphaMin()) {
      simulation.tick();
    }

    setPositionedNodes(simNodes.map((n) => ({ ...n })));

    return () => {};
  }, [nodes, width, height, view]);

  return positionedNodes;
}
