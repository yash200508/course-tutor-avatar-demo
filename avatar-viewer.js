import * as THREE from './three.module.min.js';
import { GLTFLoader } from './GLTFLoader.js';

// A small browser component for a glTF avatar. It does not create speech or AI replies.
export class AvatarViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor('#e1e9e1');
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x798b7e, 2));
    const light = new THREE.DirectionalLight(0xfff5eb, 2);
    light.position.set(-2, 3, 4); this.scene.add(light);
    this.camera = new THREE.PerspectiveCamera(30, 1, .01, 100);
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.dragX = null;
    this.onDown = event => { this.dragX = event.clientX; canvas.setPointerCapture(event.pointerId); };
    this.onMove = event => { if (this.dragX === null) return; this.root.rotation.y = THREE.MathUtils.clamp(this.root.rotation.y + (event.clientX - this.dragX) * .008, -1, 1); this.dragX = event.clientX; };
    this.onUp = () => { this.dragX = null; };
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onUp);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas); this.resize();
    this.renderer.setAnimationLoop(() => this.renderer.render(this.scene, this.camera));
    this.version = 0;
  }
  resize() {
    const width = this.canvas.clientWidth, height = this.canvas.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
  }
  async load(url) {
    const version = ++this.version;
    const gltf = await new GLTFLoader().loadAsync(url);
    if (version !== this.version) { this.disposeModel(gltf.scene); return null; }
    if (this.model) { this.root.remove(this.model); this.disposeModel(this.model); }
    this.model = gltf.scene; this.root.add(this.model); this.root.rotation.y = 0;
    const bounds = new THREE.Box3().setFromObject(this.model);
    if (bounds.isEmpty()) throw new Error('The model has no visible geometry.');
    const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const headY = bounds.min.y + size.y * .85;
    this.camera.position.set(center.x, headY, bounds.max.z + Math.max(size.y * .75, .5));
    this.camera.lookAt(center.x, headY, center.z);
    const shapes = new Set();
    this.model.traverse(mesh => { for (const name of Object.keys(mesh.morphTargetDictionary || {})) shapes.add(name); });
    return {scene: this.model, animations: gltf.animations, morphTargets: [...shapes]};
  }
  setMorph(name, value) {
    if (!Number.isFinite(value)) throw new TypeError('Morph weight must be a number');
    let count = 0;
    this.model?.traverse(mesh => {
      const index = mesh.morphTargetDictionary?.[name];
      if (Number.isInteger(index) && mesh.morphTargetInfluences) { mesh.morphTargetInfluences[index] = THREE.MathUtils.clamp(value, 0, 1); count++; }
    });
    return count;
  }
  // Optional still pose for a MetaPerson-style T-pose rig; not an animation.
  relaxArms() {
    if (!this.model) return false;
    this.model.updateMatrixWorld(true);
    const pairs = [['LeftArm', 'LeftForeArm'], ['RightArm', 'RightForeArm']];
    const bones = pairs.map(([upper, lower]) => [this.model.getObjectByName(upper), this.model.getObjectByName(lower)]);
    if (bones.some(([upper, lower]) => !upper?.isBone || !lower?.isBone)) return false;
    for (const [upper, lower] of bones) {
      const start = upper.getWorldPosition(new THREE.Vector3());
      const end = lower.getWorldPosition(new THREE.Vector3());
      const direction = end.sub(start).normalize();
      const target = new THREE.Vector3(Math.sign(direction.x) * .16, -.987, 0).normalize();
      const worldDelta = new THREE.Quaternion().setFromUnitVectors(direction, target);
      const parentWorld = upper.parent.getWorldQuaternion(new THREE.Quaternion());
      const localDelta = parentWorld.clone().invert().multiply(worldDelta).multiply(parentWorld);
      upper.quaternion.premultiply(localDelta); this.model.updateMatrixWorld(true);
    }
    return true;
  }
  disposeModel(model) {
    const textures = new Set(), materials = new Set(), geometries = new Set();
    model.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      for (const material of (Array.isArray(object.material) ? object.material : [object.material])) if (material) materials.add(material);
    });
    for (const material of materials) { for (const value of Object.values(material)) if (value?.isTexture) textures.add(value); material.dispose(); }
    for (const texture of textures) texture.dispose();
    for (const geometry of geometries) geometry.dispose();
  }
  dispose() {
    ++this.version; this.renderer.setAnimationLoop(null); this.observer.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onDown); this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerup', this.onUp); this.canvas.removeEventListener('pointercancel', this.onUp);
    if (this.model) this.disposeModel(this.model);
    this.renderer.dispose();
  }
}
