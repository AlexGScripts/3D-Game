// Updated JavaScript with obby parts, smaller kill bricks, more kill bricks, turns, and gaps

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// Player (bike and rider) setup
const playerGroup = new THREE.Group();
const bikeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 }); // Color for the bike
const riderMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444 }); // Color for the rider

// Simple bike model (box for bike and a box for the rider)
const bikeBody = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 1), bikeMaterial);
const wheelFront = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16), bikeMaterial);
const wheelBack = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16), bikeMaterial);
const rider = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.5), riderMaterial);

wheelFront.rotation.z = Math.PI / 2;
wheelBack.rotation.z = Math.PI / 2;

wheelFront.position.set(1.5, -0.3, 0.5);
wheelBack.position.set(-1.5, -0.3, 0.5);

rider.position.set(0, 0.8, 0);

playerGroup.add(bikeBody);
playerGroup.add(wheelFront);
playerGroup.add(wheelBack);
playerGroup.add(rider);
playerGroup.position.set(0, 5, 0);

scene.add(playerGroup);

const platformMat = new THREE.MeshStandardMaterial({ color: 0x00ccff });
const killBrickMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const spinnerMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const checkpointMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });

const platforms = [], killBricks = [], spinners = [], checkpoints = [];

function createPlatform(x, y, z, w = 5, d = 5) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), platformMat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  platforms.push(mesh);
}

function createKillBrick(x, y, z, w = 2, d = 2) { // Smaller kill brick size
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), killBrickMat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  killBricks.push(mesh);
}

function createSpinner(x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 0.5), spinnerMat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  spinners.push(mesh);
}

function createCheckpoint(x, y, z) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 6), checkpointMat);
  base.position.set(x, y, z);
  scene.add(base);
  platforms.push(base);

  const marker = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 3), checkpointMat);
  marker.position.set(x, y + 1.5, z);
  scene.add(marker);
  checkpoints.push(marker);
}

let stageX = 0, stageY = 0;
let level = 1; // Track level progression
const maxLevel = 3; // Example max levels

// Create multiple levels with different layouts and turns
function createLevel() {
  const levelWidth = 6; // Distance between each platform
  let direction = 1; // Controls whether the stage goes left or right
  for (let i = 0; i < 100; i++) {
    if (i % 10 === 0 && i / 10 < 10) createCheckpoint(stageX, stageY, 0);
    else if (i % 15 === 0 && Math.random() > 0.3) createKillBrick(stageX, stageY, 0); // More kill bricks
    else if (i % 7 === 0 && Math.random() > 0.4) createSpinner(stageX, stageY, 0); // More spinners
    else createPlatform(stageX, stageY, 0);

    // Add small gaps between parts for extra difficulty
    if (i % 5 === 0 && Math.random() > 0.5) {
      stageX += 2; // Add a small gap
    }

    // Add turns in the stage layout
    if (i % 20 === 0 && Math.random() > 0.5) {
      direction = direction === 1 ? -1 : 1; // Change direction for turn
      stageX += direction * 4; // Shift position to create a turn
    }

    stageX += levelWidth;
    if (i % 10 === 0) stageY += 1;

    if (i % 20 === 0 && stageY > 0 && Math.random() > 0.5) {
      // Introduce new level after a few platforms
      if (level < maxLevel) {
        level++;
        stageX = 0;
        stageY = 0;
        break;
      }
    }
  }
}

createLevel();

let keys = {};
let velocityY = 0;
let onGround = false;
let respawnPoint = new THREE.Vector3(0, 5, 0);

document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

let joystickStart = { x: 0, y: 0 }, joystickActive = false;
const joystick = document.getElementById('joystick');

joystick.addEventListener('touchstart', e => {
  joystickActive = true;
  joystickStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});

joystick.addEventListener('touchmove', e => {
  const dx = e.touches[0].clientX - joystickStart.x;
  const dy = e.touches[0].clientY - joystickStart.y;
  playerGroup.position.x += dx * 0.01;
  playerGroup.position.z -= dy * 0.01;
});

joystick.addEventListener('touchend', () => joystickActive = false);

document.getElementById('jumpButton').addEventListener('touchstart', () => {
  if (onGround) velocityY = 0.6;
});

function checkCollision(a, b) {
  const aBox = new THREE.Box3().setFromObject(a);
  const bBox = new THREE.Box3().setFromObject(b);
  return aBox.intersectsBox(bBox);
}

function checkCheckpoint() {
  for (const cp of checkpoints) {
    if (checkCollision(playerGroup, cp)) {
      respawnPoint = cp.position.clone();
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  const speed = 0.18; // increased speed
  if (keys['w']) playerGroup.position.z -= speed;
  if (keys['s']) playerGroup.position.z += speed;
  if (keys['a']) playerGroup.position.x -= speed;
  if (keys['d']) playerGroup.position.x += speed;

  velocityY -= 0.03;
  playerGroup.position.y += velocityY;
  onGround = false;

  for (const plat of platforms) {
    if (checkCollision(playerGroup, plat)) {
      const top = plat.position.y + 0.5;
      if (playerGroup.position.y - 0.5 <= top) {
        playerGroup.position.y = top + 0.5;
        velocityY = 0;
        onGround = true;
      }
    }
  }

  checkCheckpoint();
  if (onGround && keys[' ']) velocityY = 0.6;

  for (const kill of killBricks) {
    if (checkCollision(playerGroup, kill)) {
      playerGroup.position.copy(respawnPoint);
      velocityY = 0;
    }
  }

  for (const spin of spinners) {
    spin.rotation.y += 0.05;
    if (checkCollision(playerGroup, spin)) {
      playerGroup.position.x += 0.12 * Math.sin(spin.rotation.y);
      playerGroup.position.z += 0.12 * Math.cos(spin.rotation.y);
    }
  }

  if (playerGroup.position.y < -10) {
    playerGroup.position.copy(respawnPoint);
    velocityY = 0;
  }

  camera.position.x = playerGroup.position.x;
  camera.position.y = playerGroup.position.y + 5;
  camera.position.z = playerGroup.position.z + 10;
  camera.lookAt(playerGroup.position);

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
