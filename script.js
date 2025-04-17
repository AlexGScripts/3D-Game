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
const checkpointMat = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue checkpoint material

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

// Checkpoint helper (blue and placed on top of a platform)
function createCheckpoint(x, y, z) {
  const platformGeo = new THREE.BoxGeometry(5, 1, 5); // Platform size
  const platformMesh = new THREE.Mesh(platformGeo, checkpointMat);
  platformMesh.position.set(x, y, z); // Blue platform for checkpoint
  scene.add(platformMesh);
  platforms.push(platformMesh); // Add platform to the platform array

  const checkpointGeo = new THREE.BoxGeometry(3, 1, 3); // Larger checkpoint
  const checkpointMesh = new THREE.Mesh(checkpointGeo, checkpointMat);
  checkpointMesh.position.set(x, y + 1.5, z); // Position above the platform
  scene.add(checkpointMesh);
  checkpoints.push(checkpointMesh); // Add checkpoint to the checkpoint array
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
createCheckpoint(36, 14, -3);  // First checkpoint (larger and blue platform)
createPlatform(42, 16, 0);
createKillBrick(48, 15, 0);
createPlatform(54, 17, 0);
createSpinner(60, 18, 0);
createPlatform(66, 20, 0);
createKillBrick(72, 18, 0);
createPlatform(78, 22, -3);
createCheckpoint(84, 24, 0);  // Second checkpoint (larger and blue platform)
createPlatform(90, 26, 0);

// Controls
const keys = {};
let velocityY = 0;
let onGround = false;
let respawnPoint = new THREE.Vector3(0, 5, 0); // Initial spawn position

document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Touch controls
let joystickActive = false;
let joystickPosition = { x: 0, y: 0 };

const joystick = document.getElementById('joystick');
const stick = document.getElementById('stick');
const jumpButton = document.getElementById('jumpButton');

joystick.addEventListener('touchstart', (e) => {
  joystickActive = true;
  const touch = e.touches[0];
  joystickPosition.x = touch.clientX;
  joystickPosition.y = touch.clientY;
});

joystick.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  const deltaX = touch.clientX - joystickPosition.x;
  const deltaY = touch.clientY - joystickPosition.y;
  
  if (Math.abs(deltaX) > 10) {
    player.position.x += deltaX * 0.002; // Slower movement multiplier
  }
  if (Math.abs(deltaY) > 10) {
    player.position.z -= deltaY * 0.002; // Slower movement multiplier
  }
});

joystick.addEventListener('touchend', () => {
  joystickActive = false;
});

jumpButton.addEventListener('touchstart', () => {
  velocityY = 0.4;
});

// WASD control fixes
let moveSpeed = 0.05; // Slower movement speed for WASD
function handleDesktopControls() {
  if (keys['w']) {
    player.position.z -= moveSpeed;
  }
  if (keys['s']) {
    player.position.z += moveSpeed;
  }
  if (keys['a']) {
    player.position.x -= moveSpeed;
  }
  if (keys['d']) {
    player.position.x += moveSpeed;
  }
}

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

  // Handle desktop controls (WASD)
  handleDesktopControls();

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
      player.position.x += 0.05 * Math.sin(spin.rotation.y);  // Slow movement on x-axis
      player.position.z += 0.05 * Math.cos(spin.rotation.y);  // Slow movement on z-axis
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
