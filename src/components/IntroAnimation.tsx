import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import logoAgency from '../img/logo_agency.png';
import './IntroAnimation.css';

/** Paleta Agency 360 (fuchsia, naranja, cyan, rose, violeta, ámbar) */
const CORP_COLORS = [
  0xd946ef, // Fuchsia — frente
  0x06b6d4, // Cyan — atrás
  0xf97316, // Naranja — arriba
  0xf43f5e, // Rose — abajo
  0x8b5cf6, // Violeta — derecha
  0xf59e0b, // Ámbar — izquierda
] as const;

const FACE_SETUP: { position: [number, number, number]; rotation: [number, number, number] }[] = [
  { position: [0.6, 0, 0], rotation: [0, Math.PI / 2, -Math.PI / 2] },
  { position: [-0.6, 0, 0], rotation: [0, -Math.PI / 2, Math.PI / 2] },
  { position: [0, 0.6, 0], rotation: [0, 0, 0] },
  { position: [0, -0.6, 0], rotation: [Math.PI, 0, 0] },
  { position: [0, 0, 0.6], rotation: [Math.PI / 2, 0, 0] },
  { position: [0, 0, -0.6], rotation: [-Math.PI / 2, 0, 0] },
];

export interface IntroAnimationProps {
  onComplete?: () => void;
  enableSkip?: boolean;
}

function createPyramid(color: number): THREE.Mesh {
  const geometry = new THREE.ConeGeometry(1.15, 1.8, 3);
  const material = new THREE.MeshPhongMaterial({
    color,
    flatShading: true,
    shininess: 90,
    specular: 0x333333,
  });
  return new THREE.Mesh(geometry, material);
}

function assignSFormation(triangles: THREE.Mesh[]) {
  const sPositions = [
    new THREE.Vector3(-1.0, 1.2, 0.0),
    new THREE.Vector3(1.0, 0.7, 0.0),
    new THREE.Vector3(-1.2, -0.7, 0.0),
    new THREE.Vector3(1.2, -1.2, 0.0),
    new THREE.Vector3(-0.2, 0.3, 0.0),
    new THREE.Vector3(0.2, -0.3, 0.0),
  ];

  const sRotations = [
    new THREE.Euler(0, 0, Math.PI / 3),
    new THREE.Euler(0, 0, -Math.PI / 8),
    new THREE.Euler(0, 0, Math.PI / 6),
    new THREE.Euler(0, 0, -Math.PI / 4),
    new THREE.Euler(0, 0, Math.PI / 5),
    new THREE.Euler(0, 0, -Math.PI / 6),
  ];

  triangles.forEach((mesh, index) => {
    mesh.userData.sPosition = sPositions[index];
    mesh.userData.sRotation = sRotations[index];
  });
}

export default function IntroAnimation({ onComplete, enableSkip = true }: IntroAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const [showButton, setShowButton] = useState(false);
  const completedRef = useRef(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  const handleButtonClick = useCallback(() => {
    finishIntro();
  }, [finishIntro]);

  const handleSkip = useCallback(() => {
    timelineRef.current?.kill();
    finishIntro();
  }, [finishIntro]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId = 0;
    let disposed = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    const directional = new THREE.DirectionalLight(0xffffff, 1.1);
    directional.position.set(4, 6, 8);
    scene.add(ambient, directional);

    const cubeGroup = new THREE.Group();
    const triangles: THREE.Mesh[] = [];

    FACE_SETUP.forEach((face, index) => {
      const mesh = createPyramid(CORP_COLORS[index]);
      mesh.position.set(...face.position);
      mesh.rotation.set(...face.rotation);
      mesh.castShadow = true;
      cubeGroup.add(mesh);
      triangles.push(mesh);
    });

    assignSFormation(triangles);
    scene.add(cubeGroup);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    resize();
    window.addEventListener('resize', resize);

    const renderLoop = () => {
      if (disposed) return;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    const startTransition = () => {
      const flash = flashRef.current;
      const tl = gsap.timeline({
        onComplete: () => {
          if (!disposed) setShowButton(true);
        },
      });
      timelineRef.current = tl;

      // FASE 1: cubo — giro lento
      tl.to(
        cubeGroup.rotation,
        { y: Math.PI * 2, duration: 2.5, ease: 'power1.inOut' },
        0,
      );

      // FASE 2: explosión
      tl.to(
        cubeGroup.rotation,
        { y: `+=${Math.PI * 4}`, x: `+=${Math.PI * 2}`, duration: 0.5, ease: 'power2.in' },
        2.5,
      );

      triangles.forEach((mesh, i) => {
        const chaos = {
          x: (Math.random() - 0.5) * 6,
          y: (Math.random() - 0.5) * 6,
          z: (Math.random() - 0.5) * 4,
          rotX: (Math.random() - 0.5) * Math.PI * 3,
          rotY: (Math.random() - 0.5) * Math.PI * 3,
          rotZ: (Math.random() - 0.5) * Math.PI * 3,
        };
        mesh.userData.chaos = chaos;
        tl.to(
          mesh.position,
          { x: chaos.x, y: chaos.y, z: chaos.z, duration: 1, ease: 'power3.out' },
          2.55 + i * 0.04,
        );
        tl.to(
          mesh.rotation,
          { x: chaos.rotX, y: chaos.rotY, z: chaos.rotZ, duration: 1, ease: 'power3.out' },
          2.55 + i * 0.04,
        );
      });

      if (flash) {
        tl.to(flash, { opacity: 0.85, duration: 0.15, ease: 'power2.out' }, 3.0);
        tl.to(flash, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 3.15);
      }

      // FASE 3: formación de la S
      triangles.forEach((mesh, i) => {
        const targetPos = mesh.userData.sPosition as THREE.Vector3;
        const targetRot = mesh.userData.sRotation as THREE.Euler;
        tl.to(
          mesh.position,
          { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 1.5, ease: 'power3.inOut' },
          4.0 + i * 0.05,
        );
        tl.to(
          mesh.rotation,
          {
            x: targetRot.x,
            y: targetRot.y,
            z: targetRot.z,
            duration: 1.5,
            ease: 'power3.inOut',
          },
          4.0 + i * 0.05,
        );
      });

      tl.to(cubeGroup.rotation, { y: Math.PI * 0.5, duration: 1.2, ease: 'power2.out' }, 4.2);

      // FASE 4: giro final y parada
      tl.to(cubeGroup.rotation, { y: `+=${Math.PI * 2}`, duration: 2, ease: 'power1.inOut' }, 5.8);
      tl.to(cubeGroup.rotation, { y: 0, x: 0, duration: 1, ease: 'power2.out' }, 7.8);
      tl.to({}, { duration: 1.5 }, 8.8);
    };

    const introDelay = window.setTimeout(startTransition, 400);

    return () => {
      disposed = true;
      window.clearTimeout(introDelay);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      timelineRef.current?.kill();

      triangles.forEach((mesh) => {
        mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="intro-animation-container">
      <div ref={containerRef} className="intro-animation-canvas" aria-hidden="true" />
      <div ref={flashRef} className="intro-flash" aria-hidden="true" />

      {enableSkip && !showButton && (
        <button type="button" className="intro-skip-btn" onClick={handleSkip}>
          Saltar intro →
        </button>
      )}

      {showButton && (
        <button
          type="button"
          className="intro-logo-btn"
          onClick={handleButtonClick}
          aria-label="Continuar"
        >
          <img src={logoAgency} alt="Agency 360" className="intro-logo-img" draggable={false} />
        </button>
      )}
    </div>
  );
}
