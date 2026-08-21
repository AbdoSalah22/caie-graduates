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

interface UseForceGraphProps {
  nodes: Node[];
  width: number;
  height: number;
}

/**
 * Custom hook that computes a deterministic, size-centered bubble layout.
 *
 * Companies with more graduates end up near the center of the board:
 * - Nodes are sorted by count (largest first) and seeded on a golden-angle
 *   spiral around the center, so the biggest bubbles start closest to it.
 * - A radial pull (via forceX/forceY) scales with each node's radius, so
 *   larger companies are attracted to the center more strongly.
 * - The simulation is run synchronously to completion, producing the same
 *   fixed layout on every load (no randomness, no animated jitter).
 */
export function useForceGraph({ nodes, width, height }: UseForceGraphProps) {
  const [positionedNodes, setPositionedNodes] = useState<Node[]>([]);

  useEffect(() => {
    if (!nodes.length || !width || !height) {
      setPositionedNodes([]);
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
  }, [nodes, width, height]);

  return positionedNodes;
}
