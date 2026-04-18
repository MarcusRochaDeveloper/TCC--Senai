import { useRef, useState, useCallback, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

// ─── Types ───
interface ThreeDViewerProps {
  /** URL to a .glb/.gltf model file (null = demo scene) */
  modelUrl?: string | null
  /** Title override */
  title?: string
}

interface ExplodedState {
  active: boolean
  factor: number
}

// ─── DRACO Loader singleton (requirement: async decompression) ───
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')



// ─── Main Component ───
export default function ThreeDViewer({ modelUrl, title }: ThreeDViewerProps) {
  const [exploded, setExploded] = useState<ExplodedState>({ active: false, factor: 0 })
  const [wireframe, setWireframe] = useState(false)
  const [fps, setFps] = useState(0)
  const [modelInfo, setModelInfo] = useState({ vertices: 0, faces: 0 })
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null)

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }, [])

  const handleToggleExplode = useCallback(() => {
    setExploded((prev) => ({
      active: !prev.active,
      factor: prev.active ? 0 : 1.5,
    }))
  }, [])

  const handleToggleWireframe = useCallback(() => {
    setWireframe((prev) => !prev)
  }, [])

  return (
    <section id="three-viewer-panel" className="panel-placeholder three-panel animate-fade-in">
      {/* Panel header */}
      <div className="panel-header">
        <div className="panel-header-left">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" stroke="var(--color-accent-blue)" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M10 18V12M10 12L2 7M10 12L18 7" stroke="var(--color-accent-blue)" strokeWidth="1" opacity="0.5" />
          </svg>
          <span className="panel-title">{title || 'Modelo 3D — Parte Ativa'}</span>
        </div>
        <div className="panel-header-right">
          <span className="panel-badge">Three.js</span>
          <span className="panel-badge badge-webgl">WebGL</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="three-canvas-container">
        <Canvas
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          camera={{ position: [5, 4, 6], fov: 45, near: 0.1, far: 1000 }}
          dpr={[1, 2]}
          onCreated={({ gl }) => {
            gl.setClearColor(new THREE.Color('#0a0a0f'), 1)
          }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <SceneSetup />
            <IndustrialLighting />

            {modelUrl ? (
              <GLTFModel
                url={modelUrl}
                explodeFactor={exploded.factor}
                wireframe={wireframe}
                onModelInfo={setModelInfo}
              />
            ) : (
              <DemoTransformerModel
                explodeFactor={exploded.factor}
                wireframe={wireframe}
                onModelInfo={setModelInfo}
              />
            )}

            <IndustrialGrid />

            {/* OrbitControls: requirement — min/max zoom limits */}
            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.08}
              minDistance={2}
              maxDistance={30}
              minPolarAngle={0.1}
              maxPolarAngle={Math.PI / 2 + 0.3}
              enablePan
              panSpeed={0.5}
            />
          </Suspense>

          <FPSCounter onFpsUpdate={setFps} />
        </Canvas>
      </div>

      {/* Control toolbar */}
      <div className="three-controls-bar">
        <div className="three-controls">
          <button
            id="btn-rotate"
            className="industrial-btn btn-control"
            onClick={handleResetCamera}
            title="Resetar câmera para posição inicial"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10a6 6 0 1111-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M4 4v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Reset
          </button>
          <button
            id="btn-explode"
            className={`industrial-btn btn-control ${exploded.active ? 'btn-control-active' : ''}`}
            onClick={handleToggleExplode}
            title="Explodir/Recompor peças do modelo"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="12" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Explodir
          </button>
          <button
            id="btn-wireframe"
            className={`industrial-btn btn-control ${wireframe ? 'btn-control-active' : ''}`}
            onClick={handleToggleWireframe}
            title="Alternar modo wireframe"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            </svg>
            Wireframe
          </button>
        </div>

        <div className="model-info">
          <span className="model-tag">▲ {modelInfo.vertices.toLocaleString('pt-BR')}</span>
          <span className="model-tag">◆ {modelInfo.faces.toLocaleString('pt-BR')}</span>
          <span className="model-tag">{modelUrl ? 'glTF / GLB' : 'Procedural'}</span>
          <span className="fps-counter">{fps} FPS</span>
        </div>
      </div>
    </section>
  )
}

// ─── Scene Setup ───
function SceneSetup() {
  const { scene } = useThree()
  useEffect(() => {
    scene.fog = new THREE.FogExp2('#0a0a0f', 0.03)
  }, [scene])
  return null
}

