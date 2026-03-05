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

  // Start at center (max heap position)
  positions.push({ row: 0, col: 0 });

  if (count === 1) return positions;

  // Spiral outward in square frames
  let layer = 1;

  while (positions.length < count) {
    // Each layer forms a square frame around the previous
    // Start at (0, layer) and go: right, up, left, left, down, down, right, right

    const startRow = 0;
    const startCol = layer;

    // Position 1: Right of center (0, layer)
    if (positions.length < count) {
      positions.push({ row: startRow, col: startCol });
    }

    // Position 2: Up (-1, layer)
    if (positions.length < count) {
      positions.push({ row: startRow - 1, col: startCol });
    }

    // Position 3: Left (-1, layer-1)
    if (positions.length < count) {
      positions.push({ row: startRow - 1, col: startCol - 1 });
    }

    // Position 4: Left (-1, -layer)
    if (positions.length < count) {
      positions.push({ row: startRow - 1, col: -startCol });
    }

    // Position 5: Down (0, -layer)
    if (positions.length < count) {
      positions.push({ row: startRow, col: -startCol });
    }

    // Position 6: Down (1, -layer)
    if (positions.length < count) {
      positions.push({ row: startRow + 1, col: -startCol });
    }

    // Position 7: Right (1, -layer+1)
    if (positions.length < count) {
      positions.push({ row: startRow + 1, col: -startCol + 1 });
    }

    // Position 8: Right (1, layer)
    if (positions.length < count) {
      positions.push({ row: startRow + 1, col: startCol });
    }

    // Continue filling the rest of the perimeter for larger layers
    if (layer > 1) {
      // Top edge (right direction): from (-layer, -layer) to (-layer, layer-1)
      for (let col = -layer; col < layer && positions.length < count; col++) {
        // Skip positions we already added in the inner 3x3
        if (layer === 1 || Math.abs(col) > 1 || col === -layer) {
          positions.push({ row: -layer, col });
        }
      }

      // Right edge (down direction): from (-layer+1, layer) to (layer-1, layer)
      for (
        let row = -layer + 1;
        row < layer && positions.length < count;
        row++
      ) {
        // Skip positions already added
        if (layer === 1 || Math.abs(row) > 1) {
          positions.push({ row, col: layer });
        }
      }

      // Bottom edge (left direction): from (layer, layer) to (layer, -layer+1)
      for (let col = layer; col > -layer && positions.length < count; col--) {
        // Skip positions already added
        if (layer === 1 || Math.abs(col) > 1) {
          positions.push({ row: layer, col });
        }
      }

      // Left edge (up direction): from (layer-1, -layer) to (-layer+1, -layer)
      for (
        let row = layer - 1;
        row > -layer && positions.length < count;
        row--
      ) {
        // Skip positions already added
        if (layer === 1 || Math.abs(row) > 1) {
          positions.push({ row, col: -layer });
        }
      }
    }

    layer++;
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
