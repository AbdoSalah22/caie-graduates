import { useEffect, useRef, useState } from "react";
import {
  forceSimulation,
  forceCenter,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type Simulation,
} from "d3-force";
import { Node } from "@/types";
import { BUBBLE_PADDING } from "@/lib/constants";

interface UseForceGraphProps {
  nodes: Node[];
  width: number;
  height: number;
}

/**
 * Custom hook that creates a D3 force simulation to position nodes.
 *
 * Each node's `radius` drives collision detection and spacing, producing
 * the "bubble grid" effect where larger companies get bigger bubbles.
 *
 * Forces applied:
 * - Center gravity: pulls nodes toward the viewport center
 * - Collision: prevents overlaps, respects per-node radius + padding
 * - Many-body: gentle repulsion to spread nodes out
 * - X/Y positioning: weak pull toward center to keep layout compact
 */
export function useForceGraph({ nodes, width, height }: UseForceGraphProps) {
  const [positionedNodes, setPositionedNodes] = useState<Node[]>([]);
  const simulationRef = useRef<Simulation<Node, undefined> | null>(null);

  useEffect(() => {
    if (!nodes.length || !width || !height) {
      setPositionedNodes([]);
      return;
    }

    // Stop any existing simulation before creating a new one
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const centerX = width / 2;
    const centerY = height / 2;

    // Clone nodes so D3 can mutate x/y/vx/vy on them
    const simNodes: Node[] = nodes.map((n) => ({
      ...n,
      x: n.x ?? centerX + (Math.random() - 0.5) * width * 0.3,
      y: n.y ?? centerY + (Math.random() - 0.5) * height * 0.3,
    }));

    const simulation = forceSimulation<Node>(simNodes)
      // Pull toward center
      .force("center", forceCenter<Node>(centerX, centerY).strength(0.05))
      // Weak X/Y attraction to keep cluster compact
      .force("x", forceX<Node>(centerX).strength(0.04))
      .force("y", forceY<Node>(centerY).strength(0.04))
      // Repulsion between nodes
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
          .iterations(3),
      )
      .alphaDecay(0.02)
      .velocityDecay(0.35);

    // Update React state on each tick
    simulation.on("tick", () => {
      setPositionedNodes(
        simNodes.map((n) => ({
          ...n,
          x: n.x,
          y: n.y,
        })),
      );
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [nodes, width, height]);

  return positionedNodes;
}
