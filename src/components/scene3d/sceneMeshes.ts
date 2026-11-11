import {
    BoxGeometry, CylinderGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector3,
    type BufferGeometry,
} from "three";
import type { Scene3dKind, Scene3dVector } from "../../schema/scene3dSchema";

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
    const up = new Vector3(0, 1, 0);
    const bronze = new MeshStandardMaterial({ color: "#d3a36a", metalness: 0.72, roughness: 0.31 });
    const glass = new MeshStandardMaterial({ color: "#0d2e40", metalness: 0.12, roughness: 0.19 });
    const signal = new MeshBasicMaterial({ color: "#57e8e5", toneMapped: false });

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

    function addPipeFlow(group: Group, path?: Scene3dVector[]) {
        if (path && path.length > 1) {
            const vertices = path.map(point => new Vector3(...point));
            const segments = vertices.slice(1).map((point, index) => ({
                start: vertices[index], end: point, length: point.distanceTo(vertices[index]),
            }));
            const total = segments.reduce((sum, segment) => sum + segment.length, 0);
            const bands = new InstancedMesh(sphere, waterline, 5);
            bands.frustumCulled = false;
            bands.raycast = () => {};
            bands.visible = false;
            group.add(bands);
            const move = (phase: number) => {
                for (let index = 0; index < bands.count; index++) {
                    let distance = ((phase + index / bands.count) % 1) * total;
                    let point = vertices[vertices.length - 1];
                    for (const segment of segments) {
                        if (distance <= segment.length) {
                            point = segment.start.clone().lerp(segment.end, segment.length ? distance / segment.length : 0);
                            break;
                        }
                        distance -= segment.length;
                    }
                    matrix.makeScale(0.11, 0.11, 0.11).setPosition(point);
                    bands.setMatrixAt(index, matrix);
                }
                bands.instanceMatrix.needsUpdate = true;
            };
            move(0.12);
            return { bands, move };
        }
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

    function build(kind: Scene3dKind, finish: MeshStandardMaterial, path?: Scene3dVector[], diameter = 0.2): Group {
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
        if (kind === "pipe" && path && path.length >= 2) {
            // Straight centerline segments and steel elbow fittings. Flow markers follow
            // the same ordered path, without floating through disconnected equipment.
            for (let index = 1; index < path.length; index++) {
                const from = new Vector3(...path[index - 1]);
                const to = new Vector3(...path[index]);
                const delta = to.clone().sub(from);
                const segment = new Mesh(cylinder, finish);
                segment.position.copy(from.add(to).multiplyScalar(0.5));
                segment.quaternion.setFromUnitVectors(up, delta.clone().normalize());
                segment.scale.set(diameter, delta.length() + 0.008, diameter);
                segment.castShadow = segment.receiveShadow = true;
                group.add(segment);
            }
            for (const vertex of path) {
                const elbow = new Mesh(sphere, finish);
                elbow.position.set(...vertex);
                elbow.scale.setScalar(diameter * 1.035);
                elbow.castShadow = elbow.receiveShadow = true;
                group.add(elbow);
            }
        } else if (kind === "pump") {
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
            // Rotating motor fan remains an independent child of the static casing.
            const motorFan = new Group();
            motorFan.name = "scene3d-motor-fan";
            motorFan.position.set(0.78, 0.75, 0);
            for (let bladeIndex = 0; bladeIndex < 5; bladeIndex++) {
                const angle = bladeIndex * Math.PI * 2 / 5;
                const blade = new Mesh(box, trim);
                blade.position.set(0, Math.cos(angle) * 0.22, Math.sin(angle) * 0.22);
                blade.scale.set(0.035, 0.35, 0.17);
                blade.rotation.x = angle + 0.32;
                blade.castShadow = true;
                motorFan.add(blade);
            }
            const hub = new Mesh(cylinder, steel);
            hub.rotation.z = Math.PI / 2;
            hub.scale.set(0.18, 0.12, 0.18);
            motorFan.add(hub);
            group.add(motorFan);
            for (const x of [-0.72, 0.72]) {
                for (const z of [-0.43, 0.43]) place(cylinder, trim, x, 0.22, z, 0.12, 0.06, 0.12);
            }
        } else if (kind === "well") {
            place(cylinder, dark, 0, 0.15, 0, 0.78, 0.3, 0.78);
            place(cylinder, steel, 0, 0.6, 0, 0.48, 0.92, 0.48);
            place(cylinder, finish, 0, 1.08, 0, 0.67, 0.23, 0.67);
            place(cylinder, trim, 0, 1.23, 0, 0.27, 0.13, 0.27);
            place(box, dark, 0.22, 1.34, 0, 0.26, 0.19, 0.31);
            place(cylinder, bronze, -0.43, 0.57, 0, 0.18, 0.37, 0.18, Math.PI / 2);
        } else if (kind === "flowmeter") {
            // Inline flanged magnetic meter: no fictional spinning impeller.
            place(cylinder, finish, 0, 0.46, 0, 0.66, 1.16, 0.66, Math.PI / 2);
            for (const x of [-0.56, 0.56]) place(cylinder, trim, x, 0.46, 0, 0.85, 0.10, 0.85, Math.PI / 2);
            place(cylinder, steel, 0, 0.92, 0, 0.12, 0.38, 0.12);
            place(box, dark, 0, 1.23, 0, 0.72, 0.47, 0.34);
            place(box, glass, 0, 1.27, 0.182, 0.48, 0.22, 0.018);
            place(box, signal, -0.18, 1.27, 0.194, 0.055, 0.07, 0.022);
        } else if (kind === "valve") {
            // Disc rotates within a flanged butterfly valve from closed to open.
            place(cylinder, finish, 0, 0.52, 0, 0.74, 0.38, 0.74, Math.PI / 2);
            for (const x of [-0.27, 0.27]) place(cylinder, trim, x, 0.52, 0, 0.94, 0.11, 0.94, Math.PI / 2);
            const disc = new Group();
            disc.name = "scene3d-valve-disc";
            disc.position.set(0, 0.52, 0);
            const leaf = new Mesh(cylinder, bronze);
            leaf.rotation.z = Math.PI / 2;
            leaf.scale.set(0.6, 0.08, 0.6);
            disc.add(leaf);
            group.add(disc);
            place(cylinder, steel, 0, 0.94, 0, 0.14, 0.75, 0.14);
            place(box, dark, 0, 1.39, 0, 0.64, 0.45, 0.5);
            place(box, signal, 0, 1.47, 0.265, 0.26, 0.065, 0.02);
        } else if (kind === "injector") {
            // Chemical dosing skid, pump, reagent tank and injection lance.
            place(box, dark, 0, 0.1, 0, 1.18, 0.2, 0.7);
            place(cylinder, finish, -0.25, 0.56, 0, 0.42, 0.82, 0.42);
            place(sphere, trim, -0.25, 0.99, 0, 0.43, 0.24, 0.43);
            place(box, steel, 0.3, 0.35, 0, 0.38, 0.48, 0.45);
            place(cylinder, bronze, 0.34, 0.73, 0, 0.13, 0.55, 0.13);
            place(sphere, signal, 0.34, 1.02, 0, 0.15, 0.15, 0.15);
        } else if (kind === "analyzer") {
            // Side-stream analyzer cabinet with sample fittings and display.
            place(box, steel, 0, 0.41, 0, 0.12, 0.8, 0.12);
            place(box, finish, 0, 1.08, 0, 0.94, 0.92, 0.52);
            place(box, dark, 0, 1.23, 0.272, 0.69, 0.38, 0.028);
            place(box, glass, 0, 1.27, 0.295, 0.52, 0.20, 0.02);
            for (const x of [-0.19, 0.0, 0.19]) place(box, signal, x, 1.04, 0.3, 0.075, 0.075, 0.022);
            place(cylinder, trim, -0.42, 0.57, -0.1, 0.09, 0.48, 0.09);
        } else if (kind === "fan") {
            // A single selectable rotor. A separate static stand/housing can sit behind it.
            for (let index = 0; index < 5; index++) {
                const angle = index * Math.PI * 2 / 5;
                const blade = new Mesh(box, finish);
                blade.position.set(Math.sin(angle) * 0.39, Math.cos(angle) * 0.39, 0);
                blade.scale.set(0.26, 0.64, 0.09);
                blade.rotation.z = -angle + Math.PI / 5;
                blade.castShadow = blade.receiveShadow = true;
                group.add(blade);
            }
            place(cylinder, steel, 0, 0, 0.05, 0.28, 0.16, 0.28, 0, Math.PI / 2);
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
            [box, cylinder, sphere, cone, torus, flowBand, steel, trim, base, dark, water, waterline, bronze, glass, signal].forEach(resource => resource.dispose());
        },
    };
}
