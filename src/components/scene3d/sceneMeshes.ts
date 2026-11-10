import {
    BoxGeometry, CylinderGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry,
    type BufferGeometry,
} from "three";
import type { Scene3dKind } from "../../schema/scene3dSchema";

export function createSceneMeshes() {
    const box = new BoxGeometry();
    const cylinder = new CylinderGeometry(0.5, 0.5, 1, 24);
    const sphere = new SphereGeometry(0.5, 24, 16);
    const cone = new CylinderGeometry(0, 0.5, 1, 24);
    const torus = new TorusGeometry(0.5, 0.028, 8, 32);
    const flowBand = torus.clone().rotateX(Math.PI / 2);
    const steel = new MeshStandardMaterial({ color: "#546d81", metalness: 0.5, roughness: 0.36 });
    const trim = new MeshStandardMaterial({ color: "#b4c9d5", metalness: 0.33, roughness: 0.42 });
    const base = new MeshStandardMaterial({ color: "#8298aa", metalness: 0.16, roughness: 0.68 });
    const dark = new MeshStandardMaterial({ color: "#23374b", metalness: 0.25, roughness: 0.58 });
    const water = new MeshStandardMaterial({ color: "#229cdb", metalness: 0.06, roughness: 0.24 });
    const waterline = new MeshBasicMaterial({ color: "#9eeaff", toneMapped: false });
    const matrix = new Matrix4();

    function addTankGauge(group: Group) {
        const bottom = 0.22;
        const range = 1.93;
        const column = new Mesh(cylinder, water);
        column.scale.set(1.9, 0, 1.9);
        const surface = new Mesh(torus, waterline);
        surface.rotation.x = Math.PI / 2;
        surface.scale.set(1.92, 1.92, 0.7);
        const plate = new Mesh(box, dark);
        plate.position.set(0.23, bottom + range / 2, 0.995);
        plate.scale.set(0.27, range + 0.1, 0.095);
        const indicator = new Mesh(box, waterline);
        indicator.position.set(0.21, bottom, 1.05);
        indicator.scale.set(0.11, 0, 0.025);
        group.add(column, surface, plate, indicator);
        for (let tick = 0; tick <= 4; tick++) {
            const mark = new Mesh(box, trim);
            mark.position.set(0.325, bottom + range * tick / 4, 1.047);
            mark.scale.set(0.08, 0.025, 0.03);
            group.add(mark);
        }
        return (level?: number) => {
            const height = (level ?? 0) / 100 * range;
            column.visible = surface.visible = indicator.visible = height > 0;
            column.position.y = indicator.position.y = bottom + height / 2;
            column.scale.y = indicator.scale.y = height;
            surface.position.y = bottom + height;
        };
    }

    function addPipeFlow(group: Group) {
        const bands = new InstancedMesh(flowBand, waterline, 4);
        bands.frustumCulled = false;
        bands.raycast = () => {};
        bands.visible = false;
        group.add(bands);
        const move = (phase: number, length: number) => {
            for (let index = 0; index < bands.count; index++) {
                const position = (phase + index / bands.count) % 1;
                matrix.makeScale(1.06, Math.min(1, 0.95 / length), 1.06).setPosition(0, position - 0.5, 0);
                bands.setMatrixAt(index, matrix);
            }
            bands.instanceMatrix.needsUpdate = true;
        };
        move(0.12, 1);
        return { bands, move };
    }

    function build(kind: Scene3dKind, finish: MeshStandardMaterial): Group {
        const group = new Group();
        const place = (geometry: BufferGeometry, material: MeshStandardMaterial, x: number, y: number, z: number,
            width: number, height: number, depth: number, rotateZ = 0, rotateX = 0) => {
            const mesh = new Mesh(geometry, material);
            mesh.position.set(x, y, z);
            mesh.scale.set(width, height, depth);
            mesh.rotation.set(rotateX, 0, rotateZ);
            mesh.castShadow = mesh.receiveShadow = true;
            group.add(mesh);
        };
        if (kind === "pump") {
            const horizontal = Math.PI / 2;
            place(box, base, 0, 0.1, 0, 1.8, 0.2, 1.23);
            place(box, dark, 0, 0.23, 0, 1.44, 0.09, 0.75);
            place(box, steel, 0.18, 0.36, 0, 0.9, 0.23, 0.58);
            place(cylinder, finish, 0.08, 0.75, 0, 0.78, 1.06, 0.78, horizontal);
            for (const x of [-0.31, -0.16, -0.01, 0.14, 0.29, 0.44]) {
                place(cylinder, finish, x, 0.75, 0, 0.86, 0.06, 0.86, horizontal);
            }
            place(cylinder, steel, -0.59, 0.75, 0, 0.99, 0.27, 0.99, horizontal);
            place(cylinder, trim, -0.78, 0.75, 0, 0.55, 0.18, 0.55, horizontal);
            place(cylinder, dark, 0.66, 0.75, 0, 0.65, 0.17, 0.65, horizontal);
            place(box, dark, 0.13, 1.17, 0, 0.42, 0.19, 0.36);
            place(box, trim, 0.13, 1.27, 0, 0.45, 0.05, 0.39);
            place(cylinder, trim, -0.59, 1.25, 0, 0.31, 0.23, 0.31);
            for (const x of [-0.72, 0.72]) {
                for (const z of [-0.43, 0.43]) place(cylinder, trim, x, 0.22, z, 0.12, 0.06, 0.12);
            }
        } else if (kind === "tank") {
            place(cylinder, base, 0, 0.11, 0, 2.22, 0.22, 2.22);
            place(cylinder, finish, 0, 1.19, 0, 2, 1.98, 2);
            place(sphere, finish, 0, 2.14, 0, 2, 0.7, 2);
            for (const y of [0.31, 1.12, 2.1]) place(torus, steel, 0, y, 0, 2.01, 2.01, 1, 0, Math.PI / 2);
            place(cylinder, trim, 0, 2.51, 0, 0.54, 0.14, 0.54);
            place(cylinder, dark, 0, 2.6, 0, 0.42, 0.06, 0.42);
        } else if (kind !== "model") {
            const geometry = kind === "box" ? box : kind === "sphere" ? sphere : kind === "cone" ? cone : cylinder;
            place(geometry, finish, 0, 0, 0, 1, 1, 1);
        }
        return group;
    }

    return {
        build,
        addTankGauge,
        addPipeFlow,
        dispose() {
            [box, cylinder, sphere, cone, torus, flowBand, steel, trim, base, dark, water, waterline].forEach(resource => resource.dispose());
        },
    };
}
