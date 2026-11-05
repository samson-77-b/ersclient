import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VehicleTwinStatus, WorkflowState, DataSourceMode } from '../../types';
import { Car, Eye, Maximize2, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface VehicleTwinViewProps {
  status: VehicleTwinStatus;
  workflowState: WorkflowState;
  speedKph: number;
  sourceMode: DataSourceMode;
  hazards: string[];
  accelerationG: number;
}

export const VehicleTwinView: React.FC<VehicleTwinViewProps> = ({
  status,
  workflowState,
  speedKph,
  sourceMode,
  hazards,
  accelerationG
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cameraView, setCameraView] = useState<'orbit' | 'isometric' | 'top' | 'cabin'>('isometric');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const wheelsRef = useRef<THREE.Mesh[]>([]);
  const roadGridRef = useRef<THREE.GridHelper | null>(null);
  const beaconLightRef = useRef<THREE.PointLight | null>(null);
  const smokeParticlesRef = useRef<THREE.Points | null>(null);
  const impactRingRef = useRef<THREE.Mesh | null>(null);

  // Mouse interaction for orbit
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const orbitAnglesRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 5, radius: 14 });

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(10, 8, 10);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x475569, 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Cyan underglow
    const underglowLight = new THREE.PointLight(0x06b6d4, 2.5, 8);
    underglowLight.position.set(0, 0.2, 0);
    scene.add(underglowLight);

    // Emergency beacon point light (blue/red flasher)
    const beaconLight = new THREE.PointLight(0xef4444, 0, 15);
    beaconLight.position.set(0, 2.8, 0);
    scene.add(beaconLight);
    beaconLightRef.current = beaconLight;

    // 5. Road Ground and Grid
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.85,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const roadGrid = new THREE.GridHelper(60, 30, 0x0284c7, 0x1e293b);
    roadGrid.position.y = 0.02;
    scene.add(roadGrid);
    roadGridRef.current = roadGrid;

    // 6. Build High-Detail Procedural Vehicle
    const carGroup = new THREE.Group();
    carGroupRef.current = carGroup;

    // Vehicle Chassis (Body)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
      envMapIntensity: 1.0
    });
    const bodyGeo = new THREE.BoxGeometry(2.3, 0.8, 4.6);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);

    // Cabin / Roof Glass
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.9
    });
    const cabinGeo = new THREE.BoxGeometry(1.9, 0.75, 2.5);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.5, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Roof Top Shell
    const roofTopGeo = new THREE.BoxGeometry(1.8, 0.1, 2.2);
    const roofTop = new THREE.Mesh(roofTopGeo, bodyMat);
    roofTop.position.set(0, 1.9, -0.2);
    carGroup.add(roofTop);

    // Emergency Roof Strobe Housing
    const beaconBoxGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.18, 12);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xaa0000,
      emissiveIntensity: 0.6
    });
    const beaconMesh = new THREE.Mesh(beaconBoxGeo, beaconMat);
    beaconMesh.position.set(0, 2.05, -0.2);
    carGroup.add(beaconMesh);

    // Headlights (Front is +Z)
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.0
    });
    const leftHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), headlightMat);
    leftHeadlight.position.set(-0.8, 0.8, 2.3);
    const rightHeadlight = leftHeadlight.clone();
    rightHeadlight.position.x = 0.8;
    carGroup.add(leftHeadlight);
    carGroup.add(rightHeadlight);

    // Taillights (Rear is -Z)
    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.8
    });
    const leftTail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.1), taillightMat);
    leftTail.position.set(-0.8, 0.85, -2.3);
    const rightTail = leftTail.clone();
    rightTail.position.x = 0.8;
    carGroup.add(leftTail);
    carGroup.add(rightTail);

    // Wheels (4)
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 20);
    wheelGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });

    const wheelPositions = [
      [-1.15, 0.45, 1.4],  // Front Left
      [1.15, 0.45, 1.4],   // Front Right
      [-1.15, 0.45, -1.4], // Rear Left
      [1.15, 0.45, -1.4]   // Rear Right
    ];

    wheelsRef.current = [];
    wheelPositions.forEach(([x, y, z]) => {
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.position.set(x, y, z);
      tire.castShadow = true;

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.36, 10), rimMat);
      rim.rotateZ(Math.PI / 2);
      tire.add(rim);

      carGroup.add(tire);
      wheelsRef.current.push(tire);
    });

    // Impact Shockwave Ring (initially hidden)
    const ringGeo = new THREE.RingGeometry(1.5, 2.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const impactRing = new THREE.Mesh(ringGeo, ringMat);
    impactRing.position.y = 0.05;
    scene.add(impactRing);
    impactRingRef.current = impactRing;

    // Hazard Smoke Particles
    const particleCount = 70;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 1.5;
      positions[i + 1] = 1.0 + Math.random() * 2.5;
      positions[i + 2] = 1.0 + (Math.random() - 0.5) * 1.5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf97316,
      size: 0.3,
      transparent: true,
      opacity: 0
    });
    const smokeParticles = new THREE.Points(particleGeo, particleMat);
    carGroup.add(smokeParticles);
    smokeParticlesRef.current = smokeParticles;

    scene.add(carGroup);

    // 7. Mouse Orbit Controls
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      orbitAnglesRef.current.theta -= dx * 0.01;
      orbitAnglesRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2.2, orbitAnglesRef.current.phi - dy * 0.01));
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      orbitAnglesRef.current.radius = Math.max(5, Math.min(25, orbitAnglesRef.current.radius + e.deltaY * 0.02));
      e.preventDefault();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Camera positioning based on view mode
      if (cameraRef.current) {
        if (cameraView === 'isometric') {
          const { theta, phi, radius } = orbitAnglesRef.current;
          cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
          cameraRef.current.position.y = radius * Math.cos(phi);
          cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
          cameraRef.current.lookAt(0, 1, 0);
        } else if (cameraView === 'top') {
          cameraRef.current.position.set(0, 16, 0.01);
          cameraRef.current.lookAt(0, 0, 0);
        } else if (cameraView === 'cabin') {
          cameraRef.current.position.set(0, 1.4, 0.3);
          cameraRef.current.lookAt(0, 1.4, 6);
        } else {
          // Orbit slow auto-rotate
          orbitAnglesRef.current.theta += 0.003;
          const { theta, phi, radius } = orbitAnglesRef.current;
          cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
          cameraRef.current.position.y = radius * Math.cos(phi);
          cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
          cameraRef.current.lookAt(0, 1, 0);
        }
      }

      // Wheels rotation and road scroll if moving
      const isMoving = speedKph > 1 && status !== 'impact_detected';
      if (isMoving) {
        const wheelRotSpeed = (speedKph / 30) * 0.3;
        wheelsRef.current.forEach((w) => {
          w.rotation.x += wheelRotSpeed;
        });

        if (roadGridRef.current) {
          roadGridRef.current.position.z = (roadGridRef.current.position.z - (speedKph / 50) * 0.2) % 2;
        }
      }

      // Dynamic Twin Visual States
      if (carGroupRef.current) {
        if (status === 'impact_detected') {
          // Impact shake
          carGroupRef.current.position.x = (Math.random() - 0.5) * 0.15;
          carGroupRef.current.position.y = (Math.random() - 0.5) * 0.15;
          carGroupRef.current.rotation.z = (Math.random() - 0.5) * 0.1;

          // Impact shockwave ring pulse
          if (impactRingRef.current) {
            impactRingRef.current.scale.setScalar(1 + (elapsedTime % 1.2) * 2.5);
            (impactRingRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
              0,
              1 - (elapsedTime % 1.2)
            );
          }
        } else {
          carGroupRef.current.position.set(0, 0, 0);
          carGroupRef.current.rotation.z = 0;
          if (impactRingRef.current) {
            (impactRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
          }
        }
      }

      // Beacon flasher during emergency
      if (beaconLightRef.current) {
        if (status === 'emergency_active' || status === 'hazard_detected' || status === 'impact_detected') {
          const flash = Math.sin(elapsedTime * 12) > 0;
          beaconLightRef.current.intensity = flash ? 3.5 : 0.2;
          beaconLightRef.current.color.setHex(flash ? 0xef4444 : 0x0284c7);
        } else if (status === 'resolved') {
          beaconLightRef.current.intensity = 1.0;
          beaconLightRef.current.color.setHex(0x10b981); // Solid green
        } else {
          beaconLightRef.current.intensity = 0;
        }
      }

      // Smoke particles if hazard detected
      if (smokeParticlesRef.current) {
        const hasSmoke = hazards.includes('smoke') || hazards.includes('fire') || status === 'hazard_detected';
        const mat = smokeParticlesRef.current.material as THREE.PointsMaterial;
        if (hasSmoke) {
          mat.opacity = 0.85;
          mat.color.setHex(hazards.includes('fire') ? 0xef4444 : 0xf97316);
          const pos = smokeParticlesRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 1; i < pos.length; i += 3) {
            pos[i] += 0.04;
            if (pos[i] > 3.8) {
              pos[i] = 1.0;
            }
          }
          smokeParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        } else {
          mat.opacity = 0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 420;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [cameraView]);

  // Status badge color & text
  const getStatusBadge = () => {
    switch (status) {
      case 'driving':
        return { text: 'Vehicle Driving', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40', icon: Car };
      case 'impact_detected':
        return { text: 'Impact Detected', bg: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse', icon: AlertTriangle };
      case 'hazard_detected':
        return { text: 'Hazard Detected', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: AlertTriangle };
      case 'emergency_active':
        return { text: 'Emergency Active', bg: 'bg-red-600/30 text-red-300 border-red-500 animate-pulse', icon: AlertTriangle };
      case 'resolved':
        return { text: 'Incident Resolved', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: ShieldCheck };
      default:
        return { text: 'Standby / Idle', bg: 'bg-slate-700/40 text-slate-400 border-slate-600', icon: Car };
    }
  };

  const badge = getStatusBadge();
  const BadgeIcon = badge.icon;

  return (
    <div className="relative w-full h-[430px] rounded-xl overflow-hidden bg-gradient-to-b from-[#0c1222] to-[#070a14] border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Overlay Header */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center space-x-2 pointer-events-auto">
          <div className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 shadow">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>3D Digital Twin View</span>
          </div>

          <div className={`px-2.5 py-1 rounded-md text-xs font-bold border backdrop-blur-md flex items-center space-x-1.5 shadow ${badge.bg}`}>
            <BadgeIcon className="w-3.5 h-3.5" />
            <span>{badge.text}</span>
          </div>
        </div>

        {/* Camera Views Selector */}
        <div className="flex items-center space-x-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 pointer-events-auto shadow">
          <button
            onClick={() => setCameraView('isometric')}
            className={`px-2 py-0.5 text-xs rounded font-medium transition ${cameraView === 'isometric' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Iso 3D
          </button>
          <button
            onClick={() => setCameraView('orbit')}
            className={`px-2 py-0.5 text-xs rounded font-medium transition ${cameraView === 'orbit' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Orbit
          </button>
          <button
            onClick={() => setCameraView('top')}
            className={`px-2 py-0.5 text-xs rounded font-medium transition ${cameraView === 'top' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Top-Down
          </button>
          <button
            onClick={() => setCameraView('cabin')}
            className={`px-2 py-0.5 text-xs rounded font-medium transition ${cameraView === 'cabin' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Cabin
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Bottom Info HUD */}
      <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between pointer-events-none text-xs text-slate-400">
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex items-center space-x-4">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Speed</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">{speedKph.toFixed(0)} km/h</span>
          </div>
          <div className="border-l border-slate-700/50 pl-3">
            <span className="text-slate-500 block text-[10px] uppercase">Peak Load</span>
            <span className={`font-mono font-bold text-sm ${accelerationG > 4.0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {accelerationG.toFixed(1)} G
            </span>
          </div>
          <div className="border-l border-slate-700/50 pl-3">
            <span className="text-slate-500 block text-[10px] uppercase">Workflow Stage</span>
            <span className="font-mono font-semibold text-slate-200">{workflowState}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800 text-[11px] text-slate-400">
          Source: <span className="font-bold uppercase text-cyan-400">[{sourceMode}]</span> • Click & drag to rotate
        </div>
      </div>
    </div>
  );
};

