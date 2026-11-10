"use client";
import { Component, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, RoundedBox } from "@react-three/drei";
import { CanvasTexture, DirectionalLight, DoubleSide, Group, RepeatWrapping, SRGBColorSpace, type Material, type Texture } from "three";
import { bySlug, type Ambiente, type Product } from "@/data/products";
import { decorFor, type Plant, type Rug } from "@/lib/planner/decor";
import { partsFor, shade, tint, WALL_COLORS, wallPieces, worldPose, type Part, type WallColor } from "@/lib/planner/model3d";
import { DOOR_H, WINDOW_H, WINDOW_SILL, wallFrame, WALLS } from "@/lib/planner/openings";
import { usePlanner } from "@/lib/planner/store";
import type { Opening, Plan, Wall } from "@/lib/planner/types";

export type Mode3D = "orbita" | "dentro";

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

const T = 0.1; // espessura das paredes (m)

/** Piso procedural: tábuas de madeira (residencial) ou porcelanato (cozinha/comercial). Um quadrado que se repete. */
function useFloorTexture(tipo: Ambiente, w: number, d: number) {
  const tile = tipo === "cozinha" || tipo === "recepcao" || tipo === "loja" || tipo === "escritorio" || tipo === "sala-reuniao";
  const metres = tile ? 1.2 : 2;
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const g = c.getContext("2d")!;
    if (tile) {
      g.fillStyle = "#e4e1da"; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? "#dcd9d1" : "#e8e5de"; g.fillRect(i * 256 + 3, j * 256 + 3, 250, 250); }
    } else {
      const rows = 11, h = 512 / rows;
      for (let r = 0; r < rows; r++) {
        const off = ((r * 137) % 256) + 40;
        for (const x0 of [off - 256, off]) {
          const v = 0.92 + (((r * 7 + (x0 > 0 ? 3 : 1)) * 37) % 17) / 100;
          g.fillStyle = `rgb(${Math.round(201 * v)},${Math.round(165 * v)},${Math.round(112 * v)})`;
          g.fillRect(x0, r * h, 256, h);
          g.strokeStyle = "rgba(90,60,30,.35)"; g.lineWidth = 2; g.strokeRect(x0, r * h, 256, h);
          g.strokeStyle = "rgba(90,60,30,.10)"; g.lineWidth = 1;
          for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x0 + 4, r * h + (k * h) / 4); g.lineTo(x0 + 252, r * h + (k * h) / 4 + 1); g.stroke(); }
        }
      }
    }
    const t = new CanvasTexture(c);
    t.wrapS = t.wrapT = RepeatWrapping; t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
    return t;
  }, [tile]);
  useLayoutEffect(() => { tex.repeat.set(w / metres, d / metres); tex.needsUpdate = true; }, [tex, w, d, metres]);
  return tex;
}

type Finish = "wood" | "fabric" | "leather" | "metal" | "plain";

/** Texturas procedurais pequenas (uma vez só): veio de madeira e trama de tecido. Tons de cinza: a cor do móvel multiplica. */
const texCache: Partial<Record<"wood" | "fabric", Texture>> = {};
function baseTexture(kind: "wood" | "fabric"): Texture {
  const hit = texCache[kind]; if (hit) return hit;
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!;
  let seed = kind === "wood" ? 7 : 3;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  if (kind === "wood") {
    g.fillStyle = "#f0f0f0"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) {
      const x = rnd() * 256, a = 0.05 + rnd() * 0.16, wv = rnd() * 6 + 2, ph = rnd() * 6;
      g.strokeStyle = `rgba(70,50,30,${a})`; g.lineWidth = 0.6 + rnd() * 1.6; g.beginPath();
      for (let y = 0; y <= 256; y += 8) { const xx = x + Math.sin(y / 38 + ph) * wv; if (y === 0) g.moveTo(xx, y); else g.lineTo(xx, y); }
      g.stroke();
    }
    for (let k = 0; k < 3; k++) { // nós
      const x = rnd() * 256, y = rnd() * 256;
      for (let r = 9; r > 1; r -= 2) { g.strokeStyle = `rgba(70,50,30,${0.07 + (9 - r) * 0.012})`; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, r * 0.7, r * 2.2, 0, 0, 7); g.stroke(); }
    }
  } else {
    g.fillStyle = "#e6e6e6"; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 4) for (let x = 0; x < 256; x += 4) {
      const v = 200 + ((x / 4 + y / 4) % 2 ? 18 : 0) + rnd() * 28;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 4, 4);
    }
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping; t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  return (texCache[kind] = t);
}

