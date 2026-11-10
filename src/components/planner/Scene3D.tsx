"use client";
import { Component, useMemo, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Edges, OrbitControls } from "@react-three/drei";
import { DoubleSide } from "three";
import { bySlug } from "@/data/products";
import { partsFor, shade, WALL_COLORS, worldPose, type WallColor } from "@/lib/planner/model3d";
import type { Plan } from "@/lib/planner/types";

export type Mode3D = "orbita" | "dentro";

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Furniture({ slug, x, y, rot, bad }: { slug: string; x: number; y: number; rot: 0 | 90 | 180 | 270; bad: boolean }) {
  const p = bySlug(slug);
  const parts = useMemo(() => (p ? partsFor(p) : []), [p]);
  if (!p) return null;
  const { position, rotationY } = worldPose({ x, y, rot });
  const main = bad ? "#c0392b" : p.colors[0].hex;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {parts.map((part, i) => (
        <mesh key={i} position={part.pos}>
          <boxGeometry args={part.size} />
          <meshStandardMaterial color={part.dark ? shade(main, 0.45) : main} roughness={0.85} />
          {!part.dark && <Edges color="#00000040" />}
        </mesh>
      ))}
    </group>
  );
}

function Room({ plan, wall, inside }: { plan: Plan; wall: WallColor; inside: boolean }) {
  const w = plan.room.w / 100, d = plan.room.d / 100, h = (plan.room.h ?? 260) / 100, t = 0.1;
  const wallMat = { color: WALL_COLORS[wall], roughness: 0.95, side: DoubleSide, transparent: !inside, opacity: inside ? 1 : 0.32, depthWrite: inside } as const;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[w / 2, 0, d / 2]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#e6dcc8" roughness={0.9} />
      </mesh>
      {inside && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[w / 2, h, d / 2]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#fbf9f4" roughness={1} side={DoubleSide} />
        </mesh>
      )}
      {/* paredes (fora do retângulo útil, para não invadir o ambiente) */}
      <mesh position={[w / 2, h / 2, -t / 2]}><boxGeometry args={[w + 2 * t, h, t]} /><meshStandardMaterial {...wallMat} /></mesh>
      <mesh position={[w / 2, h / 2, d + t / 2]}><boxGeometry args={[w + 2 * t, h, t]} /><meshStandardMaterial {...wallMat} /></mesh>
      <mesh position={[-t / 2, h / 2, d / 2]}><boxGeometry args={[t, h, d]} /><meshStandardMaterial {...wallMat} /></mesh>
      <mesh position={[w + t / 2, h / 2, d / 2]}><boxGeometry args={[t, h, d]} /><meshStandardMaterial {...wallMat} /></mesh>
    </group>
  );
}

/** Ambiente 3D com os móveis nas mesmas posições da planta. Carregado só quando o usuário abre o 3D. */
export default function Scene3D({ plan, errorIds, mode, wall }: { plan: Plan; errorIds: Set<string>; mode: Mode3D; wall: WallColor }) {
  const w = plan.room.w / 100, d = plan.room.d / 100, big = Math.max(w, d);
  const inside = mode === "dentro";
  const eye = 1.55;
  // "dentro": a pessoa fica perto de uma parede olhando para o ambiente; o alvo está a 1 cm da câmera,
  // então arrastar gira a vista em 360° sem sair do lugar.
  const z0 = Math.max(d / 2, d - 0.6);
  const camera = inside
    ? { position: [w / 2, eye, z0] as [number, number, number], fov: 70, near: 0.05, far: 60 }
    : { position: [w / 2 + big * 0.7, big * 0.95, d / 2 + big * 1.15] as [number, number, number], fov: 45, near: 0.1, far: 120 };
  const target: [number, number, number] = inside ? [w / 2, eye, z0 - 0.01] : [w / 2, 0.3, d / 2];

  return (
    <Boundary fallback={<p role="alert" style={{ padding: 16 }}>Não foi possível abrir o 3D neste aparelho. A planta 2D continua funcionando.</p>}>
      <Canvas key={`${mode}:${plan.room.w}x${plan.room.d}`} frameloop="demand" dpr={[1, 1.5]} camera={camera} gl={{ antialias: true, powerPreference: "low-power" }} aria-label="Visualização 3D do ambiente">
        <color attach="background" args={[inside ? WALL_COLORS[wall] : "#efe9dc"]} />
        <ambientLight intensity={0.75} />
        <hemisphereLight args={["#ffffff", "#cfc4ad", 0.5]} />
        <directionalLight position={[w * 0.5, 5, d * 1.5]} intensity={0.8} />
        <directionalLight position={[-w, 4, -d * 0.5]} intensity={0.5} />
        <Room plan={plan} wall={wall} inside={inside} />
        {plan.items.map((it) => <Furniture key={it.id} slug={it.slug} x={it.x} y={it.y} rot={it.rot} bad={errorIds.has(it.id)} />)}
        {inside
          ? <OrbitControls target={target} enableZoom={false} enablePan={false} rotateSpeed={-0.45} minPolarAngle={0.35} maxPolarAngle={Math.PI - 0.5} />
          : <OrbitControls target={target} enablePan={false} minDistance={1.2} maxDistance={big * 3} maxPolarAngle={Math.PI / 2 - 0.05} />}
      </Canvas>
    </Boundary>
  );
}
