// MAX AI OS v5 - holographic reactor
// Replace your current core.js with this version.

const container = document.querySelector(".ai-core-container");

if (container && window.THREE) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);
camera.position.z = 9;

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(container.clientWidth, container.clientHeight);

renderer.domElement.style.position = 'absolute';
renderer.domElement.style.inset = '0';
renderer.domElement.style.pointerEvents = 'none';

container.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0x203040, 0.6);
scene.add(ambient);

const light1 = new THREE.PointLight(0x38e8ff, 3, 20);
light1.position.set(3, 2, 5);
scene.add(light1);

const light2 = new THREE.PointLight(0x16d9c7, 2.5, 20);
light2.position.set(-3, -2, 5);
scene.add(light2);

const glow = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 64, 64),
    new THREE.MeshBasicMaterial({
        color: 0x38e8ff,
        transparent: true,
        opacity: 0.06
    })
);
scene.add(glow);

const core = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 64, 64),
    new THREE.MeshPhysicalMaterial({
        color: 0x38e8ff,
        emissive: 0x16d9c7,
        emissiveIntensity: 2.4,
        transmission: 0.4,
        roughness: 0.08,
        metalness: 0.1
    })
);
scene.add(core);

const rings = [];

for (let i = 0; i < 8; i++) {
    const arc = Math.PI * (0.45 + Math.random() * 0.35);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(
            2.2 + i * 0.2,
            0.02,
            16,
            220,
            arc
        ),
        new THREE.MeshBasicMaterial({
            color: i % 2 ? 0x16d9c7 : 0x38e8ff,
            transparent: true,
            opacity: 0.6
        })
    );

    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    ring.rotation.z = Math.random() * Math.PI;

    scene.add(ring);
    rings.push(ring);
}

const particleCount = 4200;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    const r = 2.1 + Math.random() * 1.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
);

const material = new THREE.PointsMaterial({
    color: 0x38e8ff,
    size: 0.018,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

let targetX = 0;
let targetY = 0;

window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.8;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.5;
});

let voiceLevel = 0;

window.setVoiceLevel = (v) => {
    voiceLevel = Math.max(0, Math.min(1, v));
};

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const t = clock.getElapsedTime();

    const pulse = 1 + Math.sin(t * 1.4) * 0.05;
    const voice = 1 + voiceLevel * 0.25;

    core.scale.setScalar(pulse * voice);
    glow.scale.setScalar(1.05 + Math.sin(t) * 0.05);

    particles.rotation.y += 0.0015;
    particles.rotation.x += 0.0006;

    rings.forEach((r, i) => {
        r.rotation.z += 0.0018 + i * 0.0006;
        r.rotation.y += 0.0012;

        const s = 1 + Math.sin(t * (1.1 + i * 0.18)) * 0.015;
        r.scale.setScalar(s);
    });

    scene.rotation.y += (targetX - scene.rotation.y) * 0.04;
    scene.rotation.x += (-targetY - scene.rotation.x) * 0.04;

    renderer.render(scene, camera);

    voiceLevel *= 0.9;
}

animate();

window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});
}
