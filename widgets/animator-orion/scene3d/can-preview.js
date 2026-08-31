import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function createCanPreview({ mountEl, labelUrl }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(mountEl.clientWidth, mountEl.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // IMPORTANT: canvas above background
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  // PreviewOrion editor overlay must receive pointer events (grid handles, etc.)
  // Since the can mesh is removed and we don't need canvas dragging here, disable pointer events on the canvas.
  renderer.domElement.style.pointerEvents = 'none';

  mountEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 1.55, 7.4);
  camera.lookAt(0, 1.15, 0);

  // Lights
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2.2, 4.2, 2.8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 15;
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.7);
  fill.position.set(-3.2, 2.5, 1.2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 1.0);
  rim.position.set(0, 2.8, -4.2);
  scene.add(rim);

  // Shadow catcher (невидима площина, видно тільки тінь)
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.25 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), shadowMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // Can group (removed permanently by request — no can mesh is created)
  const group = new THREE.Group();
  scene.add(group);

  // (intentionally empty)

  // Env
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  let envEnabled = true;
  scene.environment = env;

  function setEnvEnabled(on) {
    envEnabled = !!on;
    scene.environment = envEnabled ? env : null;
  }

  function resize() {
    const w = mountEl.clientWidth || 1;
    const h = mountEl.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  // Drag-rotate handlers removed (canvas pointer-events disabled)

  let raf = 0;
  function tick() {
    raf = requestAnimationFrame(tick);
    renderer.render(scene, camera);
  }
  tick();

  const ro = new ResizeObserver(() => resize());
  ro.observe(mountEl);
  resize();

  return {
    setVisible(on){ group.visible = !!on; },
    setRotationY(v){ group.rotation.y = Number(v) || 0; },
    setCamera({ x, y, z, lookY }){
      if (typeof x === 'number') camera.position.x = x;
      if (typeof y === 'number') camera.position.y = y;
      if (typeof z === 'number') camera.position.z = z;
      camera.lookAt(0, typeof lookY === 'number' ? lookY : 1.15, 0);
    },
    setScale(s){ group.scale.setScalar(Math.max(0.001, Number(s) || 1)); },
    setEnvEnabled,
    getRotationY(){ return group.rotation.y; },
    destroy(){
      cancelAnimationFrame(raf);
      ro.disconnect();
      try { mountEl.removeChild(renderer.domElement); } catch {}
      renderer.dispose();
      pmrem.dispose();
    }
  };
}
