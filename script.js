// Setup scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// Player
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 5, 0);
scene.add(player);

// Platforms
const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x00ccff });
const platforms = [];

function createPlatform(x, y, z, w = 5, d = 5) {
  const geometry = new THREE.BoxGeometry(w, 1, d);
  const mesh = new THREE.Mesh(geometry, platformMaterial);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  platforms.push(mesh);
}

createPlatform(0, 0, 0);
createPlatform(6, 2, -3);
createPlatform(12, 4, 0);
createPlatform(18, 6, -3);
createPlatform(24, 8, 0);

// Movement & physics
const keys = {};
let velocityY = 0;
let onGround = false;

document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Helper function for collisions
function checkCollision(player, platform) {
  const playerBox = new THREE.Box3().setFromObject(player);
  const platformBox = new THREE.Box3().setFromObject(platform);
  return playerBox.intersectsBox(platformBox);
}

// Game loop
function animate() {
  requestAnimationFrame(animate);

  // Movement
  const speed = 0.2;
  if (keys['a']) player.position.x -= speed;
  if (keys['d']) player.position.x += speed;
  if (keys['w']) player.position.z -= speed;
  if (keys['s']) player.position.z += speed;

  // Gravity
  velocityY -= 0.02;
  player.position.y += velocityY;
  onGround = false;

  // Check collisions with all platforms
  for (const platform of platforms) {
    if (checkCollision(player, platform)) {
      const platformTop = platform.position.y + 0.5;
      const playerBottom = player.position.y - 0.5;

      if (playerBottom <= platformTop) {
        player.position.y = platformTop + 0.5;
        velocityY = 0;
        onGround = true;
      }
    }
  }

  // Jump
  if (onGround && keys[' ']) {
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

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
