import { Triangle, Vector3 } from "three";

export default class Tree {
    constructor(graph) {
        this.graph = graph;
        this.circular_subdiv = 6;
        this.radius = 0.12;
        this.positions = new Array(2 * this.circular_subdiv * graph.edge_count)
        this.triangles = new Array(2 * this.circular_subdiv * graph.edge_count)
        for (let i = 0; i < graph.edge_count; i++) {
            const e = graph.edges[i]
            const axis = new Vector3().subVectors(e.n_target.position, e.n_source.position)
            let orth_ref = Math.abs(axis.x) > Math.abs(axis.z) ? new Vector3(-axis.y, axis.x, 0) : new Vector3(0, -axis.z, axis.y)
            orth_ref.normalize()
            orth_ref.multiplyScalar(this.radius)
            const index = 2 * i * this.circular_subdiv
            for (let j = 0; j < this.circular_subdiv; j++) {
                const angle = j * (360 / this.circular_subdiv);
                const current = orth_ref.applyAxisAngle(axis, angle)
                this.positions[index + j] = new Vector3().addVectors(current, e.n_source.position)
                this.positions[index + this.circular_subdiv + j] = new Vector3().addVectors(current, e.n_target.position)
                this.triangles[index + j] = new Triangle(index + j,
                    index + (j + 1) % this.circular_subdiv,
                    index + j + this.circular_subdiv)
                this.triangles[index + this.circular_subdiv + j] = new Triangle(index + (j + 1) % this.circular_subdiv,
                    index + this.circular_subdiv + (j + 1) % this.circular_subdiv,
                    index + j + this.circular_subdiv);

            }
        }

        this.centerAndScaleToUnit()
        this.recomputeNormals()
        console.log(this.positions);
    }


    clear() {
        this.positions = new Array()
        this.normals= new Array()
        this.triangles = new Array()
    }

    recomputeNormals (){
        this.normals = new Array(this.positions.length)
        for (let i = 0; i < this.triangles.length; i++) {
            const e01 = new Vector3().subVectors(this.positions[this.triangles[i].b], this.positions[this.triangles[i].a])
            const e02 = new Vector3().subVectors(this.positions[this.triangles[i].c], this.positions[this.triangles[i].a])
            let n = new Vector3().crossVectors(e01, e02)
            n.normalize()
            this.normals[this.triangles[i].a] = new Vector3(1, 0, 0).add(n)
            this.normals[this.triangles[i].b] = new Vector3(1, 0, 0).add(n)
            this.normals[this.triangles[i].c] = new Vector3(1, 0, 0).add(n)
        }
        for (let i = 0; i < this.normals.length; i++) {
            this.normals[i].normalize()
        }
    }

    centerAndScaleToUnit (){
        let c = new Vector3()
        for (let i = 0; i < this.positions.length; i++) {
            c.add(this.positions[i])
        }
        c.divideScalar(this.positions.length)
        let maxD = this.positions[0].distanceTo(c)
        for (let i = 0; i < this.positions.length; i++) {
            const m = this.positions[i].distanceTo(c)
            if (m>maxD) {
                maxD=m
            }
        }
        for (let i = 0; i < this.positions.length; i++) {
            const tmp_vec = new Vector3().subVectors(this.positions[i], c)
            this.positions[i] = tmp_vec.divideScalar(maxD)
        }
    }
}
