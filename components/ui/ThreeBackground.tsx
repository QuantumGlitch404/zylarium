import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Trail } from '@react-three/drei';
import * as THREE from 'three';

const Crystal = () => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
        meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    });

    return (
        <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
            <mesh ref={meshRef}>
                <octahedronGeometry args={[2.5, 0]} />
                <meshPhysicalMaterial
                    color="#6366f1"
                    emissive="#4338ca"
                    emissiveIntensity={0.5}
                    roughness={0}
                    metalness={0.8}
                    transmission={0.6}
                    thickness={2}
                    transparent
                    opacity={0.7}
                    wireframe={false}
                />
            </mesh>
            {/* Wireframe overlay for "tech" look */}
            <mesh ref={meshRef} scale={[1.05, 1.05, 1.05]}>
                <octahedronGeometry args={[2.5, 0]} />
                <meshBasicMaterial color="#a78bfa" wireframe transparent opacity={0.3} />
            </mesh>
        </Float>
    );
};

export const ThreeBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 -z-10 bg-black">
            <Canvas camera={{ position: [0, 0, 8] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#c084fc" />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#22d3ee" />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <Crystal />

                {/* Fog for depth */}
                <fog attach="fog" args={['#000000', 5, 20]} />
            </Canvas>
        </div>
    );
};
