// threeBackground.js
// Subtle particle + soft glow background to mimic ThreeBackground React component.
// Uses global THREE provided by the loaded three.min.js

(function () {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0); // transparent

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 14;

  // Soft gradient plane behind
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), glowMat);
  glow.position.z = -6;
  scene.add(glow);

  // Particles
  const pts = 700;
  const positions = new Float32Array(pts * 3);
  for (let i = 0; i < pts; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ size: 0.06, transparent: true, opacity: 0.6 });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  let t = 0;
  function animate() {
    t += 0.003;
    points.rotation.y = t * 0.5;
    points.rotation.x = Math.sin(t * 0.7) * 0.03;
    glow.material.opacity = 0.05 + Math.abs(Math.sin(t * 0.6)) * 0.04;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

})();
