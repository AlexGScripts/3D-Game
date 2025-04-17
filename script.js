// Updated JavaScript for faster player speed and easier jumps
// Includes 10 checkpoints, smoother movement, spinning platforms that push player

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff4444 })
);
player.position.set(0, 5, 0);
scene.add(player);

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

function createKillBrick(x, y, z, w = 4, d = 4) {
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
for (let i = 0; i < 100; i++) {
  if (i % 10 === 0 && i / 10 < 10) createCheckpoint(stageX, stageY, 0);
  else if (i % 15 === 0) createKillBrick(stageX, stageY, 0);
  else if (i % 7 === 0) createSpinner(stageX, stageY, 0);
  else createPlatform(stageX, stageY, 0);
  stageX += 6;
  if (i % 10 === 0) stageY += 1;
}

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
  player.position.x += dx * 0.01;
  player.position.z -= dy * 0.01;
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
    if (checkCollision(player, cp)) {
      respawnPoint = cp.position.clone();
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  const speed = 0.18; // increased speed
  if (keys['w']) player.position.z -= speed;
  if (keys['s']) player.position.z += speed;
  if (keys['a']) player.position.x -= speed;
  if (keys['d']) player.position.x += speed;

  velocityY -= 0.03;
  player.position.y += velocityY;
  onGround = false;

  for (const plat of platforms) {
    if (checkCollision(player, plat)) {
      const top = plat.position.y + 0.5;
      if (player.position.y - 0.5 <= top) {
        player.position.y = top + 0.5;
        velocityY = 0;
        onGround = true;
      }
    }
  }

  checkCheckpoint();
  if (onGround && keys[' ']) velocityY = 0.6;

  for (const kill of killBricks) {
    if (checkCollision(player, kill)) {
      player.position.copy(respawnPoint);
      velocityY = 0;
    }
  }

  for (const spin of spinners) {
    spin.rotation.y += 0.05;
    if (checkCollision(player, spin)) {
      player.position.x += 0.12 * Math.sin(spin.rotation.y);
      player.position.z += 0.12 * Math.cos(spin.rotation.y);
    }
  }

  if (player.position.y < -10) {
    player.position.copy(respawnPoint);
    velocityY = 0;
  }

  camera.position.x = player.position.x;
  camera.position.y = player.position.y + 5;
  camera.position.z = player.position.z + 10;
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
