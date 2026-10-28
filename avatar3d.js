// Procedural bust prototype: deliberately a 3D approximation, not a scanned rig.
// The original generated portrait is projected onto a curved face surface.
const canvas = document.querySelector('#avatar-canvas');
const fallback = document.querySelector('#avatar-fallback');
const status = document.querySelector('#avatar-status');
const description = document.querySelector('#avatar-description');

try {
  const THREE = await import('./three.module.min.js');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e1e9e1');
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 50);
  camera.position.set(0, 1.25, 5.7);
  camera.lookAt(0, 1.30, 0);
  scene.add(new THREE.HemisphereLight(0xfff5e9, 0x6e8a7c, 2));
  const key = new THREE.DirectionalLight(0xfff2df, 2.1); key.position.set(-3, 5, 5); scene.add(key);
  const model = new THREE.Group(); scene.add(model);

  const skin = new THREE.MeshStandardMaterial({ color: 0xd6a384, roughness: 0.9 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x33231f, roughness: 0.83 });
  const sweater = new THREE.MeshStandardMaterial({ color: 0x526a4d, roughness: 1 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 1 });
  const addEllipsoid = (parent, material, x, y, z, sx, sy, sz) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), material);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); parent.add(mesh); return mesh;
  };
  // A shaped torso gives the shoulders and open cardigan a more human outline.
  const coatShape = new THREE.Shape();
  coatShape.moveTo(-0.85, -0.75); coatShape.lineTo(-0.79, 0.13);
  coatShape.bezierCurveTo(-0.78, 0.43, -0.54, 0.53, -0.25, 0.64);
  coatShape.lineTo(-0.15, 0.43); coatShape.quadraticCurveTo(0, 0.30, 0.15, 0.43);
  coatShape.lineTo(0.25, 0.64); coatShape.bezierCurveTo(0.54, 0.53, 0.78, 0.43, 0.79, 0.13);
  coatShape.lineTo(0.85, -0.75); coatShape.closePath();
  const coat = new THREE.Mesh(new THREE.ExtrudeGeometry(coatShape, {depth:0.24, bevelEnabled:true, bevelSegments:4, bevelSize:0.045, bevelThickness:0.045, curveSegments:24}), sweater);
  coat.position.z = -0.12; model.add(coat);
  const shirtShape = new THREE.Shape();
  shirtShape.moveTo(-0.30, -0.72); shirtShape.lineTo(-0.26, 0.37);
  shirtShape.quadraticCurveTo(0, 0.16, 0.26, 0.37); shirtShape.lineTo(0.30, -0.72); shirtShape.closePath();
  const shirtFront = new THREE.Mesh(new THREE.ShapeGeometry(shirtShape, 24), shirt); shirtFront.position.z = 0.17; model.add(shirtFront);
  // Neck and a volumetric head/hair base.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.20, 0.40, 32), skin);
  neck.position.set(0, 0.85, 0.03); model.add(neck);
  const head = new THREE.Group(); head.position.set(0, 1.62, 0); model.add(head);
  addEllipsoid(head, hair, 0, 0.03, -0.12, 0.58, 0.77, 0.41);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const x = side * (0.39 + i * 0.035);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x * 0.85, 0.42, -0.03 - i * 0.03),
        new THREE.Vector3(x, -0.05, -0.02 - i * 0.03),
        new THREE.Vector3(x + side * 0.06, -0.49, -0.09 - i * 0.03),
        new THREE.Vector3(x + side * 0.02, -0.80 - i * 0.018, -0.12 - i * 0.03)
      ]);
      head.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.075, 8, false), hair));
    }
  }
  addEllipsoid(head, skin, 0, -0.04, 0.02, 0.47, 0.64, 0.38);

  const image = new Image(); image.src = './tutor-avatar.png';
  image.onload = () => {
    const textureCanvas = document.createElement('canvas'); textureCanvas.width = 512; textureCanvas.height = 512;
    const ctx = textureCanvas.getContext('2d');
    // Face crop from the generated portrait; an oval fade avoids a hard square border.
    ctx.drawImage(image, 425, 105, 470, 635, 0, 0, 512, 512);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath(); ctx.ellipse(256, 256, 235, 248, 0, 0, Math.PI * 2); ctx.fill();
    const texture = new THREE.CanvasTexture(textureCanvas); texture.colorSpace = THREE.SRGBColorSpace;
    // The front half of an ellipsoid is actual geometry; texture is projected from the reference.
    const faceGeometry = new THREE.SphereGeometry(1, 72, 48, 0, Math.PI);
    const positions = faceGeometry.attributes.position; const uvs = faceGeometry.attributes.uv;
    for (let i = 0; i < positions.count; i++) uvs.setXY(i, 0.5 + positions.getX(i) / 2, 0.5 + positions.getY(i) / 2);
    uvs.needsUpdate = true;
    const face = new THREE.Mesh(faceGeometry, new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    face.scale.set(0.478, 0.646, 0.387); face.position.set(0, -0.04, 0.025); head.add(face);
    fallback.hidden = true; canvas.hidden = false; status.textContent = '3D AVATAR PROTOTYPE';
    resize();
  };
  image.onerror = () => { status.textContent = '3D TEXTURE UNAVAILABLE'; description.textContent = 'The portrait could not load. Please reload the page.'; };

  let targetRotation = 0, dragStart = null, rotationStart = 0;
  canvas.addEventListener('pointerdown', event => { dragStart = event.clientX; rotationStart = targetRotation; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', event => { if (dragStart !== null) targetRotation = THREE.MathUtils.clamp(rotationStart + (event.clientX - dragStart) * 0.006, -0.55, 0.55); });
  canvas.addEventListener('pointerup', () => { dragStart = null; });
  canvas.addEventListener('pointercancel', () => { dragStart = null; });
  function resize() { const box = canvas.parentElement.getBoundingClientRect(); if (!box.width || !box.height) return; renderer.setSize(box.width, box.height, false); camera.aspect = box.width / box.height; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(canvas.parentElement);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  renderer.setAnimationLoop(time => { model.rotation.y += (targetRotation - model.rotation.y) * 0.09; if (!reducedMotion.matches) { head.rotation.z = Math.sin(time * 0.0006) * 0.014; model.position.y = Math.sin(time * 0.001) * 0.008; } renderer.render(scene, camera); });
} catch (error) {
  canvas.hidden = true; fallback.hidden = false; status.textContent = '3D UNAVAILABLE';
  description.textContent = 'The 3D preview could not start on this browser. The reference image is shown instead.';
}
