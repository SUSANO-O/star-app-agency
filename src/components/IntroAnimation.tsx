import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import './IntroAnimation.css';

interface IntroAnimationProps {
  onComplete?: () => void;
  enableSkip?: boolean;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({
  onComplete,
  enableSkip = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showButton, setShowButton] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(enableSkip);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Colores corporativos (puedes personalizarlos)
  const CORP_COLORS = [
    0xFF007F, // Fucsia (Front)
    0x40E0D0, // Turquesa (Back)
    0x007FFF, // Azul brillante (Top)
    0xFFA500, // Naranja (Bottom)
    0xFF0000, // Rojo (Right)
    0x40E0D0  // Turquesa (Left)
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    // Configuración de la escena
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    // Crear geometría de pirámide
    const createPyramid = (color: number) => {
      const geometry = new THREE.ConeGeometry(0.5, 1, 4);
      const material = new THREE.MeshPhongMaterial({
        color: color,
        shininess: 100,
        specular: 0x444444,
      });
      return new THREE.Mesh(geometry, material);
    };

    // Crear 6 pirámides formando un cubo
    const pyramids: THREE.Mesh[] = [];
    const cubeGroup = new THREE.Group();

    // Front pyramid
    const pyramid1 = createPyramid(CORP_COLORS[0]);
    pyramid1.position.set(0, 0, 0.5);
    pyramid1.rotation.x = Math.PI;
    pyramids.push(pyramid1);
    cubeGroup.add(pyramid1);

    // Back pyramid
    const pyramid2 = createPyramid(CORP_COLORS[1]);
    pyramid2.position.set(0, 0, -0.5);
    pyramids.push(pyramid2);
    cubeGroup.add(pyramid2);

    // Top pyramid
    const pyramid3 = createPyramid(CORP_COLORS[2]);
    pyramid3.position.set(0, 0.5, 0);
    pyramid3.rotation.x = -Math.PI / 2;
    pyramids.push(pyramid3);
    cubeGroup.add(pyramid3);

    // Bottom pyramid
    const pyramid4 = createPyramid(CORP_COLORS[3]);
    pyramid4.position.set(0, -0.5, 0);
    pyramid4.rotation.x = Math.PI / 2;
    pyramids.push(pyramid4);
    cubeGroup.add(pyramid4);

    // Right pyramid
    const pyramid5 = createPyramid(CORP_COLORS[4]);
    pyramid5.position.set(0.5, 0, 0);
    pyramid5.rotation.z = -Math.PI / 2;
    pyramids.push(pyramid5);
    cubeGroup.add(pyramid5);

    // Left pyramid
    const pyramid6 = createPyramid(CORP_COLORS[5]);
    pyramid6.position.set(-0.5, 0, 0);
    pyramid6.rotation.z = Math.PI / 2;
    pyramids.push(pyramid6);
    cubeGroup.add(pyramid6);

    scene.add(cubeGroup);

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Animación de renderizado
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Función para crear la forma de "S"
    const createS = (_triangles: THREE.Mesh[]) => {
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
        new THREE.Euler(0, 0, -Math.PI / 6),
        new THREE.Euler(0, 0, Math.PI / 4),
        new THREE.Euler(0, 0, -Math.PI / 5),
        new THREE.Euler(0, 0, Math.PI / 8),
        new THREE.Euler(0, 0, -Math.PI / 7),
      ];

      return { positions: sPositions, rotations: sRotations };
    };

    // Animación de transición
    const startTransition = () => {
      const tl = gsap.timeline({
        onComplete: () => {
          setShowButton(true);
          setShowSkipButton(false);
        },
      });

      // FASE 1: Giro Lento
      tl.to(cubeGroup.rotation, {
        y: Math.PI * 2,
        duration: 2.5,
        ease: "power1.inOut"
      }, 0);

      // FASE 2: Explosión
      tl.to(cubeGroup.rotation, {
        y: "+=" + Math.PI * 4,
        x: "+=" + Math.PI * 2,
        duration: 0.5,
        ease: "power2.in"
      }, 2.5);

      // FASE 3: Formar la "S"
      const { positions, rotations } = createS(pyramids);
      pyramids.forEach((pyramid, i) => {
        tl.to(pyramid.position, {
          x: positions[i].x,
          y: positions[i].y,
          z: positions[i].z,
          duration: 1.5,
          ease: "elastic.out(1, 0.5)"
        }, 3.0);

        tl.to(pyramid.rotation, {
          x: rotations[i].x,
          y: rotations[i].y,
          z: rotations[i].z,
          duration: 1.5,
          ease: "power2.out"
        }, 3.0);
      });

      // FASE 4: Resetear rotación del grupo
      tl.to(cubeGroup.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.0,
        ease: "power1.inOut"
      }, 3.0);
    };

    // Iniciar animación después de un pequeño delay
    setTimeout(startTransition, 500);

    // Responsive
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      pyramids.forEach(pyramid => {
        pyramid.geometry.dispose();
        (pyramid.material as THREE.Material).dispose();
      });
    };
  }, []);

  const handleButtonClick = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="intro-animation-container" ref={containerRef}>
      {showSkipButton && (
        <button className="intro-skip-btn" onClick={handleSkip}>
          Saltar Intro →
        </button>
      )}

      {showButton && (
        <div className="intro-tagline">
          <span className="intro-main-slogan">
            🅾️1️⃣2️⃣3️⃣ START APP
          </span>
          <span className="intro-main-slogan">
            "1, 2, 3, START!"
          </span>
          <span className="intro-sub-slogan">
            By START APP 360™
          </span>
          <span className="intro-sub-slogan">
            All You Need To Start Your Business
          </span>
          <span className="intro-copyright">
            ©®⭐🚀
          </span>
          <button className="intro-continue-btn" onClick={handleButtonClick}>
            Continuar
          </button>
        </div>
      )}
    </div>
  );
};

export default IntroAnimation;
