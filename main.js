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

// Beach sand with realistic texture
const sandTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping;
sandTexture.repeat.set(50, 50);

// Create sand dunes with displacement
const sandGeometry = new THREE.PlaneGeometry(300, 150, 128, 128);
const sandMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4e4c1,
    roughness: 0.9,
    metalness: 0.05,
    map: sandTexture,
    displacementScale: 3,
    bumpScale: 0.5
});

// Create height variations for dunes
const sandVertices = sandGeometry.attributes.position.array;
for (let i = 0; i < sandVertices.length; i += 3) {
    const x = sandVertices[i];
    const y = sandVertices[i + 1];
    
    // Create dune-like formations
    const distance = Math.sqrt(x * x + y * y);
    const dune1 = Math.sin(x * 0.05) * Math.cos(y * 0.03) * 2;
    const dune2 = Math.sin(x * 0.02 + 1) * Math.cos(y * 0.04) * 3;
    const ripples = Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.2;
    
    sandVertices[i + 2] = dune1 + dune2 + ripples + Math.random() * 0.1;
}
sandGeometry.computeVertexNormals();

const sand = new THREE.Mesh(sandGeometry, sandMaterial);
sand.rotation.x = -Math.PI / 2;
sand.position.y = -1.5;
sand.position.z = 40;
sand.receiveShadow = true;
sand.castShadow = true;
scene.add(sand);

// Add multiple sand layers for depth
const farSandGeometry = new THREE.PlaneGeometry(400, 200, 64, 64);
const farSandMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8d4b0,
    roughness: 0.95,
    metalness: 0
});

// Create distant dunes
const farSandVertices = farSandGeometry.attributes.position.array;
for (let i = 0; i < farSandVertices.length; i += 3) {
    const x = farSandVertices[i];
    const y = farSandVertices[i + 1];
    farSandVertices[i + 2] = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 5 + Math.random() * 0.5;
}
farSandGeometry.computeVertexNormals();

const farSand = new THREE.Mesh(farSandGeometry, farSandMaterial);
farSand.rotation.x = -Math.PI / 2;
farSand.position.y = -2;
farSand.position.z = 80;
farSand.receiveShadow = true;
scene.add(farSand);

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

// Sand particles for wind effect
const sandParticlesGeometry = new THREE.BufferGeometry();
const sandParticlesCount = 2000;
const sandPosArray = new Float32Array(sandParticlesCount * 3);

for (let i = 0; i < sandParticlesCount * 3; i += 3) {
    sandPosArray[i] = (Math.random() - 0.5) * 200; // x
    sandPosArray[i + 1] = Math.random() * 10 - 2; // y
    sandPosArray[i + 2] = (Math.random() - 0.5) * 100 + 40; // z
}

sandParticlesGeometry.setAttribute('position', new THREE.BufferAttribute(sandPosArray, 3));

const sandParticlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xf4e4c1,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});

const sandParticles = new THREE.Points(sandParticlesGeometry, sandParticlesMaterial);
scene.add(sandParticles);

// Beach grass
function createBeachGrass(x, z) {
    const grassGroup = new THREE.Group();
    
    for (let i = 0; i < 15; i++) {
        const grassGeometry = new THREE.ConeGeometry(0.05, 2 + Math.random(), 4);
        const grassMaterial = new THREE.MeshStandardMaterial({
            color: 0x7cfc00,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.position.x = (Math.random() - 0.5) * 2;
        grass.position.z = (Math.random() - 0.5) * 2;
        grass.position.y = 1;
        grass.rotation.z = (Math.random() - 0.5) * 0.3;
        grass.userData.originalRotation = grass.rotation.z;
        grassGroup.add(grass);
    }
    
    grassGroup.position.set(x, -1, z);
    return grassGroup;
}

// Add beach grass clusters
scene.add(createBeachGrass(-10, 30));
scene.add(createBeachGrass(10, 32));
scene.add(createBeachGrass(-25, 40));
scene.add(createBeachGrass(25, 38));
scene.add(createBeachGrass(0, 35));

// Seashells and beach debris
function createSeashell(x, z) {
    const shellGeometry = new THREE.SphereGeometry(0.2, 16, 8);
    shellGeometry.scale(1, 0.6, 0.8);
    
    const shellMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffdab9,
        metalness: 0.1,
        roughness: 0.3,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2
    });
    
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.position.set(x, -1.3 + Math.random() * 0.1, z);
    shell.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    shell.scale.setScalar(0.5 + Math.random() * 0.5);
    shell.castShadow = true;
    
    return shell;
}

