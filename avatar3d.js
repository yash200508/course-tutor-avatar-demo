import {AvatarViewer} from './avatar-viewer.js';
const canvas = document.querySelector('#avatar-canvas');
const fallback = document.querySelector('#avatar-fallback');
const status = document.querySelector('#avatar-status');
const description = document.querySelector('#avatar-description');
let viewer, blinkTimer;
try {
  viewer = new AvatarViewer(canvas);
  const avatar = await viewer.load('./tutor-model.glb');
  viewer.relaxArms();
  fallback.hidden = true; canvas.hidden = false; viewer.resize();
  status.textContent = '3D TUTOR AVATAR - TRIAL';
  const shapes = new Set(avatar.morphTargets);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  function blink() {
    if (!motion.matches && shapes.has('eyeBlinkLeft') && shapes.has('eyeBlinkRight')) {
      viewer.setMorph('eyeBlinkLeft', 1); viewer.setMorph('eyeBlinkRight', 1);
      setTimeout(() => { viewer.setMorph('eyeBlinkLeft', 0); viewer.setMorph('eyeBlinkRight', 0); }, 140);
    }
    blinkTimer = setTimeout(blink, 4000 + Math.random() * 2500);
  }
  blinkTimer = setTimeout(blink, 3000); canvas.dataset.loaded = 'true';
} catch (error) {
  console.error(error); status.textContent = '3D AVATAR UNAVAILABLE';
  description.textContent = 'The avatar could not be loaded. The reference portrait is shown instead.';
}
window.addEventListener('pagehide', () => { clearTimeout(blinkTimer); viewer?.dispose(); }, {once:true});
