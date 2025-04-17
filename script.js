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

// Arrays to hold game objects
const platforms = [];
const killBricks = [];
const spinners = [];
const checkpoints = [];

// Materials
const platformMat = new THREE.MeshStandardMaterial({ color: 0x00ccff });
const killBrickMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const spinnerMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const checkpointMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

// Platform helper
function createPlatform(x, y, z, w = 5, d = 5) {
  const geo = new THREE.BoxGeometry(w, 1, d);
  const mesh = new THREE.Mesh(geo, platformMat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  platforms.push(mesh);
}

// Kill brick helper
function createKillBrick(x, y, z, w = 3, d = 3) {
  const geo = new THREE.BoxGeometry(w, 0.5, d);
  const mesh = new THREE.Mesh(geo, killBrickMat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  killBricks.push(mesh);
}

// Spinning platform helper
function createSpinner(x, y, z) {
  const geo = new THREE.BoxGeometry(8, 0.5, 0.5);
  const mesh = new THREE.Mesh(geo, spinnerMat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  spinners.push(mesh);
}

// Checkpoint helper
function createCheckpoint(x, y, z) {
  const geo = new THREE.BoxGeometry(1, 2, 1);
  const mesh = new THREE.Mesh(geo, checkpointMat);
  mesh.position.set(x, y + 1, z);
  scene.add(mesh);
  checkpoints.push(mesh);
}

// Build the level
createPlatform(0, 0, 0);
createPlatform(6, 2, -3);
createKillBrick(12, 1, 0);
createPlatform(12, 4, 0);
createPlatform(18, 6, -3);
createSpinner(20, 8, 0);
createPlatform(24, 10, 0);
createKillBrick(30, 9, 0);
createPlatform(30, 12, 0);
createCheckpoint(36, 14, -3);  // First checkpoint
createPlatform(42, 16, 0);
createKillBrick(48, 15, 0);
createPlatform(54, 17, 0);
createSpinner(60, 18, 0);
createPlatform(66, 20, 0);
createKillBrick(72, 18, 0);
createPlatform(78, 22, -3);
createCheckpoint(84, 24, 0);  // Second checkpoint
createPlatform(90, 26, 0);

// Controls
const keys = {};
let velocityY = 0;
let onGround = false;
let respawnPoint = new THREE.Vector3(0, 5, 0); // Initial spawn position

document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Collision checker
function checkCollision(a, b) {
  const aBox = new THREE.Box3().setFromObject(a);
  const bBox = new THREE.Box3().setFromObject(b);
  return aBox.intersectsBox(bBox);
}

// Checkpoint collision
function checkCheckpoint(player) {
  for (const checkpoint of checkpoints) {
    if (checkCollision(player, checkpoint)) {
      respawnPoint = checkpoint.position.clone();  // Update respawn point
    }
  }
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

  // Check platform collisions
  for (const plat of platforms) {
    if (checkCollision(player, plat)) {
      const platformTop = plat.position.y + 0.5;
      const playerBottom = player.position.y - 0.5;

      if (playerBottom <= platformTop) {
        player.position.y = platformTop + 0.5;
        velocityY = 0;
        onGround = true;
      }
    }
  }

  // Check checkpoints
  checkCheckpoint(player);

  // Jump
  if (onGround && keys[' ']) {
    velocityY = 0.4;
  }

  // Killbricks
  for (const kill of killBricks) {
    if (checkCollision(player, kill)) {
      player.position.copy(respawnPoint);  // Reset to last checkpoint
      velocityY = 0;
    }
  }

  // Spinners: Rotate and move the player if they touch it
  for (const spin of spinners) {
    spin.rotation.y += 0.05;

    if (checkCollision(player, spin)) {
      // Move player with the spinner
      player.position.x += 0.1 * Math.sin(spin.rotation.y);  // Movement on x-axis based on rotation
      player.position.z += 0.1 * Math.cos(spin.rotation.y);  // Movement on z-axis based on rotation
    }
  }

  // Fall reset
  if (player.position.y < -10) {
    player.position.copy(respawnPoint);  // Reset to last checkpoint
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

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