// ─── Industrial Lighting ───
function IndustrialLighting() {
  return (
    <>
      <ambientLight intensity={0.3} color="#b0c4de" />
      <directionalLight position={[8, 12, 6]} intensity={1.5} color="#ffffff" castShadow />
      <directionalLight position={[-5, 8, -4]} intensity={0.5} color="#4a8cff" />
      <pointLight position={[0, 6, 0]} intensity={0.8} color="#f59e0b" distance={20} />
      <Environment preset="warehouse" environmentIntensity={0.2} />
    </>
  )
}

// ─── Loading Fallback (displayed inside Canvas) ───
function LoadingFallback() {
  return (
    <Html center>
      <div className="three-loading-fallback">
        <div className="pdf-spinner" />
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 12 }}>
          Carregando modelo 3D...
        </span>
      </div>
    </Html>
  )
}

// ─── Industrial Grid Floor ───
function IndustrialGrid() {
  return (
    <group>
      <gridHelper args={[20, 20, '#2a2a3d', '#1a1a26']} position={[0, -0.01, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0d0d15" transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

// ─── FPS Counter ───
function FPSCounter({ onFpsUpdate }: { onFpsUpdate: (fps: number) => void }) {
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())

  useFrame(() => {
    frameCount.current++
    const now = performance.now()
    if (now - lastTime.current >= 1000) {
      onFpsUpdate(frameCount.current)
      frameCount.current = 0
      lastTime.current = now
    }
  })

  return null
}

// ═══════════════════════════════════════════════════
// DEMO TRANSFORMER MODEL (procedural, no file needed)
// ═══════════════════════════════════════════════════

interface DemoModelProps {
  explodeFactor: number
  wireframe: boolean
  onModelInfo: (info: { vertices: number; faces: number }) => void
}

function DemoTransformerModel({ explodeFactor, wireframe, onModelInfo }: DemoModelProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Slow auto-rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1
    }
  })

  // Report model stats
  useEffect(() => {
    if (groupRef.current) {
      let vertices = 0
      let faces = 0
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const geo = child.geometry
          vertices += geo.attributes.position?.count || 0
          faces += geo.index ? geo.index.count / 3 : (geo.attributes.position?.count || 0) / 3
        }
      })
      onModelInfo({ vertices: Math.round(vertices), faces: Math.round(faces) })
    }
  }, [onModelInfo])

  // Industrial material factory
  const metalMat = (
    <meshStandardMaterial
      color="#5a6a7a"
      metalness={0.85}
      roughness={0.25}
      wireframe={wireframe}
    />
  )

  const copperMat = (
    <meshStandardMaterial
      color="#b87333"
      metalness={0.9}
      roughness={0.3}
      wireframe={wireframe}
    />
  )

  const coreMat = (
    <meshStandardMaterial
      color="#3a4050"
      metalness={0.7}
      roughness={0.4}
      wireframe={wireframe}
    />
  )

  const insulatorMat = (
    <meshStandardMaterial
      color="#c4a35a"
      metalness={0.1}
      roughness={0.7}
      wireframe={wireframe}
    />
  )

  const ef = explodeFactor // shorthand

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {/* ─── Tank (outer shell) ─── */}
      <mesh position={[0, 0 - ef * 0.3, 0]} castShadow>
        <boxGeometry args={[3.2, 2.8, 2.2]} />
        {metalMat}
      </mesh>

      {/* ─── Core (laminated steel) ─── */}
      <group position={[0, 0 + ef * 0.4, 0]}>
        {/* Core columns */}
        <mesh position={[-0.7, 0, 0]} castShadow>
          <boxGeometry args={[0.35, 2.2, 1.4]} />
          {coreMat}
        </mesh>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.35, 2.2, 1.4]} />
          {coreMat}
        </mesh>
        <mesh position={[0.7, 0, 0]} castShadow>
          <boxGeometry args={[0.35, 2.2, 1.4]} />
          {coreMat}
        </mesh>
        {/* Core yokes (top and bottom) */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[2, 0.3, 1.4]} />
          {coreMat}
        </mesh>
        <mesh position={[0, -1.1, 0]} castShadow>
          <boxGeometry args={[2, 0.3, 1.4]} />
          {coreMat}
        </mesh>
      </group>

      {/* ─── HV Windings (copper cylinders) ─── */}
      <group position={[0, 0 + ef * 0.8, 0]}>
        {[-0.7, 0, 0.7].map((x, i) => (
          <mesh key={`hv-${i}`} position={[x, 0, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.45, 1.8, 24]} />
            {copperMat}
          </mesh>
        ))}
      </group>

      {/* ─── LV Windings (inner copper cylinders) ─── */}
      <group position={[0, 0 + ef * 1.2, 0]}>
        {[-0.7, 0, 0.7].map((x, i) => (
          <mesh key={`lv-${i}`} position={[x, 0, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 1.6, 24]} />
            {copperMat}
          </mesh>
        ))}
      </group>

      {/* ─── Bushings (HV side, top) ─── */}
      <group position={[0, 1.8 + ef * 1.6, 0]}>
        {[-0.7, 0, 0.7].map((x, i) => (
          <group key={`bush-${i}`} position={[x, 0, 0]}>
            {/* Insulator body */}
            <mesh position={[0, 0.6, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.12, 1.2, 12]} />
              {insulatorMat}
            </mesh>
            {/* Insulator rings */}
            {[0.2, 0.5, 0.8].map((y, j) => (
              <mesh key={`ring-${j}`} position={[0, y, 0]}>
                <torusGeometry args={[0.13, 0.02, 8, 16]} />
                <meshStandardMaterial color="#c4a35a" metalness={0.1} roughness={0.6} wireframe={wireframe} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ─── Radiator fins (sides) ─── */}
      <group position={[0, 0 - ef * 0.6, 1.3 + ef * 0.5]}>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={`rad-f-${i}`} position={[-1.2 + i * 0.6, 0, 0]} castShadow>
            <boxGeometry args={[0.04, 2, 0.5]} />
            {metalMat}
          </mesh>
        ))}
      </group>
      <group position={[0, 0 - ef * 0.6, -1.3 - ef * 0.5]}>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={`rad-b-${i}`} position={[-1.2 + i * 0.6, 0, 0]} castShadow>
            <boxGeometry args={[0.04, 2, 0.5]} />
            {metalMat}
          </mesh>
        ))}
      </group>

      {/* ─── Conservator tank (top) ─── */}
      <mesh position={[0, 2.2 + ef * 2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 2.5, 16]} />
        {metalMat}
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════
// GLTF MODEL LOADER (with DRACO decompression)
// ═══════════════════════════════════════════════════

