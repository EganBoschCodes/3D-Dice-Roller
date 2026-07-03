"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { suspenseToPhysics } from "@/lib/dice/suspense";
import { useDiceStore } from "@/lib/store";

// half-extents of the tray floor
export const TRAY_W = 8;
export const TRAY_D = 6;

const RIM_H = 0.9;

export function Tray() {
  // Floor restitution tracks the suspense dial; rapier applies it to the live
  // fixed collider, so the tray gets bouncier/deader as the slider moves.
  const floorRestitution = useDiceStore((s) => suspenseToPhysics(s.suspense).floorRestitution);
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {/* floor (top surface at y=0) */}
        <CuboidCollider
          args={[TRAY_W + 1, 0.5, TRAY_D + 1]}
          position={[0, -0.5, 0]}
          friction={0.6}
          restitution={floorRestitution}
        />
        {/* tall invisible walls so thrown dice can't hop out */}
        <CuboidCollider args={[0.5, 5, TRAY_D + 1]} position={[TRAY_W + 0.5, 5, 0]} />
        <CuboidCollider args={[0.5, 5, TRAY_D + 1]} position={[-TRAY_W - 0.5, 5, 0]} />
        <CuboidCollider args={[TRAY_W + 1, 5, 0.5]} position={[0, 5, TRAY_D + 0.5]} />
        <CuboidCollider args={[TRAY_W + 1, 5, 0.5]} position={[0, 5, -TRAY_D - 0.5]} />
        {/* ceiling safety net */}
        <CuboidCollider args={[TRAY_W + 1, 0.5, TRAY_D + 1]} position={[0, 10.5, 0]} />
      </RigidBody>

      {/* visible felt floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TRAY_W * 2, TRAY_D * 2]} />
        <meshStandardMaterial color="#1c2733" roughness={0.95} />
      </mesh>

      {/* visible rim (short — the real containment is the invisible walls) */}
      <mesh position={[TRAY_W + 0.15, RIM_H / 2, 0]} castShadow>
        <boxGeometry args={[0.3, RIM_H, TRAY_D * 2 + 0.6]} />
        <meshStandardMaterial color="#2e3d4f" roughness={0.8} />
      </mesh>
      <mesh position={[-TRAY_W - 0.15, RIM_H / 2, 0]} castShadow>
        <boxGeometry args={[0.3, RIM_H, TRAY_D * 2 + 0.6]} />
        <meshStandardMaterial color="#2e3d4f" roughness={0.8} />
      </mesh>
      <mesh position={[0, RIM_H / 2, TRAY_D + 0.15]} castShadow>
        <boxGeometry args={[TRAY_W * 2 + 0.6, RIM_H, 0.3]} />
        <meshStandardMaterial color="#2e3d4f" roughness={0.8} />
      </mesh>
      <mesh position={[0, RIM_H / 2, -TRAY_D - 0.15]} castShadow>
        <boxGeometry args={[TRAY_W * 2 + 0.6, RIM_H, 0.3]} />
        <meshStandardMaterial color="#2e3d4f" roughness={0.8} />
      </mesh>
    </>
  );
}
