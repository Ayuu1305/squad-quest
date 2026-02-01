import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

function ParticleField() {
  const meshRef = useRef();
  const particleCount = 250;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25;

      const r = Math.random();
      if (r < 0.33) {
        colors.set([0.66, 0.33, 0.97], i * 3);
      } else if (r < 0.66) {
        colors.set([0.02, 0.71, 0.83], i * 3);
      } else {
        colors.set([0.92, 0.7, 0.03], i * 3);
      }
    }
    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    meshRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.03) * 0.1;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.12} vertexColors transparent opacity={0.8} />
    </points>
  );
}

function FloatingOrb() {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    meshRef.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.8) * 0.2;
  });

  return (
    <mesh ref={meshRef} scale={1.8}>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial
        color="#a855f7"
        emissive="#a855f7"
        emissiveIntensity={0.8}
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}

export default function Landing3DScene() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} color="#a855f7" intensity={2} />
      <pointLight position={[-10, -10, -10]} color="#06b6d4" intensity={1} />
      <ParticleField />
      <FloatingOrb />
    </Canvas>
  );
}
