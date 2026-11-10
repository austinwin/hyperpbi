import {
    BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, TorusGeometry,
    type BufferGeometry,
} from "three";
import type { Scene3dKind } from "../../schema/scene3dSchema";

export function createSceneMeshes() {
    const box = new BoxGeometry();
    const cylinder = new CylinderGeometry(0.5, 0.5, 1, 24);
    const sphere = new SphereGeometry(0.5, 24, 16);
    const cone = new CylinderGeometry(0, 0.5, 1, 24);
    const torus = new TorusGeometry(0.5, 0.028, 8, 32);
    const steel = new MeshStandardMaterial({ color: "#546d81", metalness: 0.5, roughness: 0.36 });
    const trim = new MeshStandardMaterial({ color: "#b4c9d5", metalness: 0.33, roughness: 0.42 });
    const base = new MeshStandardMaterial({ color: "#8298aa", metalness: 0.16, roughness: 0.68 });
    const dark = new MeshStandardMaterial({ color: "#23374b", metalness: 0.25, roughness: 0.58 });

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
        dispose() {
            [box, cylinder, sphere, cone, torus, steel, trim, base, dark].forEach(resource => resource.dispose());
        },
    };
}
