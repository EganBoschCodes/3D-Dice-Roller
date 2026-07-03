"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { suspenseToPhysics } from "@/lib/dice/suspense";
import { useDiceStore } from "@/lib/store";

// half-extents of the tray floor
export const TRAY_W = 8;
export const TRAY_D = 6;

const RIM_H = 0.9;

/**
 * Material for the felt floor: plain felt by default, or the user's uploaded
 * image / looping video mapped onto the floor. Textures are built imperatively
 * (the URL is a runtime data URL, so drei's suspending loaders don't fit) and
 * disposed when they change or unmount.
 */
function FloorMaterial() {
  const url = useDiceStore((s) => s.bgMediaUrl);
  const type = useDiceStore((s) => s.bgMediaType);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }

    if (type === "video") {
      const video = document.createElement("video");
      video.src = url;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      void video.play().catch(() => {});
      const tex = new THREE.VideoTexture(video);
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
      return () => {
        video.pause();
        video.removeAttribute("src");
        tex.dispose();
      };
    }

    let tex: THREE.Texture | null = null;
    let cancelled = false;
    new THREE.TextureLoader().load(url, (t) => {
      if (cancelled) {
        t.dispose();
        return;
      }
      t.colorSpace = THREE.SRGBColorSpace;
      tex = t;
      setTexture(t);
    });
    return () => {
      cancelled = true;
      tex?.dispose();
    };
  }, [url, type]);

  // Unlit on purpose: a chosen photo/video should read at full brightness rather
  // than being darkened by the tray lighting (meshStandard renders the map near
  // black here). The default felt keeps the lit material so it still takes shadows.
  if (texture) {
    return <meshBasicMaterial map={texture} toneMapped={false} />;
  }
  return <meshStandardMaterial color="#1c2733" roughness={0.95} />;
}

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

      {/* visible felt floor (or the user's uploaded image / video) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TRAY_W * 2, TRAY_D * 2]} />
        <FloorMaterial />
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