// Driftwood
function createDriftwood(x, z) {
    const woodGeometry = new THREE.CylinderGeometry(0.1, 0.15, 3 + Math.random() * 2, 6);
    const woodMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.9,
        metalness: 0
    });
    
    const wood = new THREE.Mesh(woodGeometry, woodMaterial);
    wood.position.set(x, -1.2, z);
    wood.rotation.set(Math.PI / 2 + Math.random() * 0.3, Math.random() * Math.PI, 0);
    wood.castShadow = true;
    
    return wood;
}

// Add shells and driftwood
for (let i = 0; i < 15; i++) {
    scene.add(createSeashell(
        (Math.random() - 0.5) * 60,
        20 + Math.random() * 30
    ));
}

for (let i = 0; i < 5; i++) {
    scene.add(createDriftwood(
        (Math.random() - 0.5) * 40,
        25 + Math.random() * 20
    ));
}

// Foam where waves meet sand
const foamGeometry = new THREE.PlaneGeometry(150, 20, 64, 16);
const foamMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.7,
    roughness: 0.1,
    metalness: 0,
    emissive: 0xffffff,
    emissiveIntensity: 0.1
});

// Create foam wave pattern
const foamVertices = foamGeometry.attributes.position.array;
for (let i = 0; i < foamVertices.length; i += 3) {
    const x = foamVertices[i];
    foamVertices[i + 2] = Math.sin(x * 0.1) * 0.3 + Math.random() * 0.1;
}
foamGeometry.computeVertexNormals();

const foam = new THREE.Mesh(foamGeometry, foamMaterial);
foam.rotation.x = -Math.PI / 2;
foam.position.set(0, -1.4, 10);
scene.add(foam);

// Create crabs
function createCrab() {
    const crabGroup = new THREE.Group();
    
    // Crab body
    const bodyGeometry = new THREE.SphereGeometry(0.3, 8, 6);
    bodyGeometry.scale(1.2, 0.6, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6347,
        roughness: 0.7,
        metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    crabGroup.add(body);
    
    // Crab claws
    const clawGeometry = new THREE.SphereGeometry(0.15, 6, 4);
    clawGeometry.scale(1.5, 1, 0.8);
    
    const leftClaw = new THREE.Mesh(clawGeometry, bodyMaterial);
    leftClaw.position.set(-0.4, 0, 0.2);
    leftClaw.rotation.z = -0.3;
    crabGroup.add(leftClaw);
    
    const rightClaw = new THREE.Mesh(clawGeometry, bodyMaterial);
    rightClaw.position.set(0.4, 0, 0.2);
    rightClaw.rotation.z = 0.3;
    crabGroup.add(rightClaw);
    
    // Crab legs
    const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
    const legMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4500,
        roughness: 0.8
    });
    
    for (let i = 0; i < 3; i++) {
        // Left legs
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.3, -0.1, -0.1 + i * 0.1);
        leftLeg.rotation.z = -Math.PI / 3;
        crabGroup.add(leftLeg);
        
        // Right legs
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.3, -0.1, -0.1 + i * 0.1);
        rightLeg.rotation.z = Math.PI / 3;
        crabGroup.add(rightLeg);
    }
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 0.15, 0.2);
    crabGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 0.15, 0.2);
    crabGroup.add(rightEye);
    
    // Random initial position
    crabGroup.position.set(
        (Math.random() - 0.5) * 40,
        -1.2,
        20 + Math.random() * 20
    );
    crabGroup.scale.setScalar(0.5 + Math.random() * 0.3);
    
    // Store movement data
    crabGroup.userData = {
        speed: 0.02 + Math.random() * 0.03,
        direction: Math.random() * Math.PI * 2,
        changeDirectionTime: Date.now() + Math.random() * 5000
    };
    
    return crabGroup;
}

// Add crabs to scene
const crabs = [];
for (let i = 0; i < 8; i++) {
    const crab = createCrab();
    crabs.push(crab);
    scene.add(crab);
}

