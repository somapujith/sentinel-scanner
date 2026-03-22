import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BRAND_COLOR = 0xdc2626;
const SECONDARY_COLOR = 0xFFFFFF;

// Reduce particle count on mobile for better performance
const getParticleCount = () => {
  if (typeof window === 'undefined') return 2200;
  return window.innerWidth < 768 ? 800 : 2200;
};

export const ParticleBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any existing canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const PARTICLE_COUNT = getParticleCount();
    const mouse = { x: 0, y: 0 };
    let animationId: number;
    let t = 0;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle system
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random position: x/y: -12 to +12, z: -6 to +6
      positions[i * 3] = (Math.random() - 0.5) * 24; // x: -12 to +12
      positions[i * 3 + 1] = (Math.random() - 0.5) * 24; // y: -12 to +12
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12; // z: -6 to +6

      // Random speed (0.2 to 1.0) and phase (0 to 2π)
      speeds[i] = 0.2 + Math.random() * 0.8;
      phases[i] = Math.random() * Math.PI * 2;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.018,
      color: BRAND_COLOR,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Outer icosahedron wireframe
    const outerGeometry = new THREE.IcosahedronGeometry(2.4, 2);
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: BRAND_COLOR,
      wireframe: true,
      transparent: true,
      opacity: 0.035,
    });
    const outerSphere = new THREE.Mesh(outerGeometry, outerMaterial);
    scene.add(outerSphere);

    // Inner icosahedron wireframe
    const innerGeometry = new THREE.IcosahedronGeometry(1.2, 3);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: SECONDARY_COLOR,
      wireframe: true,
      transparent: true,
      opacity: 0.025,
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerSphere);

    // 8 flowing orbit lines
    const orbitLines: THREE.Line[] = [];
    for (let i = 0; i < 8; i++) {
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= 60; j++) {
        const t = (j / 60) * Math.PI * 2;
        const r = 3.5 + Math.sin(t * 3 + i) * 0.3;
        const x = Math.cos(t) * r;
        const y = Math.sin(t * 0.5) * r * 0.4 - 1 + i * 0.35;
        const z = Math.sin(t) * r * 0.2;
        points.push(new THREE.Vector3(x, y, z));
      }

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: BRAND_COLOR,
        transparent: true,
        opacity: 0.04,
      });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      orbitLines.push(orbitLine);
      scene.add(orbitLine);
    }

    // Mouse tracking
    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      t += 0.005;

      // Rotate outer sphere
      outerSphere.rotation.x = t * 0.15;
      outerSphere.rotation.y = t * 0.22;

      // Rotate inner sphere
      innerSphere.rotation.x = -t * 0.18;
      innerSphere.rotation.y = t * 0.3;

      // Rotate entire particle system
      particles.rotation.y = t * 0.06;
      particles.rotation.x = Math.sin(t * 0.2) * 0.1;

      // Update particle positions
      const positionAttribute = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
      const posArray = positionAttribute.array as Float32Array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        posArray[i * 3 + 1] += Math.sin(t * speeds[i] + phases[i]) * 0.003; // y
        posArray[i * 3] += Math.cos(t * speeds[i] * 0.5 + phases[i]) * 0.001; // x
      }
      positionAttribute.needsUpdate = true;

      // Mouse parallax for camera
      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 0.3 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      // Dispose geometries and materials
      particleGeometry.dispose();
      particleMaterial.dispose();
      outerGeometry.dispose();
      outerMaterial.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      orbitLines.forEach((line) => {
        line.geometry.dispose();
        (line.material as THREE.LineBasicMaterial).dispose();
      });
      renderer.dispose();

      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};
