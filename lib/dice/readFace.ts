import * as THREE from "three";
import type { FaceData } from "./types";

const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();

/**
 * A flat-resting die's top face normal (or the d4's top vertex direction) is
 * within a few degrees of straight up. Below this, the die is cocked — leaning
 * against a wall or another die — and needs a nudge, not a reading.
 */
export const COCKED_THRESHOLD = 0.88;

export interface FaceReading {
  value: number;
  label: string;
  dot: number;
}

export function readTopFace(faces: FaceData[], worldQuat: THREE.Quaternion): FaceReading {
  let best = faces[0];
  let bestDot = -Infinity;
  for (const f of faces) {
    const d = tmp.copy(f.normal).applyQuaternion(worldQuat).dot(UP);
    if (d > bestDot) {
      bestDot = d;
      best = f;
    }
  }
  return { value: best.value, label: best.label, dot: bestDot };
}