function finishOf(p: Pick<Product, "category" | "material">, role: string): Finish {
  const mat = p.material.toLowerCase();
  if (role === "accent") return "metal";
  if (role === "fixed") return "plain";
  if (role === "dark") return /metal|a[cç]o|ferro/.test(mat) ? "metal" : "plain";
  const upholstered = p.category === "sofas" || p.category === "poltronas" || (p.category === "camas" && (role === "soft" || role === "light")) || (p.category === "cadeiras" && role === "soft");
  if (upholstered) return /couro/.test(mat) ? "leather" : "fabric";
  if (/madeira|mdf|bambu|laminado|carvalho|nogueira|imbuia/.test(mat)) return "wood";
  return "plain";
}

function PartMesh({ part, color, highlight, finish }: { part: Part; color: string; highlight: boolean; finish: Finish }) {
  const role = part.role ?? (part.dark ? "dark" : "main");
  const c = part.color ?? (role === "dark" ? shade(color, 0.45) : role === "soft" ? tint(color, 0.1) : role === "light" ? tint(color, 0.3) : role === "accent" ? "#c2a04a" : color);
  const kind = finish === "wood" || finish === "fabric" ? finish : null;
  const map = useMemo(() => {
    if (!kind) return null;
    const t = baseTexture(kind).clone();
    const s = kind === "wood" ? 0.7 : 0.18, [sx, sy, sz] = part.size;
    // veio da madeira corre no maior comprimento da peça; a trama repete a cada ~18 cm
    t.repeat.set(Math.max(sx, sz) / s, Math.max(sy, Math.min(sx, sz)) / s);
    if (kind === "wood" && sy > Math.max(sx, sz)) t.repeat.set(Math.max(sx, sz) / s, sy / s);
    t.needsUpdate = true;
    return t;
  }, [kind, part.size]);
  const rough = finish === "metal" ? 0.28 : finish === "leather" ? 0.5 : finish === "wood" ? 0.55 : finish === "fabric" ? 0.95 : 0.7;
  const mat = (
    <meshStandardMaterial
      color={c} map={map} bumpMap={map} bumpScale={finish === "fabric" ? 0.9 : 0.5} roughness={rough} metalness={finish === "metal" ? 0.85 : 0}
      envMapIntensity={finish === "metal" ? 1.4 : finish === "wood" ? 0.7 : 0.45}
      emissive={highlight ? "#ff8a4c" : "#000000"} emissiveIntensity={highlight ? 0.35 : 0}
    />
  );
  const min = Math.min(...part.size);
  const r = Math.min(part.r ?? 0, min / 2 - 1e-4);
  if (part.shape === "cyl") {
    const rad = part.size[0] / 2;
    return <mesh position={part.pos} castShadow receiveShadow><cylinderGeometry args={[rad, rad * 0.7, part.size[1], 14]} />{mat}</mesh>;
  }
  if (part.shape === "sphere") return <mesh position={part.pos} scale={[part.size[0] / 2, part.size[1] / 2, part.size[2] / 2]} castShadow receiveShadow><sphereGeometry args={[1, 18, 14]} />{mat}</mesh>;
  return r > 0.002
    ? <RoundedBox args={part.size} radius={r} smoothness={4} position={part.pos} castShadow receiveShadow>{mat}</RoundedBox>
    : <mesh position={part.pos} castShadow receiveShadow><boxGeometry args={part.size} />{mat}</mesh>;
}

function Furniture({ id, slug, x, y, rot, bad }: { id: string; slug: string; x: number; y: number; rot: 0 | 90 | 180 | 270; bad: boolean }) {
  const p = bySlug(slug);
  const selected = usePlanner((s) => s.selectedId === id);
  const parts = useMemo(() => (p ? partsFor(p) : []), [p]);
  if (!p) return null;
  const { position, rotationY } = worldPose({ x, y, rot });
  const main = bad ? "#c0392b" : p.colors[0].hex;
  const pick = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); usePlanner.getState().select(id); };
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={pick}>
      {parts.map((part, i) => <PartMesh key={i} part={part} color={main} highlight={selected} finish={bad ? "plain" : finishOf(p, part.role ?? (part.dark ? "dark" : "main"))} />)}
    </group>
  );
}

