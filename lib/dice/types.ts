import * as THREE from "three";

export type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d%";

export const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d%"];

export interface FaceData {
  /** Local-space unit normal of the face (for d4: unit direction to the vertex). */
  normal: THREE.Vector3;
  /** Local-space face centroid (for d4: the vertex position). */
  centroid: THREE.Vector3;
  /** Contribution to the roll total (d10: 0 face = 10; d%: 00 face = 100). */
  value: number;
  /** Text printed on the face. */
  label: string;
}

export interface DieSpec {
  id: string;
  type: DieType;
}
