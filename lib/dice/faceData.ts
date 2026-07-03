import * as THREE from "three";
import { D10_RADIUS, d10Vertices, getDieGeometry } from "./geometry";
import type { DieType, FaceData } from "./types";

export interface LabelPlacement {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  text: string;
}

interface LogicalFace {
  normal: THREE.Vector3;
  centroid: THREE.Vector3;
}

function triNormal(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
  return new THREE.Vector3()
    .crossVectors(
      new THREE.Vector3().subVectors(b, a),
      new THREE.Vector3().subVectors(c, a)
    );
}

/**
 * Three's polyhedron geometries are triangulated with no face groups (a d12
 * pentagon is 3 triangles). Merge coplanar triangles into logical faces.
 */
function extractLogicalFaces(geom: THREE.BufferGeometry): LogicalFace[] {
  const pos = geom.attributes.position;
  const idx = geom.index;
  const triCount = (idx ? idx.count : pos.count) / 3;
  const groups: { normal: THREE.Vector3; sum: THREE.Vector3; weight: number }[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let t = 0; t < triCount; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3;
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);
    const n = triNormal(a, b, c);
    const area = n.length() / 2;
    if (area < 1e-8) continue;
    n.normalize();
    const centroid = new THREE.Vector3().add(a).add(b).add(c).multiplyScalar(1 / 3);
    let g = groups.find((g) => g.normal.dot(n) > 0.999);
    if (!g) {
      g = { normal: n.clone(), sum: new THREE.Vector3(), weight: 0 };
      groups.push(g);
    }
    g.sum.addScaledVector(centroid, area);
    g.weight += area;
  }
  return groups.map((g) => ({
    normal: g.normal,
    centroid: g.sum.multiplyScalar(1 / g.weight),
  }));
}

/** Kite face of the trapezohedron: tip apex, two side corners, far tip. */
function kiteFace(
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3
): LogicalFace {
  const centroid = new THREE.Vector3().add(p0).add(p1).add(p2).add(p3).multiplyScalar(0.25);
  const normal = triNormal(p0, p1, p2).normalize().add(triNormal(p0, p2, p3).normalize()).normalize();
  if (normal.dot(centroid) < 0) normal.negate();
  return { normal, centroid };
}

function d10Faces(): LogicalFace[] {
  const v = d10Vertices(D10_RADIUS);
  const top = v[11];
  const bottom = v[10];
  const faces: LogicalFace[] = [];
  for (let k = 0; k < 5; k++) {
    // even equatorial indices sit above the equator, odd below
    faces.push(kiteFace(top, v[(2 * k) % 10], v[(2 * k + 1) % 10], v[(2 * k + 2) % 10]));
    faces.push(kiteFace(bottom, v[(2 * k + 1) % 10], v[(2 * k + 2) % 10], v[(2 * k + 3) % 10]));
  }
  return faces;
}

/**
 * Reorder so faces[i] and faces[n-1-i] are antipodal — lets us assign values
 * with the real-dice convention (opposite faces sum to n+1, d10 labels to 9).
 */
function orderAntipodal(faces: LogicalFace[]): LogicalFace[] {
  const n = faces.length;
  const used = new Array<boolean>(n).fill(false);
  const ordered = new Array<LogicalFace>(n);
  let k = 0;
  for (let i = 0; i < n; i++) {
    if (used[i]) continue;
    used[i] = true;
    let j = -1;
    let bestDot = -0.9;
    for (let m = i + 1; m < n; m++) {
      if (used[m]) continue;
      const d = faces[i].normal.dot(faces[m].normal);
      if (d < bestDot) {
        bestDot = d;
        j = m;
      }
    }
    if (j >= 0) {
      used[j] = true;
      ordered[k] = faces[i];
      ordered[n - 1 - k] = faces[j];
      k++;
    } else {
      ordered[k] = faces[i];
      k++;
    }
  }
  return ordered;
}