// Create fish
function createFish() {
    const fishGroup = new THREE.Group();
    
    // Fish body
    const bodyGeometry = new THREE.SphereGeometry(0.4, 8, 6);
    bodyGeometry.scale(1.5, 0.7, 0.5);
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x4169e1,
        metalness: 0.6,
        roughness: 0.2,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    fishGroup.add(body);
    
    // Fish tail
    const tailGeometry = new THREE.ConeGeometry(0.3, 0.6, 4);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(-0.8, 0, 0);
    tail.rotation.z = -Math.PI / 2;
    tail.scale.set(1, 1.5, 0.5);
    fishGroup.add(tail);
    
    // Fish fin
    const finGeometry = new THREE.ConeGeometry(0.2, 0.3, 3);
    const topFin = new THREE.Mesh(finGeometry, bodyMaterial);
    topFin.position.set(0, 0.3, 0);
    topFin.scale.set(0.5, 1, 0.3);
    fishGroup.add(topFin);
    
    // Store jump data
    fishGroup.userData = {
        jumpTime: Date.now() + Math.random() * 10000,
        jumpDuration: 2000,
        startPos: new THREE.Vector3(
            (Math.random() - 0.5) * 60,
            -3,
            -10 + Math.random() * 20
        )
    };
    
    fishGroup.position.copy(fishGroup.userData.startPos);
    
    return fishGroup;
}

// Add fish to scene
const fishes = [];
for (let i = 0; i < 5; i++) {
    const fish = createFish();
    fishes.push(fish);
    scene.add(fish);
}

// Diamond particles - removed for cleaner look

