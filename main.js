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
                    <pattern id="guilloche${label}" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="0.5" fill="rgba(255, 215, 0, 0.03)" />
                        <circle cx="3" cy="3" r="0.5" fill="rgba(255, 215, 0, 0.03)" />
                    </pattern>
                </defs>
                <circle cx="100" cy="100" r="85" fill="url(#guilloche${label})" opacity="0.5"/>
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
    
    // Removed particle animation
    
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