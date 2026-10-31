import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Visualizer3D({ selectedParts }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Slate 950 matching UI theme

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(14, 11, 20);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    currentMount.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x818cf8, 1.5, 25);
    pointLight.position.set(-5, 5, -5);
    scene.add(pointLight);

    // 3. PC Case Grid & Wireframe Chassis
    const gridHelper = new THREE.GridHelper(20, 20, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const caseGeo = new THREE.BoxGeometry(6.5, 9.5, 7.5);
    const caseMat = new THREE.MeshBasicMaterial({
      color: 0x334155,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.position.set(0, 4.75, 0);
    scene.add(caseMesh);

    // Dynamic Components Container
    const buildGroup = new THREE.Group();
    scene.add(buildGroup);

    // --- RENDER MOTHERBOARD ---
    if (selectedParts.motherboard) {
      const isDDR5 = selectedParts.motherboard.ramType === 'DDR5';
      const moboGeo = new THREE.BoxGeometry(0.2, 7.5, 5.5);
      const moboMat = new THREE.MeshStandardMaterial({ 
        color: isDDR5 ? 0x0f766e : 0x042f2e, // Distinct teal shade for DDR5 boards
        roughness: 0.3, 
        metalness: 0.5 
      });
      const moboMesh = new THREE.Mesh(moboGeo, moboMat);
      moboMesh.position.set(-2.8, 4.5, 0);
      buildGroup.add(moboMesh);
    }

    // --- RENDER CPU (Color adapts to Intel vs AMD) ---
    if (selectedParts.cpu) {
      const isAmd = selectedParts.cpu.name.toLowerCase().includes('amd' ) || selectedParts.cpu.socket === 'AM5';
      const cpuGeo = new THREE.BoxGeometry(0.3, 1.2, 1.2);
      const cpuMat = new THREE.MeshStandardMaterial({ 
        color: isAmd ? 0xef4444 : 0x3b82f6, // Red for AMD Ryzen, Blue for Intel Core
        metalness: 0.8, 
        roughness: 0.2,
        emissive: isAmd ? 0x7f1d1d : 0x1d4ed8,
        emissiveIntensity: 0.3
      });
      const cpuMesh = new THREE.Mesh(cpuGeo, cpuMat);
      cpuMesh.position.set(-2.55, 5.8, 0);
      buildGroup.add(cpuMesh);
    }

    // --- RENDER RAM ---
    if (selectedParts.ram) {
      for (let i = 0; i < 2; i++) {
        const ramGeo = new THREE.BoxGeometry(0.2, 1.8, 0.25);
        const ramMat = new THREE.MeshStandardMaterial({ 
          color: 0xa855f7, 
          emissive: 0x7e22ce, 
          emissiveIntensity: 0.6 
        });
        const ramMesh = new THREE.Mesh(ramGeo, ramMat);
        ramMesh.position.set(-2.55, 5.8, 1.0 + i * 0.5);
        buildGroup.add(ramMesh);
      }
    }

    // --- RENDER GPU (Size scales dynamically based on TDP) ---
    if (selectedParts.gpu) {
      const tdp = selectedParts.gpu.tdp || 200;
      const gpuLength = Math.min(Math.max(3.0 + (tdp / 120), 3.5), 5.5); // Higher TDP = larger physical card
      
      const gpuGeo = new THREE.BoxGeometry(gpuLength, 1.2, 1.8);
      const gpuMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
      const gpuMesh = new THREE.Mesh(gpuGeo, gpuMat);
      gpuMesh.position.set(-0.3 + (gpuLength - 4) / 4, 3.2, 0.2);
      buildGroup.add(gpuMesh);

      // GPU Cooler Accent Light strip
      const stripGeo = new THREE.BoxGeometry(gpuLength * 0.9, 0.1, 0.1);
      const stripMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const stripMesh = new THREE.Mesh(stripGeo, stripMat);
      stripMesh.position.set(-0.3 + (gpuLength - 4) / 4, 3.82, 0.2);
      buildGroup.add(stripMesh);
    }

    // --- RENDER PSU (Sized based on Wattage) ---
    if (selectedParts.psu) {
      const wattage = selectedParts.psu.wattage || 650;
      const psuDepth = Math.min(Math.max(3.5 + (wattage / 400), 3.8), 5.0);

      const psuGeo = new THREE.BoxGeometry(4.0, 2.2, psuDepth);
      const psuMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.4 });
      const psuMesh = new THREE.Mesh(psuGeo, psuMat);
      psuMesh.position.set(-0.5, 1.2, 0);
      buildGroup.add(psuMesh);
    }

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      buildGroup.rotation.y += 0.004;
      caseMesh.rotation.y += 0.004;
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!currentMount) return;
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [selectedParts]);

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-2xl p-4 shadow-xl mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">3D Assembly Spatial View</h2>
        <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono">Interactive Three.js</span>
      </div>
      <div ref={mountRef} className="w-full h-64 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/50 relative">
        {!Object.values(selectedParts).some(Boolean) && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 pointer-events-none">
            Select parts to generate 3D preview
          </div>
        )}
      </div>
    </div>
  );
}