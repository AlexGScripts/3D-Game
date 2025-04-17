// Setup scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

// Camera
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);

// Platforms
const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x00ccff });
function createPlatform(x, y, z, w = 5, d = 5) {
  const geometry = new THREE.BoxGeometry(w, 1, d);
  const mesh = new THREE.Mesh(geometry, platformMaterial);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

const platforms = [
  createPlatform(0, 0, 0),
  createPlatform(6, 2, -3),
  createPlatform(12, 4, 0),
  createPlatform(18, 6, -3),
  createPlatform(24, 8, 0)
];

// Player
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

let velocityY = 0;
let onGround = false;
player.position.set(0, 5, 0);

// Controls
const keys = {};
document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

// Game loop
function animate() {
  requestAnimationFrame(animate);

  // Movement
  const speed = 0.2;
  if (keys["a"]) player.position.x -= speed;
  if (keys["d"]) player.position.x += speed;
  if (keys["w"]) player.position.z -= speed;
  if (keys["s"]) player.position.z += speed;

  // Gravity
  velocityY -= 0.02;
  player.position.y += velocityY;

  // Platform Collision (simple Y check)
  onGround = false;
  platforms.forEach(plat => {
    const dx = Math.abs(player.position.x - plat.position.x) < 3;
    const dz = Math.abs(player.position.z - plat.position.z) < 3;
    const dy = Math.abs(player.position.y - (plat.position.y + 1)) < 0.1;
    if (dx && dz && dy && velocityY < 0) {
      velocityY = 0;
      player.position.y = plat.position.y + 1;
      onGround = true;
    }
  });

  // Jumping
  if (onGround && keys[" "]) {
    velocityY = 0.4;
  }

  // Fall reset
  if (player.position.y < -10) {
    player.position.set(0, 5, 0);
    velocityY = 0;
  }

  // Camera follow
  camera.position.x = player.position.x;
  camera.position.y = player.position.y + 5;
  camera.position.z = player.position.z + 10;
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
