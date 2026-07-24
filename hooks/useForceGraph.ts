import { useEffect, useState } from "react";
import { Node } from "@/types";

interface UseForceGraphProps {
  nodes: Node[];
  width: number;
  height: number;
  nodeSize?: number;
}

/**
 * Generate spiral grid coordinates from center outward (heap-like pattern)
 * Order: center(0,0), right(0,1), up(-1,1), left(-1,0), left(-1,-1),
 *        down(0,-1), down(1,-1), right(1,0), right(1,1) -> 9 nodes in 3x3
 * Then continues to next frame outward
 */
function generateSpiralGrid(
  count: number,
): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];
  if (count <= 0) return positions;

  let x = 0;
  let y = 0;
  positions.push({ row: y, col: x });

  if (count === 1) return positions;

  const directions = [
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
  ];

  let steps = 1;
  let dirIndex = 0;

  while (positions.length < count) {
    for (let repeat = 0; repeat < 2 && positions.length < count; repeat++) {
      const { dx, dy } = directions[dirIndex % 4];
      for (let step = 0; step < steps && positions.length < count; step++) {
        x += dx;
        y += dy;
        positions.push({ row: y, col: x });
      }
      dirIndex += 1;
    }
    steps += 1;
  }

  return positions;
}

/**
 * Custom hook that organizes nodes in a fixed grid layout
 * Nodes are sorted by employee count (largest first)
 * Layout is responsive and centers nodes on the screen
 */
export function useForceGraph({
  nodes,
  width,
  height,
  nodeSize: externalNodeSize,
}: UseForceGraphProps) {
  const [positionedNodes, setPositionedNodes] = useState<Node[]>([]);

  useEffect(() => {
    if (!nodes.length || !width || !height) {
      setPositionedNodes([]);
      return;
    }

    // Sort nodes by count (largest first)
    const sortedNodes = [...nodes].sort((a, b) => b.count - a.count);

    const centerX = width / 2;
    const centerY = height / 2;

    // Responsive node size
    const nodeSize = externalNodeSize ?? 120;
    const spacing = Math.round(nodeSize * 0.08);

    // Spiral grid pattern from center outward
    // Position 0 is center, then spiral outward in a square pattern
    const spiralPositions = generateSpiralGrid(sortedNodes.length);

    const positioned = sortedNodes.map((node, index) => {
      const spiralPos = spiralPositions[index];

      // Convert grid coordinates to screen coordinates
      const x = centerX + spiralPos.col * (nodeSize + spacing);
      const y = centerY + spiralPos.row * (nodeSize + spacing);

      return {
        ...node,
        x,
        y,
      };
    });

    setPositionedNodes(positioned);
  }, [nodes, width, height]);
  return positionedNodes;
}
