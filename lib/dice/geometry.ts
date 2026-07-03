import * as THREE from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import type { DieType } from "./types";

export const D10_RADIUS = 0.95;

/**
 * Pentagonal trapezohedron vertices: 10 equatorial points zigzagging above/below
 * the equator plus two apexes. The 0.105 offset makes the kite faces near-planar.
 */
export function d10Vertices(radius = D10_RADIUS): THREE.Vector3[] {
  const v: THREE.Vector3[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    v.push(
      new THREE.Vector3(
        Math.cos(a) * radius,
        0.105 * radius * (i % 2 ? -1 : 1),
        Math.sin(a) * radius
      )
    );
  }
  v.push(new THREE.Vector3(0, -1.05 * radius, 0)); // 10: bottom apex
  v.push(new THREE.Vector3(0, 1.05 * radius, 0)); // 11: top apex
  return v;
}

const builders: Record<DieType, () => THREE.BufferGeometry> = {
  d4: () => new THREE.TetrahedronGeometry(1.05),
  d6: () => new THREE.BoxGeometry(1.15, 1.15, 1.15),
  d8: () => new THREE.OctahedronGeometry(0.95),
  d10: () => new ConvexGeometry(d10Vertices()),
  "d%": () => new ConvexGeometry(d10Vertices()),
  d12: () => new THREE.DodecahedronGeometry(0.9),
  d20: () => new THREE.IcosahedronGeometry(0.95),
};

const geometryCache = new Map<DieType, THREE.BufferGeometry>();

export function getDieGeometry(type: DieType): THREE.BufferGeometry {
  let g = geometryCache.get(type);
  if (!g) {
    g = builders[type]();
    geometryCache.set(type, g);
  }
  return g;
}

const hullCache = new Map<DieType, Float32Array>();

/** Vertex cloud for Rapier's convex hull collider. */
export function getHullPoints(type: DieType): Float32Array {
  let pts = hullCache.get(type);
  if (!pts) {
    const pos = getDieGeometry(type).attributes.position;
    pts = new Float32Array(pos.array);
    hullCache.set(type, pts);
  }
  return pts;
}
