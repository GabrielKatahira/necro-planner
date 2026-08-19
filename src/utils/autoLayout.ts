import dagre from "dagre";
import type { Node, Edge } from "reactflow";
import type { DialogueGraph } from "../types/dialogue";

export function getAutoLayoutedElements(graph:DialogueGraph) {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({rankdir:"LR", nodesep: 50, ranksep: 100})

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    Object.values(graph.boxes).forEach((box) => {
        const nodeWidth = 260;
        const nodeHeight = 180;

        dagreGraph.setNode(box.id, {width: nodeWidth, height: nodeHeight});

        nodes.push({
            id:box.id,
            type:box.kind + "Box",
            position: {x:0,y:0},
            data: {box},
        })


    });

    Object.values(graph.boxes).forEach((box) => {
        if (box.kind === "dialogue") {
        box.choices.forEach((choice) => {
            if (choice.next && graph.boxes[choice.next]) {
                const handleId = `${box.id}-${choice.id}`;
                dagreGraph.setEdge(box.id, choice.next);
                edges.push({ id: `${box.id}-${choice.id}`, 
                             source: box.id, 
                             sourceHandle: handleId,
                             target: choice.next,
                             targetHandle: `${choice.next}-default`
                            });
            }
        });
        if (box.defaultNext && graph.boxes[box.defaultNext]) {
            dagreGraph.setEdge(box.id, box.defaultNext);
            edges.push({ id: `${box.id}-default`, 
                         source: box.id, 
                         sourceHandle: `${box.id}-default`,
                         target: box.defaultNext,
                         targetHandle: `${box.defaultNext}-default`
                        });
        }
        }

        if (box.kind === "condition") {
        box.evaluations.forEach((evalItem) => {
            if (evalItem.next && graph.boxes[evalItem.next]) {
            dagreGraph.setEdge(box.id, evalItem.next);
            edges.push({ id: `${box.id}-${evalItem.id}`, 
                         source: box.id, 
                         sourceHandle: `${box.id}-${evalItem.id}`,
                         target: evalItem.next ,
                         targetHandle: `${evalItem.next}-default`
                        });
            }
        });
        if (box.fallback && graph.boxes[box.fallback]) {
            dagreGraph.setEdge(box.id, box.fallback);
            edges.push({ id: `${box.id}-fallback`, 
                         source: box.id, 
                         sourceHandle:`${box.id}-fallback`,
                         target: box.fallback ,
                         targetHandle:`${box.fallback}-default` 
                        });
        }
        }
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - 130,
                y: nodeWithPosition.y - 90,
            }
        }
    })

    return { nodes: layoutedNodes, edges };

}