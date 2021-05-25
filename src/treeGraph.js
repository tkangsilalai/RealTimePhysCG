const { Vector3 } = require('three');

class Node {
    constructor(position) {
        this.position = position;
    }
}

class Edge {
    constructor(n_source, n_target) {
        this.n_source = n_source;
        this.n_target = n_target;
    }
}

export default class TreeGraph {
    constructor() {

        this.node_count = 10;
        this.edge_count = 5;
        this.nodes = [
            new Node(new Vector3()),
            new Node(new Vector3(0, 5, 0)),
            new Node(new Vector3(0, 1, 0)),
            new Node(new Vector3(1, 2, 0)),
            new Node(new Vector3(0, 2, 0)),
            new Node(new Vector3(-1, 3, -1)),
            new Node(new Vector3(0, 3, 0)),
            new Node(new Vector3(1.5, 4, 1)),
            new Node(new Vector3(0, 4, 0)),
            new Node(new Vector3(-0.5, 5, -1)),
        ];
        this.edges = [
            new Edge(this.nodes[0], this.nodes[1]),
            new Edge(this.nodes[2], this.nodes[3]),
            new Edge(this.nodes[4], this.nodes[5]),
            new Edge(this.nodes[6], this.nodes[7]),
            new Edge(this.nodes[8], this.nodes[9])
        ];

        this.root_node = this.nodes[0];
    }
}
