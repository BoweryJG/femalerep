import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Water } from 'three/examples/jsm/objects/Water';
import { Sky } from 'three/examples/jsm/objects/Sky';
import gsap from 'gsap';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);

const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('canvas'),
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Camera positioning for beach view
camera.position.set(0, 10, 30);
camera.lookAt(0, 0, 0);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 10;
controls.maxDistance = 100;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffc0cb, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffd700, 1);
directionalLight.position.set(100, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
scene.add(directionalLight);

// Add rim light for luxury feel
const rimLight = new THREE.DirectionalLight(0xff69b4, 0.5);
rimLight.position.set(-50, 50, -50);
scene.add(rimLight);

// Create Water
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
        'https://threejs.org/examples/textures/waternormals.jpg',
        function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffd700,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
});
water.rotation.x = -Math.PI / 2;
water.position.y = -2;
scene.add(water);

// Create Sky
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

// Sun position for sunset
const sun = new THREE.Vector3();
const phi = THREE.MathUtils.degToRad(88);
const theta = THREE.MathUtils.degToRad(180);
sun.setFromSphericalCoords(1, phi, theta);
skyUniforms['sunPosition'].value.copy(sun);
water.material.uniforms['sunDirection'].value.copy(sun).normalize();

// Beach sand
const sandGeometry = new THREE.PlaneGeometry(200, 100);
const sandMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4e4c1,
    roughness: 0.8,
    metalness: 0.1
});
const sand = new THREE.Mesh(sandGeometry, sandMaterial);
sand.rotation.x = -Math.PI / 2;
sand.position.y = -1.5;
sand.position.z = 40;
sand.receiveShadow = true;
scene.add(sand);

// Luxury car placeholder (simplified)
const carGroup = new THREE.Group();

// Car body
const carBodyGeometry = new THREE.BoxGeometry(4, 1.5, 8);
const carBodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff1493,
    metalness: 0.9,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    reflectivity: 1
});
const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
carBody.position.y = 1;
carBody.castShadow = true;
carGroup.add(carBody);

// Car wheels
const wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 32);
const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.8,
    roughness: 0.3
});

const wheelPositions = [
    [-1.5, 0.5, 2.5],
    [1.5, 0.5, 2.5],
    [-1.5, 0.5, -2.5],
    [1.5, 0.5, -2.5]
];

wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(...pos);
    wheel.castShadow = true;
    carGroup.add(wheel);
});

carGroup.position.set(0, 0, 25);
carGroup.rotation.y = Math.PI / 6;
scene.add(carGroup);

// Palm trees
function createPalmTree(x, z) {
    const treeGroup = new THREE.Group();
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 8, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.8
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 4;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Leaves
    const leafGeometry = new THREE.ConeGeometry(3, 3, 6);
    const leafMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        roughness: 0.7
    });
    
    for (let i = 0; i < 6; i++) {
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        const angle = (i / 6) * Math.PI * 2;
        leaf.position.set(Math.cos(angle) * 2, 8, Math.sin(angle) * 2);
        leaf.rotation.z = angle;
        leaf.castShadow = true;
        treeGroup.add(leaf);
    }
    
    treeGroup.position.set(x, 0, z);
    return treeGroup;
}

// Add palm trees
scene.add(createPalmTree(-15, 35));
scene.add(createPalmTree(15, 38));
scene.add(createPalmTree(-20, 45));
scene.add(createPalmTree(20, 42));

// Diamond particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 1000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.1,
    color: 0xffd700,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Create luxury gauges
function createGaugeElement(label, value) {
    const gaugeDiv = document.createElement('div');
    gaugeDiv.className = 'gauge';
    gaugeDiv.innerHTML = `
        <div class="gauge-face">
            <div class="gauge-needle" data-value="${value}"></div>
            <div class="gauge-center"></div>
        </div>
        <div class="gauge-label">${label}</div>
    `;
    
    // Add click interaction
    gaugeDiv.addEventListener('click', () => {
        const needle = gaugeDiv.querySelector('.gauge-needle');
        const currentRotation = parseFloat(needle.style.transform.match(/rotate\(([-\d.]+)deg\)/) || [0, 0])[1];
        const newRotation = Math.random() * 180 - 90;
        
        gsap.to(needle, {
            rotation: newRotation,
            duration: 1.5,
            ease: "elastic.out(1, 0.3)"
        });
        
        // Play chime sound
        const chimeSound = document.getElementById('chimeSound');
        if (chimeSound) {
            chimeSound.currentTime = 0;
            chimeSound.play().catch(() => {});
        }
        
        // Add sparkle effect
        createSparkle(gaugeDiv);
    });
    
    return gaugeDiv;
}

// Add gauges to container
const gaugeContainer = document.getElementById('gaugeContainer');
const gauges = [
    { label: 'Revenue', value: 75 },
    { label: 'Deals', value: 60 },
    { label: 'Clients', value: 85 }
];

gauges.forEach(gauge => {
    const gaugeElement = createGaugeElement(gauge.label, gauge.value);
    gaugeContainer.appendChild(gaugeElement);
    
    // Set initial needle position
    setTimeout(() => {
        const needle = gaugeElement.querySelector('.gauge-needle');
        gsap.to(needle, {
            rotation: gauge.value * 1.8 - 90,
            duration: 2,
            ease: "elastic.out(1, 0.5)"
        });
    }, 500);
});

// Sparkle effect
function createSparkle(element) {
    const sparkle = document.createElement('div');
    sparkle.style.position = 'absolute';
    sparkle.style.width = '4px';
    sparkle.style.height = '4px';
    sparkle.style.background = '#FFD700';
    sparkle.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    sparkle.style.left = '50%';
    sparkle.style.top = '50%';
    sparkle.style.transform = 'translate(-50%, -50%)';
    sparkle.style.pointerEvents = 'none';
    
    element.appendChild(sparkle);
    
    gsap.to(sparkle, {
        scale: 20,
        opacity: 0,
        duration: 1,
        ease: "power2.out",
        onComplete: () => sparkle.remove()
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Animate water
    water.material.uniforms['time'].value += 1.0 / 60.0;
    
    // Animate particles
    particlesMesh.rotation.y += 0.0005;
    
    // Subtle car animation
    carGroup.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    
    // Render scene
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();

// Add diamond particles to UI
function createDiamondParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'diamond-particles';
    document.getElementById('app').appendChild(particlesContainer);
    
    setInterval(() => {
        if (Math.random() > 0.7) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 5 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            particlesContainer.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => particle.remove(), 20000);
        }
    }, 2000);
}

createDiamondParticles();