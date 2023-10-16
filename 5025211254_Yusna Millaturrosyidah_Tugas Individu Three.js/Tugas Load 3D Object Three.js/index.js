import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/loaders/OBJLoader.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// Set warna latar belakang canvas
renderer.setClearColor(0xC2B7B1); 

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

let mesh; 
let animationId; 
let isAnimating = true; 

function init(geometry) {
  const material = new THREE.MeshMatcapMaterial({
    matcap: new THREE.TextureLoader().load('./assets/textures/matcaps/black-n-shiney.jpg')
  });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const sunlight = new THREE.DirectionalLight(0xffffff);
  sunlight.position.y = 2;
  scene.add(sunlight);

  const filllight = new THREE.DirectionalLight(0x88ccff);
  filllight.position.x = 1;
  filllight.position.y = -2;
  scene.add(filllight);
}

const loader = new OBJLoader();
loader.load("./assets/models/A_10.obj", (obj) => init(obj.children[0].geometry));

const rotationSpeed = 0.01;

function animate() {
  animationId = requestAnimationFrame(animate);

  if (mesh && isAnimating) {
    mesh.rotation.x += rotationSpeed;
    mesh.rotation.y += rotationSpeed;
  }

  renderer.render(scene, camera);
}

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleWindowResize, false);

animate(); // Mulai animasi

// Tambahkan event listener ke tombol "Start Animation" dan "Stop Animation"
document.getElementById('start-animation').addEventListener('click', () => {
  isAnimating = true;
  animate();
});

document.getElementById('stop-animation').addEventListener('click', () => {
  isAnimating = false;
  cancelAnimationFrame(animationId);
});