// Create luxury gauges
function createGaugeElement(label, value, maxValue = 100) {
    const gaugeDiv = document.createElement('div');
    gaugeDiv.className = 'gauge';
    
    // Create tick marks
    let ticksHTML = '<div class="gauge-ticks">';
    for (let i = 0; i <= 10; i++) {
        const angle = (i * 18) - 90;
        const isMajor = i % 2 === 0;
        ticksHTML += `<div class="gauge-tick ${isMajor ? 'major' : ''}" style="transform: translateX(-50%) rotate(${angle}deg)"></div>`;
    }
    ticksHTML += '</div>';
    
    // Create numbers
    let numbersHTML = '<div class="gauge-numbers">';
    for (let i = 0; i <= 10; i += 2) {
        const angle = (i * 18) - 90;
        const numberValue = (i * 10);
        numbersHTML += `<div class="gauge-number" style="transform: translateX(-50%) rotate(${angle}deg)">
            <span style="transform: rotate(${-angle}deg); display: inline-block;">${numberValue}</span>
        </div>`;
    }
    numbersHTML += '</div>';
    
    // Determine texture pattern based on gauge type
    let texturePattern = '';
    if (label === 'Revenue') {
        // Tapisserie (waffle) pattern
        texturePattern = `
            <pattern id="tapisserie${label}" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="5" height="5" fill="rgba(255, 215, 0, 0.05)" />
                <rect x="5" y="5" width="5" height="5" fill="rgba(255, 215, 0, 0.05)" />
                <rect x="0" y="0" width="10" height="10" fill="none" stroke="rgba(255, 182, 193, 0.1)" stroke-width="0.5" />
            </pattern>
        `;
    } else if (label === 'Deals') {
        // Sunburst pattern
        texturePattern = `
            <pattern id="sunburst${label}" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <g transform="translate(100,100)">
                    ${Array.from({length: 36}, (_, i) => {
                        const angle = i * 10;
                        return `<line x1="0" y1="0" x2="0" y2="-90" stroke="rgba(255, 215, 0, 0.03)" stroke-width="0.5" transform="rotate(${angle})" />`;
                    }).join('')}
                </g>
            </pattern>
        `;
    } else {
        // Meteorite pattern
        texturePattern = `
            <pattern id="meteorite${label}" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="2" fill="rgba(255, 255, 255, 0.05)" />
                <circle cx="15" cy="12" r="1.5" fill="rgba(255, 182, 193, 0.04)" />
                <circle cx="25" cy="20" r="2.5" fill="rgba(255, 215, 0, 0.03)" />
                <circle cx="8" cy="25" r="1" fill="rgba(255, 255, 255, 0.04)" />
            </pattern>
        `;
    }
    
    // Create zones
    const zonesHTML = `
        <div class="gauge-zones">
            <svg width="200" height="200" style="position: absolute; top: 0; left: 0;">
                <defs>
                    <linearGradient id="greenZone${label}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#90EE90;stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:#228B22;stop-opacity:0.1" />
                    </linearGradient>
                    <linearGradient id="yellowZone${label}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#FFD700;stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:#FFA500;stop-opacity:0.1" />
                    </linearGradient>
                    <linearGradient id="redZone${label}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#FF69B4;stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:#FF1493;stop-opacity:0.1" />
                    </linearGradient>
                    ${texturePattern}
                </defs>
                <circle cx="100" cy="100" r="90" fill="url(#${label === 'Revenue' ? 'tapisserie' : label === 'Deals' ? 'sunburst' : 'meteorite'}${label})" opacity="0.8"/>
                <path d="M 100 10 A 90 90 0 0 1 170 50" fill="none" stroke="url(#greenZone${label})" stroke-width="30" opacity="0.5"/>
                <path d="M 170 50 A 90 90 0 0 1 190 100" fill="none" stroke="url(#yellowZone${label})" stroke-width="30" opacity="0.5"/>
                <path d="M 190 100 A 90 90 0 0 1 170 150" fill="none" stroke="url(#redZone${label})" stroke-width="30" opacity="0.5"/>
            </svg>
        </div>
    `;
    
    // Create diamond bezel
    let diamondBezelHTML = '<div class="gauge-bezel">';
    for (let i = 0; i < 60; i++) {
        const angle = (i * 6) - 90;
        const isDiamond = i % 5 === 0;
        if (isDiamond) {
            diamondBezelHTML += `<div class="bezel-diamond" style="transform: rotate(${angle}deg) translateY(-95px)">
                <div class="diamond-sparkle"></div>
            </div>`;
        }
    }
    diamondBezelHTML += '</div>';
    
    // Create complications (mini dials)
    const complicationsHTML = `
        <div class="gauge-complications">
            <div class="complication complication-seconds" style="transform: translate(-30px, -30px)">
                <div class="complication-hand"></div>
                <div class="complication-center"></div>
            </div>
            <div class="complication complication-date" style="transform: translate(30px, -30px)">
                <div class="date-window">${new Date().getDate()}</div>
            </div>
        </div>
    `;
    
    gaugeDiv.innerHTML = `
        <div class="gauge-face">
            ${zonesHTML}
            ${ticksHTML}
            ${numbersHTML}
            ${complicationsHTML}
            <div class="gauge-needle" data-value="${value}"></div>
            <div class="gauge-center"></div>
            <div class="gauge-value">${value}%</div>
            ${diamondBezelHTML}
        </div>
        <div class="gauge-label">${label}</div>
    `;
    
    // Add click interaction
    gaugeDiv.addEventListener('click', () => {
        const needle = gaugeDiv.querySelector('.gauge-needle');
        const valueDisplay = gaugeDiv.querySelector('.gauge-value');
        const newValue = Math.floor(Math.random() * 100);
        const newRotation = (newValue * 1.8) - 90;
        
        gsap.to(needle, {
            rotation: newRotation,
            duration: 1.5,
            ease: "elastic.out(1, 0.3)",
            onUpdate: function() {
                const currentRotation = gsap.getProperty(needle, "rotation");
                const currentValue = Math.round((currentRotation + 90) / 1.8);
                valueDisplay.textContent = `${currentValue}%`;
            }
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

gauges.forEach((gauge, index) => {
    const gaugeElement = createGaugeElement(gauge.label, gauge.value);
    gaugeContainer.appendChild(gaugeElement);
    
    // Set initial needle position with staggered animation
    setTimeout(() => {
        const needle = gaugeElement.querySelector('.gauge-needle');
        const valueDisplay = gaugeElement.querySelector('.gauge-value');
        gsap.to(needle, {
            rotation: gauge.value * 1.8 - 90,
            duration: 2,
            ease: "elastic.out(1, 0.5)",
            delay: index * 0.2,
            onUpdate: function() {
                const currentRotation = gsap.getProperty(needle, "rotation");
                const currentValue = Math.round((currentRotation + 90) / 1.8);
                valueDisplay.textContent = `${currentValue}%`;
            }
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
    
    // Animate sand particles (wind effect)
    const sandPositions = sandParticles.geometry.attributes.position.array;
    for (let i = 0; i < sandPositions.length; i += 3) {
        sandPositions[i] += Math.sin(Date.now() * 0.001 + i) * 0.02; // x drift
        sandPositions[i + 1] += Math.sin(Date.now() * 0.002 + i) * 0.01; // y float
        
        // Reset particles that drift too far
        if (sandPositions[i] > 100) sandPositions[i] = -100;
        if (sandPositions[i + 1] > 10) sandPositions[i + 1] = -2;
    }
    sandParticles.geometry.attributes.position.needsUpdate = true;
    
    // Animate foam
    foam.material.opacity = 0.6 + Math.sin(Date.now() * 0.002) * 0.2;
    foam.position.z = 10 + Math.sin(Date.now() * 0.001) * 2;
    
    // Subtle car animation
    carGroup.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    
    // Animate beach grass
    scene.traverse((child) => {
        if (child.material && child.material.color && child.material.color.r === 0.486) { // grass color check
            child.rotation.z = child.userData.originalRotation + Math.sin(Date.now() * 0.001) * 0.1;
        }
    });
    
    // Animate crabs
    crabs.forEach(crab => {
        const now = Date.now();
        
        // Change direction occasionally
        if (now > crab.userData.changeDirectionTime) {
            crab.userData.direction += (Math.random() - 0.5) * Math.PI;
            crab.userData.changeDirectionTime = now + 3000 + Math.random() * 5000;
        }
        
        // Sideways scuttling movement
        const dx = Math.cos(crab.userData.direction) * crab.userData.speed;
        const dz = Math.sin(crab.userData.direction) * crab.userData.speed;
        
        crab.position.x += dx;
        crab.position.z += dz;
        
        // Face movement direction
        crab.rotation.y = crab.userData.direction + Math.PI / 2;
        
        // Add scuttling animation
        crab.position.y = -1.2 + Math.abs(Math.sin(now * 0.01)) * 0.02;
        crab.rotation.z = Math.sin(now * 0.01) * 0.1;
        
        // Keep crabs on beach
        if (Math.abs(crab.position.x) > 30) crab.userData.direction += Math.PI;
        if (crab.position.z < 15 || crab.position.z > 45) crab.userData.direction += Math.PI;
    });
    
    // Animate fish
    fishes.forEach(fish => {
        const now = Date.now();
        
        if (now > fish.userData.jumpTime) {
            const jumpProgress = (now - fish.userData.jumpTime) / fish.userData.jumpDuration;
            
            if (jumpProgress < 1) {
                // Jumping arc
                const arc = Math.sin(jumpProgress * Math.PI);
                fish.position.y = -3 + arc * 5;
                fish.position.z = fish.userData.startPos.z + jumpProgress * 10;
                
                // Rotate during jump
                fish.rotation.x = jumpProgress * Math.PI * 2;
                fish.rotation.z = Math.sin(jumpProgress * Math.PI) * 0.3;
            } else {
                // Reset for next jump
                fish.position.copy(fish.userData.startPos);
                fish.userData.jumpTime = now + 5000 + Math.random() * 10000;
                fish.rotation.set(0, 0, 0);
            }
        } else {
            // Swimming underwater
            fish.position.y = -3 + Math.sin(now * 0.001) * 0.2;
            fish.rotation.z = Math.sin(now * 0.002) * 0.1;
        }
    });
    
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

// Real-time data updates
function updateDashboardData() {
    const statsPanel = document.querySelector('.stats-panel');
    const gauges = document.querySelectorAll('.gauge');
    
    // Simulate real-time updates
    setInterval(() => {
        // Update stats panel
        const dailyGoal = statsPanel.querySelector('.stat-item:nth-child(1) .stat-value');
        const achievement = statsPanel.querySelector('.stat-item:nth-child(2) .stat-value');
        
        // Animate stats with small random changes
        const currentAchievement = parseInt(achievement.textContent);
        const newAchievement = Math.max(0, Math.min(100, currentAchievement + (Math.random() - 0.5) * 5));
        
        gsap.to(achievement, {
            textContent: Math.round(newAchievement) + '%',
            duration: 1,
            ease: "power2.inOut",
            snap: { textContent: 1 }
        });
        
        // Occasionally update a random gauge
        if (Math.random() > 0.8) {
            const randomGauge = gauges[Math.floor(Math.random() * gauges.length)];
            const needle = randomGauge.querySelector('.gauge-needle');
            const valueDisplay = randomGauge.querySelector('.gauge-value');
            const currentValue = parseInt(valueDisplay.textContent);
            const change = (Math.random() - 0.5) * 20;
            const newValue = Math.max(0, Math.min(100, currentValue + change));
            const newRotation = (newValue * 1.8) - 90;
            
            gsap.to(needle, {
                rotation: newRotation,
                duration: 1.5,
                ease: "power2.inOut",
                onUpdate: function() {
                    const currentRotation = gsap.getProperty(needle, "rotation");
                    const currentValue = Math.round((currentRotation + 90) / 1.8);
                    valueDisplay.textContent = `${currentValue}%`;
                }
            });
            
            // Add subtle glow effect on update
            randomGauge.style.filter = 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))';
            setTimeout(() => {
                randomGauge.style.filter = '';
            }, 1000);
        }
    }, 3000);
}

// Initialize real-time updates
setTimeout(updateDashboardData, 2000);