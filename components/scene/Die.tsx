"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ConvexHullCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { getDieGeometry, getHullPoints } from "@/lib/dice/geometry";
import { getFaceData, getLabelPlacements } from "@/lib/dice/faceData";
import { COCKED_THRESHOLD, readTopFace } from "@/lib/dice/readFace";
import { suspenseToPhysics } from "@/lib/dice/suspense";
import { rand, type ThrowParams } from "@/lib/dice/throwParams";
import type { DieType } from "@/lib/dice/types";
import { useDiceStore } from "@/lib/store";

const DIE_COLORS: Record<DieType, string> = {
  d4: "#c0392b",
  d6: "#2980b9",
  d8: "#27ae60",
  d10: "#8e44ad",
  d12: "#d35400",
  d20: "#b7950b",
  "d%": "#16a085",
};

const FONT_SIZE: Record<DieType, number> = {
  d4: 0.3,
  d6: 0.48,
  d8: 0.4,
  d10: 0.32,
  d12: 0.36,
  d20: 0.28,
  "d%": 0.26,
};

interface DieProps {
  id: string;
  type: DieType;
  params: ThrowParams;
}

export function Die({ id, type, params }: DieProps) {
  const body = useRef<RapierRigidBody>(null);
  const nudges = useRef(0);
  const settleDwell = useRef(0);
  const reportResult = useDiceStore((s) => s.reportResult);
  // Restitution/damping are reactive collider props: rapier applies changes to
  // live bodies, so nudging the slider mid-roll re-tunes the dice in the tray.
  const suspense = useDiceStore((s) => s.suspense);
  const phys = useMemo(() => suspenseToPhysics(suspense), [suspense]);

  const geometry = useMemo(() => getDieGeometry(type), [type]);
  const hull = useMemo(() => getHullPoints(type), [type]);
  const faces = useMemo(() => getFaceData(type), [type]);
  const labels = useMemo(() => getLabelPlacements(type), [type]);

  const readAndReport = useCallback(
    (force: boolean) => {
      const rb = body.current;
      if (!rb) return;
      const q = rb.rotation();
      const reading = readTopFace(faces, new THREE.Quaternion(q.x, q.y, q.z, q.w));
      if (!force && reading.dot < COCKED_THRESHOLD && nudges.current < 3) {
        // cocked: leaning on a wall or another die — kick it and let it resettle
        nudges.current++;
        rb.applyImpulse({ x: rand(-1.5, 1.5), y: 3.5, z: rand(-1.5, 1.5) }, true);
        rb.applyTorqueImpulse({ x: rand(-1, 1), y: rand(-1, 1), z: rand(-1, 1) }, true);
        return;
      }
      reportResult(id, { type, value: reading.value, label: reading.label });
    },
    [faces, id, type, reportResult]
  );

  useEffect(() => {
    // Backstop deadlines scale with suspense (captured once, at throw time):
    // calm rolls give up and read early, dramatic rolls get much longer.
    const { softMs, hardMs } = suspenseToPhysics(useDiceStore.getState().suspense);
    // backstop for dice that never trigger onSleep
    const soft = setTimeout(() => {
      const rb = body.current;
      if (!rb || rb.isSleeping() || useDiceStore.getState().results[id]) return;
      const lv = rb.linvel();
      const av = rb.angvel();
      const speed = Math.hypot(lv.x, lv.y, lv.z) + Math.hypot(av.x, av.y, av.z);
      if (speed < 0.5) {
        readAndReport(false);
      } else if (rb.translation().y > 8) {
        // genuinely stuck: floating up near the ceiling net — re-drop it. A die
        // merely still bouncing in the tray is left alone (that's the whole point
        // of high suspense) and resolves via natural settle or the hard backstop.
        rb.setTranslation({ x: rand(-2, 2), y: 7, z: rand(-2, 2) }, true);
        rb.setLinvel({ x: 0, y: -2, z: 0 }, true);
        rb.setAngvel({ x: rand(-10, 10), y: rand(-10, 10), z: rand(-10, 10) }, true);
      }
    }, softMs);
    const hard = setTimeout(() => {
      if (!useDiceStore.getState().results[id]) readAndReport(true);
    }, hardMs);
    return () => {
      clearTimeout(soft);
      clearTimeout(hard);
    };
  }, [id, readAndReport]);

  // Active settle detection: once a die's motion stays under the suspense-scaled
  // speed for a dwell window, read it — without waiting for rapier's full sleep.
  // Low suspense = looser speed + shorter dwell, so calm rolls resolve snappily.
  useFrame((_, dt) => {
    const rb = body.current;
    if (!rb || rb.isSleeping() || useDiceStore.getState().results[id]) return;
    const lv = rb.linvel();
    const av = rb.angvel();
    const speed = Math.hypot(lv.x, lv.y, lv.z) + Math.hypot(av.x, av.y, av.z);
    if (speed < phys.settleSpeed) {
      settleDwell.current += dt;
      if (settleDwell.current >= phys.settleDwell) readAndReport(false);
    } else {
      settleDwell.current = 0;
    }
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      ccd
      position={params.position}
      rotation={params.rotation}
      linearVelocity={params.linearVelocity}
      angularVelocity={params.angularVelocity}
      linearDamping={phys.linearDamping}
      angularDamping={phys.angularDamping}
      onSleep={() => readAndReport(false)}
    >
      <ConvexHullCollider args={[hull]} restitution={phys.dieRestitution} friction={0.4} />
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={DIE_COLORS[type]}
          flatShading
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>
      {labels.map((l, i) => (
        <Text
          key={i}
          position={l.position}
          quaternion={l.quaternion}
          fontSize={FONT_SIZE[type]}
          color="white"
          outlineWidth={0.02}
          outlineColor="#111111"
          anchorX="center"
          anchorY="middle"
        >
          {l.text}
        </Text>
      ))}
    </RigidBody>
  );
}
