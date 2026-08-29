import React, { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sparkles, Float, Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { ORB_COLORS } from "../lib/contexts";

function LivingSphere({ state }) {
  const mesh = useRef();
  const mat = useRef();
  const c = ORB_COLORS[state] || ORB_COLORS.idle;
  const color = useMemo(() => new THREE.Color(c.a), [c.a]);
  const emissive = useMemo(() => new THREE.Color(c.b), [c.b]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (mesh.current) {
      mesh.current.rotation.y = t * 0.15;
      const breathe = 1 + Math.sin(t * 1.4) * 0.035;
      mesh.current.scale.setScalar(breathe);
    }
    if (mat.current) {
      mat.current.color.lerp(color, 0.05);
      mat.current.emissive.lerp(emissive, 0.05);
      const target = state === "thinking" ? 0.55 : state === "speaking" ? 0.7 : state === "listening" ? 0.45 : 0.3;
      mat.current.distort += (target - mat.current.distort) * 0.05;
      const spd = state === "idle" ? 1.2 : 3.0;
      mat.current.speed += (spd - mat.current.speed) * 0.05;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1.35, 128, 128]} />
        <MeshDistortMaterial
          ref={mat}
          color={c.a}
          emissive={c.b}
          emissiveIntensity={0.7}
          roughness={0.15}
          metalness={0.35}
          distort={0.35}
          speed={1.5}
          clearcoat={1}
        />
      </mesh>
      <Sparkles count={80} scale={4} size={3} speed={0.4} color={c.b} opacity={0.7} />
    </Float>
  );
}

export function OrbCanvas({ state = "idle", enableBloom = true, className = "" }) {
  return (
    <Canvas
      className={className}
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 4.2], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      data-testid="orb-canvas"
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 3]} intensity={2.2} />
      <pointLight position={[-4, -2, -2]} intensity={1.2} color="#9ad0b5" />
      <Suspense fallback={null}>
        <LivingSphere state={state} />
        <Environment preset="dawn" />
      </Suspense>
      {enableBloom && (
        <EffectComposer>
          <Bloom intensity={0.9} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      )}
    </Canvas>
  );
}