/** Tapete com borda e trama (textura procedural). */
function RugMesh({ rug }: { rug: Rug }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "rgba(0,0,0,.22)"; g.lineWidth = 10; g.strokeRect(14, 14, 228, 228);
    g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 3; g.strokeRect(34, 34, 188, 188);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${i % 2 ? "0,0,0" : "255,255,255"},${0.04 + (i % 7) * 0.012})`; g.fillRect((i * 97) % 256, (i * 193) % 256, 2, 1); }
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; return t;
  }, []);
  return (
    <mesh position={[rug.x / 100, 0.007, rug.y / 100]} receiveShadow>
      <boxGeometry args={[rug.w / 100, 0.014, rug.d / 100]} />
      <meshStandardMaterial color={rug.color} map={tex} bumpMap={tex} bumpScale={0.6} roughness={1} />
    </mesh>
  );
}

/** Vaso com folhagem feita de elipsoides (barato e com sombra). */
function PlantMesh({ plant }: { plant: Plant }) {
  const r = plant.r / 100, h = plant.h / 100, pot = 0.32;
  const leaves = useMemo(() => Array.from({ length: 11 }, (_, i) => {
    const a = i * 2.4, k = i / 10;
    return { pos: [Math.cos(a) * r * 0.55 * (1 - k * 0.5), pot + (h - pot) * (0.25 + 0.7 * k), Math.sin(a) * r * 0.55 * (1 - k * 0.5)] as [number, number, number], s: [0.17 - k * 0.04, 0.2, 0.09] as [number, number, number], tone: i % 3 };
  }), [r, h]);
  const greens = ["#3f6b3a", "#4f7d42", "#2f5a35"];
  return (
    <group position={[plant.x / 100, 0, plant.y / 100]}>
      <mesh position={[0, pot / 2, 0]} castShadow receiveShadow><cylinderGeometry args={[r * 0.9, r * 0.65, pot, 20]} /><meshStandardMaterial color="#b9a58b" roughness={0.8} /></mesh>
      <mesh position={[0, pot - 0.01, 0]}><cylinderGeometry args={[r * 0.82, r * 0.82, 0.02, 20]} /><meshStandardMaterial color="#3b2c20" roughness={1} /></mesh>
      <mesh position={[0, pot + (h - pot) * 0.4, 0]} castShadow><cylinderGeometry args={[0.012, 0.018, (h - pot) * 0.8, 6]} /><meshStandardMaterial color="#5b4630" roughness={0.9} /></mesh>
      {leaves.map((l, i) => (
        <mesh key={i} position={l.pos} scale={l.s} rotation={[0.4 * (i % 2 ? 1 : -1), i, 0.3]} castShadow>
          <sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={greens[l.tone]} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** Luminária pendente no centro do teto (só aparece dentro do ambiente) com luz quente suave. */
function Pendant({ w, d, h }: { w: number; d: number; h: number }) {
  return (
    <group position={[w / 2, h, d / 2]}>
      <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.006, 0.006, 0.5, 6]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[0, -0.55, 0]}><sphereGeometry args={[0.16, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#efe9dc" roughness={0.6} side={DoubleSide} emissive="#ffe2b0" emissiveIntensity={0.55} /></mesh>
      <pointLight position={[0, -0.6, 0]} intensity={2.2} distance={Math.max(w, d) * 1.6} decay={1.6} color="#ffe2bd" />
    </group>
  );
}

/** Referencial local do vão: z = para dentro do ambiente, origem na linha interna da parede. */
function openingPose(o: Opening, room: Plan["room"]) {
  const f = wallFrame(o.wall, room);
  const yaw = Math.atan2(f.inward[0], f.inward[1]);
  const lx: [number, number] = [Math.cos(yaw), -Math.sin(yaw)]; // eixo x local no plano (x, z)
  const along = (f.dir[0] * lx[0] + f.dir[1] * lx[1]) >= 0 ? 1 : -1; // +1 se x local anda no sentido da parede
  return { position: [(f.origin[0] + f.dir[0] * o.at) / 100, 0, (f.origin[1] + f.dir[1] * o.at) / 100] as [number, number, number], yaw, along };
}

function Door3D({ o, room }: { o: Opening; room: Plan["room"] }) {
  const { position, yaw, along } = openingPose(o, room);
  const w = o.w / 100, h = DOOR_H / 100;
  const hinge = (o.flip ? 1 : -1) * along; // lado da dobradiça em x local (-1 ou +1)
  const open = (hinge * 80 * Math.PI) / 180;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {[-1, 1].map((s) => <mesh key={s} position={[s * (w / 2 + 0.025), h / 2, -T / 2]} castShadow><boxGeometry args={[0.05, h, T + 0.02]} /><meshStandardMaterial color="#efe9dc" roughness={0.7} /></mesh>)}
      <mesh position={[0, h + 0.025, -T / 2]} castShadow><boxGeometry args={[w + 0.1, 0.05, T + 0.02]} /><meshStandardMaterial color="#efe9dc" roughness={0.7} /></mesh>
      <group position={[hinge * (w / 2), 0, -0.02]} rotation={[0, open, 0]}>
        <mesh position={[-hinge * (w / 2 - 0.005), h / 2, 0]} castShadow receiveShadow><boxGeometry args={[w - 0.01, h - 0.02, 0.04]} /><meshStandardMaterial color="#c9a57a" roughness={0.6} /></mesh>
        <mesh position={[-hinge * (w - 0.08), h * 0.48, 0.03]}><boxGeometry args={[0.12, 0.025, 0.03]} /><meshStandardMaterial color="#b08d3c" metalness={0.7} roughness={0.3} /></mesh>
      </group>
    </group>
  );
}

function Window3D({ o, room }: { o: Opening; room: Plan["room"] }) {
  const { position, yaw } = openingPose(o, room);
  const w = o.w / 100, h = WINDOW_H / 100, y = WINDOW_SILL / 100 + h / 2, fr = 0.04;
  const white = <meshStandardMaterial color="#f3f0ea" roughness={0.6} />;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, y, -T / 2]}><boxGeometry args={[w - 0.02, h - 0.02, 0.012]} /><meshPhysicalMaterial color="#bfe0f0" transparent opacity={0.28} roughness={0.05} side={DoubleSide} depthWrite={false} /></mesh>
      {[-1, 1].map((s) => <mesh key={`v${s}`} position={[s * (w / 2 - fr / 2), y, -T / 2]} castShadow><boxGeometry args={[fr, h, T * 0.7]} />{white}</mesh>)}
      {[-1, 1].map((s) => <mesh key={`h${s}`} position={[0, y + s * (h / 2 - fr / 2), -T / 2]} castShadow><boxGeometry args={[w, fr, T * 0.7]} />{white}</mesh>)}
      <mesh position={[0, y, -T / 2]}><boxGeometry args={[fr / 2, h, T * 0.5]} />{white}</mesh>
      <mesh position={[0, WINDOW_SILL / 100 - 0.01, 0.02]} castShadow receiveShadow><boxGeometry args={[w + 0.1, 0.03, T + 0.06]} />{white}</mesh>
    </group>
  );
}

/** Parede com vãos recortados. Em "visão geral", as paredes voltadas para a câmera ficam quase transparentes (corte de maquete). */
function WallMesh({ wall, plan, color, fade, camCenter }: { wall: Wall; plan: Plan; color: string; fade: boolean; camCenter: [number, number] }) {
  const f = wallFrame(wall, plan.room);
  const ops = (plan.openings ?? []).filter((o) => o.wall === wall);
  const h = plan.room.h ?? 260;
  const pieces = useMemo(() => wallPieces(f.len, h, ops), [f.len, h, ops]);
  const ref = useRef<Group>(null);
  const horiz = f.dir[0] !== 0;
  const out: [number, number] = [-f.inward[0], -f.inward[1]];
  useFrame(({ camera }) => {
    const g = ref.current; if (!g) return;
    const facing = fade && ((camera.position.x - camCenter[0]) * out[0] + (camera.position.z - camCenter[1]) * out[1]) > 0.35;
    g.traverse((n) => {
      const m = (n as unknown as { material?: Material & { opacity: number } }).material;
      if (m && !(n as { userData: { keep?: boolean } }).userData.keep) { m.transparent = true; m.opacity = facing ? 0.1 : 1; m.depthWrite = !facing; }
    });
  });
  return (
    <group ref={ref}>
      {pieces.map((p, i) => {
        const along = (p.from + p.to) / 2, len = p.to - p.from;
        const px = f.origin[0] / 100 + f.dir[0] * along + out[0] * (T / 2), pz = f.origin[1] / 100 + f.dir[1] * along + out[1] * (T / 2);
        return (
          <mesh key={i} position={[px, (p.y0 + p.y1) / 2, pz]} castShadow receiveShadow>
            <boxGeometry args={horiz ? [len, p.y1 - p.y0, T] : [T, p.y1 - p.y0, len]} />
            <meshStandardMaterial color={color} roughness={0.95} />
          </mesh>
        );
      })}
      {pieces.filter((p) => p.y0 === 0 && p.y1 > 0.2).map((p, i) => {
        const along = (p.from + p.to) / 2, len = p.to - p.from;
        const px = f.origin[0] / 100 + f.dir[0] * along + f.inward[0] * 0.0075, pz = f.origin[1] / 100 + f.dir[1] * along + f.inward[1] * 0.0075;
        return (
          <mesh key={`b${i}`} position={[px, 0.045, pz]} receiveShadow>
            <boxGeometry args={horiz ? [len, 0.09, 0.015] : [0.015, 0.09, len]} />
            <meshStandardMaterial color="#f7f4ee" roughness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

function Room({ plan, wall, inside }: { plan: Plan; wall: WallColor; inside: boolean }) {
  const w = plan.room.w / 100, d = plan.room.d / 100, h = (plan.room.h ?? 260) / 100;
  const floor = useFloorTexture(plan.room.tipo, w, d);
  const openings = plan.openings ?? [];
  const decor = useMemo(() => decorFor(plan), [plan]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[w / 2, 0, d / 2]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={floor} bumpMap={floor} bumpScale={0.4} roughness={0.5} envMapIntensity={0.6} />
      </mesh>
      {decor.rug && <RugMesh rug={decor.rug} />}
      {decor.plants.map((pl, i) => <PlantMesh key={i} plant={pl} />)}
      {inside && <Pendant w={w} d={d} h={h} />}
      {inside && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[w / 2, h, d / 2]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#fbf9f4" roughness={1} side={DoubleSide} />
        </mesh>
      )}
      {WALLS.map((k) => <WallMesh key={k} wall={k} plan={plan} color={WALL_COLORS[wall]} fade={!inside} camCenter={[w / 2, d / 2]} />)}
      {openings.map((o) => (o.kind === "porta" ? <Door3D key={o.id} o={o} room={plan.room} /> : <Window3D key={o.id} o={o} room={plan.room} />))}
    </group>
  );
}

/** Luz principal com sombras suaves, mirando o centro do ambiente. */
function Sun({ w, d, big }: { w: number; d: number; big: number }) {
  const ref = useRef<DirectionalLight>(null);
  useLayoutEffect(() => { const l = ref.current; if (l) { l.target.position.set(w / 2, 0, d / 2); l.target.updateMatrixWorld(); } }, [w, d]);
  return (
    <directionalLight
      ref={ref} position={[w * 0.85, 4.2, d * 0.35]} intensity={1.05} castShadow
      shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02}
      shadow-camera-left={-big} shadow-camera-right={big} shadow-camera-top={big} shadow-camera-bottom={-big} shadow-camera-near={0.5} shadow-camera-far={16}
    />
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
      <Canvas key={`${mode}:${plan.room.w}x${plan.room.d}`} shadows="soft" frameloop="demand" dpr={[1, 1.5]} camera={camera} gl={{ antialias: true, powerPreference: "low-power" }} aria-label="Visualização 3D do ambiente"
        onPointerMissed={() => usePlanner.getState().select(null)}>
        <color attach="background" args={[inside ? WALL_COLORS[wall] : "#efe9dc"]} />
        {/* reflexos de um "estúdio" feito de painéis de luz (nada é baixado da internet) */}
        <Environment resolution={256} frames={1} environmentIntensity={0.65}>
          <color attach="background" args={["#d9d2c3"]} />
          <Lightformer form="rect" intensity={3.2} color="#fff4e0" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
          <Lightformer form="rect" intensity={2.2} color="#dfeaff" position={[-8, 3, 2]} rotation-y={Math.PI / 2} scale={[8, 5, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[7, 2, -4]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
        </Environment>
        <ambientLight intensity={0.25} />
        <hemisphereLight args={["#ffffff", "#cfc4ad", 0.4]} />
        <Sun w={w} d={d} big={big} />
        <directionalLight position={[-w, 3, d * 1.4]} intensity={0.35} />
        <Room plan={plan} wall={wall} inside={inside} />
        {plan.items.map((it) => <Furniture key={it.id} id={it.id} slug={it.slug} x={it.x} y={it.y} rot={it.rot} bad={errorIds.has(it.id)} />)}
        {inside
          ? <OrbitControls target={target} enableZoom={false} enablePan={false} rotateSpeed={-0.45} minPolarAngle={0.35} maxPolarAngle={Math.PI - 0.5} />
          : <OrbitControls target={target} enablePan={false} minDistance={1.2} maxDistance={big * 3} maxPolarAngle={Math.PI / 2 - 0.05} />}
      </Canvas>
    </Boundary>
  );
}