interface GLTFModelProps {
  url: string
  explodeFactor: number
  wireframe: boolean
  onModelInfo: (info: { vertices: number; faces: number }) => void
}

function GLTFModel({ url, explodeFactor, wireframe, onModelInfo }: GLTFModelProps) {
  const { scene } = useGLTF(url, true, true, (loader) => {
    // Attach DRACO loader for compressed models
    if ('setDRACOLoader' in loader) {
      (loader as { setDRACOLoader: (l: DRACOLoader) => void }).setDRACOLoader(dracoLoader)
    }
  })

  const clonedScene = useRef<THREE.Group | null>(null)

  useEffect(() => {
    // Clone scene so original isn't mutated
    const clone = scene.clone(true)
    clonedScene.current = clone

    // Compute stats
    let vertices = 0
    let faces = 0
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        vertices += child.geometry.attributes.position?.count || 0
        faces += child.geometry.index
          ? child.geometry.index.count / 3
          : (child.geometry.attributes.position?.count || 0) / 3
      }
    })
    onModelInfo({ vertices: Math.round(vertices), faces: Math.round(faces) })

    // Requirement: dispose() for memory management when OP is closed
    return () => {
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material]
            materials.forEach((mat) => {
              mat.dispose()
              // Dispose textures
              for (const key of Object.keys(mat)) {
                const value = (mat as Record<string, unknown>)[key]
                if (value instanceof THREE.Texture) {
                  value.dispose()
                }
              }
            })
          }
        }
      })
    }
  }, [scene, onModelInfo])

  // Apply wireframe + explode
  useEffect(() => {
    if (!clonedScene.current) return

    const centers: THREE.Vector3[] = []
    const meshes: THREE.Mesh[] = []

    clonedScene.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child)
        // Apply wireframe
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material]
          mats.forEach((mat) => {
            if ('wireframe' in mat) {
              ;(mat as THREE.MeshStandardMaterial).wireframe = wireframe
            }
          })
        }
        // Compute center for explosion
        child.geometry.computeBoundingBox()
        const center = new THREE.Vector3()
        child.geometry.boundingBox?.getCenter(center)
        child.localToWorld(center)
        centers.push(center)
      }
    })

    if (meshes.length > 0 && explodeFactor > 0) {
      const sceneCenter = new THREE.Vector3()
      centers.forEach((c) => sceneCenter.add(c))
      sceneCenter.divideScalar(centers.length)

      meshes.forEach((mesh, idx) => {
        const dir = centers[idx].clone().sub(sceneCenter).normalize()
        mesh.position.add(dir.multiplyScalar(explodeFactor))
      })
    }
  }, [wireframe, explodeFactor])

  return clonedScene.current ? <primitive object={clonedScene.current} /> : null
}

// Preload helper for glTF
useGLTF.preload