function markAmbiguous(label: string): string {
  // distinguish 6 from 9 the way real dice do
  return label === "6" || label === "9" ? `${label}.` : label;
}

function labelValue(type: DieType, i: number): { label: string; value: number } {
  if (type === "d10") {
    return { label: markAmbiguous(String(i)), value: i === 0 ? 10 : i };
  }
  if (type === "d%") {
    return { label: i === 0 ? "00" : `${i}0`, value: i === 0 ? 100 : i * 10 };
  }
  return { label: markAmbiguous(String(i + 1)), value: i + 1 };
}

const UP = new THREE.Vector3(0, 1, 0);
const FALLBACK_UP = new THREE.Vector3(0, 0, -1);

/** Quaternion rotating +Z to the face normal with a stable in-plane "up". */
function faceQuaternion(normal: THREE.Vector3, upHint?: THREE.Vector3): THREE.Quaternion {
  const ref = upHint ?? (Math.abs(normal.y) > 0.9 ? FALLBACK_UP : UP);
  const upT = ref.clone().addScaledVector(normal, -normal.dot(ref)).normalize();
  const right = new THREE.Vector3().crossVectors(upT, normal);
  const m = new THREE.Matrix4().makeBasis(right, upT, normal);
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

interface DieData {
  faces: FaceData[];
  placements: LabelPlacement[];
}

/**
 * d4 uses the top-vertex convention: readout picks the vertex pointing up, and
 * each face shows all three of its corners' vertex values (like a real d4).
 */
function buildD4(): DieData {
  const geom = getDieGeometry("d4");
  const pos = geom.attributes.position;
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(pos, i);
    if (!verts.some((v) => v.distanceTo(p) < 1e-4)) verts.push(p);
  }
  const faces: FaceData[] = verts.map((v, k) => ({
    normal: v.clone().normalize(),
    centroid: v.clone(),
    value: k + 1,
    label: String(k + 1),
  }));
  const placements: LabelPlacement[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let t = 0; t < pos.count / 3; t++) {
    a.fromBufferAttribute(pos, t * 3);
    b.fromBufferAttribute(pos, t * 3 + 1);
    c.fromBufferAttribute(pos, t * 3 + 2);
    const centroid = new THREE.Vector3().add(a).add(b).add(c).multiplyScalar(1 / 3);
    const n = triNormal(a, b, c).normalize();
    if (n.dot(centroid) < 0) n.negate();
    for (const corner of [a, b, c]) {
      const k = verts.findIndex((v) => v.distanceTo(corner) < 1e-4);
      const dir = corner.clone().sub(centroid);
      placements.push({
        position: centroid.clone().addScaledVector(dir, 0.52).addScaledVector(n, 0.02),
        quaternion: faceQuaternion(n, dir.clone().normalize()),
        text: String(k + 1),
      });
    }
  }
  return { faces, placements };
}

function buildDie(type: DieType): DieData {
  if (type === "d4") return buildD4();
  const raw =
    type === "d10" || type === "d%" ? d10Faces() : extractLogicalFaces(getDieGeometry(type));
  const ordered = orderAntipodal(raw);
  const faces: FaceData[] = ordered.map((f, i) => {
    const { label, value } = labelValue(type, i);
    return { normal: f.normal, centroid: f.centroid, value, label };
  });
  const placements: LabelPlacement[] = faces.map((f) => ({
    position: f.centroid.clone().addScaledVector(f.normal, 0.02),
    quaternion: faceQuaternion(f.normal),
    text: f.label,
  }));
  return { faces, placements };
}

const dataCache = new Map<DieType, DieData>();

function getDieData(type: DieType): DieData {
  let d = dataCache.get(type);
  if (!d) {
    d = buildDie(type);
    dataCache.set(type, d);
  }
  return d;
}

export function getFaceData(type: DieType): FaceData[] {
  return getDieData(type).faces;
}

export function getLabelPlacements(type: DieType): LabelPlacement[] {
  return getDieData(type).placements;
}
