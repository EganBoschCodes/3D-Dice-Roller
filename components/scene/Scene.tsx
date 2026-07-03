"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { DiceManager } from "./DiceManager";
import { Tray } from "./Tray";

export default function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 17, 10], fov: 45 }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      style={{ position: "fixed", inset: 0 }}
    >
      <color attach="background" args={["#0b0e14"]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[6, 14, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <Suspense fallback={null}>
        {/* unit-scale dice under earth gravity feel floaty; ~-40 gives a tabletop snap */}
        <Physics gravity={[0, -40, 0]}>
          <Tray />
          <DiceManager />
        </Physics>
      </Suspense>
    </Canvas>
  );
}
