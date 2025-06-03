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
    alpha: false
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;

// Camera positioning for beach view
camera.position.set(0, 15, 50);
camera.lookAt(0, 0, 0);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 10;
controls.maxDistance = 100;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffc0cb, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffd700, 1.2);
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

// Create Water with enhanced quality
const waterGeometry = new THREE.PlaneGeometry(10000, 10000, 512, 512);
const water = new Water(waterGeometry, {
    textureWidth: 1024,
    textureHeight: 1024,
    waterNormals: new THREE.TextureLoader().load(
        'https://threejs.org/examples/textures/waternormals.jpg',
        function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 4);
        }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e2f,
    distortionScale: 2.0,
    fog: scene.fog !== undefined,
    alpha: 0.95
});
water.rotation.x = -Math.PI / 2;
water.position.y = -2;
water.material.uniforms['size'].value = 10.0;
scene.add(water);

// Create Sky
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 2;
skyUniforms['rayleigh'].value = 1;
skyUniforms['mieCoefficient'].value = 0.003;
skyUniforms['mieDirectionalG'].value = 0.97;

// Sun position for sunset
const sun = new THREE.Vector3();
const phi = THREE.MathUtils.degToRad(88);
const theta = THREE.MathUtils.degToRad(180);
sun.setFromSphericalCoords(1, phi, theta);
skyUniforms['sunPosition'].value.copy(sun);
water.material.uniforms['sunDirection'].value.copy(sun).normalize();

// Beach sand with realistic texture - create procedural sand texture
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const ctx = canvas.getContext('2d');

// Create grainy sand texture
const imageData = ctx.createImageData(512, 512);
const data = imageData.data;

for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random();
    const value = 230 + noise * 25;
    data[i] = value;     // R
    data[i + 1] = value - 10; // G
    data[i + 2] = value - 30; // B
    data[i + 3] = 255;   // A
}

ctx.putImageData(imageData, 0, 0);
const sandTexture = new THREE.CanvasTexture(canvas);
sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping;
sandTexture.repeat.set(100, 100);

// Create normal map for sand
const normalCanvas = document.createElement('canvas');
normalCanvas.width = 256;
normalCanvas.height = 256;
const normalCtx = normalCanvas.getContext('2d');
const normalImageData = normalCtx.createImageData(256, 256);
const normalData = normalImageData.data;

for (let i = 0; i < normalData.length; i += 4) {
    normalData[i] = 128 + Math.random() * 50 - 25;     // R
    normalData[i + 1] = 128 + Math.random() * 50 - 25; // G
    normalData[i + 2] = 255;                            // B
    normalData[i + 3] = 255;                            // A
}

normalCtx.putImageData(normalImageData, 0, 0);
const sandNormalMap = new THREE.CanvasTexture(normalCanvas);
sandNormalMap.wrapS = sandNormalMap.wrapT = THREE.RepeatWrapping;
sandNormalMap.repeat.set(50, 50);

// Create sand dunes with displacement
const sandGeometry = new THREE.PlaneGeometry(300, 150, 256, 256);
const sandMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4e4c1,
    roughness: 0.95,
    metalness: 0.0,
    map: sandTexture,
    normalMap: sandNormalMap,
    normalScale: new THREE.Vector2(0.3, 0.3),
    displacementScale: 4,
    bumpScale: 0.3
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


// Palm trees
function createPalmTree(x, z) {
    const treeGroup = new THREE.Group();
    
    // Trunk with curved segments
    const trunkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.2, 2, 0.1),
        new THREE.Vector3(0.3, 4, 0.2),
        new THREE.Vector3(0.2, 6, 0.1),
        new THREE.Vector3(0, 8, 0)
    ]);
    
    const trunkGeometry = new THREE.TubeGeometry(trunkCurve, 20, 0.4, 8, false);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B6F47,
        roughness: 0.9,
        metalness: 0.1
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Create realistic palm fronds
    const frondCount = 12;
    for (let i = 0; i < frondCount; i++) {
        const frondGroup = new THREE.Group();
        
        // Main frond stem
        const stemCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, -0.5, 0),
            new THREE.Vector3(2.5, -1.5, 0),
            new THREE.Vector3(4, -2.5, 0)
        ]);
        
        const stemGeometry = new THREE.TubeGeometry(stemCurve, 10, 0.05, 4, false);
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0x4F7942,
            roughness: 0.8
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        frondGroup.add(stem);
        
        // Leaflets
        const leafletCount = 30;
        for (let j = 0; j < leafletCount; j++) {
            const t = j / leafletCount;
            const pos = stemCurve.getPointAt(t);
            
            const leafletGeometry = new THREE.PlaneGeometry(0.3, 0.8 * (1 - t * 0.5));
            const leafletMaterial = new THREE.MeshStandardMaterial({
                color: 0x3CB371,
                side: THREE.DoubleSide,
                roughness: 0.7
            });
            
            const leaflet = new THREE.Mesh(leafletGeometry, leafletMaterial);
            leaflet.position.copy(pos);
            leaflet.rotation.x = -Math.PI / 4 + Math.random() * 0.2;
            leaflet.rotation.z = (j % 2 === 0 ? 1 : -1) * (Math.PI / 4 + Math.random() * 0.2);
            frondGroup.add(leaflet);
        }
        
        // Position and rotate frond
        const angle = (i / frondCount) * Math.PI * 2;
        frondGroup.position.set(0, 8, 0);
        frondGroup.rotation.y = angle;
        frondGroup.rotation.z = Math.PI / 6 + Math.random() * 0.2;
        
        treeGroup.add(frondGroup);
    }
    
    // Add coconuts
    const coconutGeometry = new THREE.SphereGeometry(0.15, 8, 6);
    const coconutMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8
    });
    
    for (let i = 0; i < 4; i++) {
        const coconut = new THREE.Mesh(coconutGeometry, coconutMaterial);
        coconut.position.set(
            (Math.random() - 0.5) * 0.5,
            7.5 + Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        coconut.castShadow = true;
        treeGroup.add(coconut);
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
for (let i = 0; i < 25; i++) {
    scene.add(createSeashell(
        (Math.random() - 0.5) * 80,
        15 + Math.random() * 40
    ));
}

for (let i = 0; i < 8; i++) {
    scene.add(createDriftwood(
        (Math.random() - 0.5) * 60,
        20 + Math.random() * 30
    ));
}

// Create seaweed and kelp
function createSeaweed(x, z) {
    const seaweedGroup = new THREE.Group();
    
    // Create multiple strands
    for (let i = 0; i < 3 + Math.random() * 3; i++) {
        const strandCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.3, (Math.random() - 0.5) * 0.3),
            new THREE.Vector3((Math.random() - 0.5) * 1, 0.8, (Math.random() - 0.5) * 0.5),
            new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.2, (Math.random() - 0.5) * 0.8)
        ]);
        
        const strandGeometry = new THREE.TubeGeometry(strandCurve, 20, 0.02, 6, false);
        const strandMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.6, 0.2),
            roughness: 0.8,
            metalness: 0
        });
        
        const strand = new THREE.Mesh(strandGeometry, strandMaterial);
        strand.userData.originalRotation = strand.rotation.z;
        seaweedGroup.add(strand);
    }
    
    seaweedGroup.position.set(x, -1.4, z);
    seaweedGroup.rotation.y = Math.random() * Math.PI * 2;
    seaweedGroup.scale.setScalar(0.5 + Math.random() * 0.5);
    
    return seaweedGroup;
}

// Add scattered seaweed
for (let i = 0; i < 15; i++) {
    scene.add(createSeaweed(
        (Math.random() - 0.5) * 80,
        12 + Math.random() * 25
    ));
}

// Add sand ripples
const rippleGroup = new THREE.Group();
for (let i = 0; i < 50; i++) {
    const rippleGeometry = new THREE.PlaneGeometry(
        2 + Math.random() * 3,
        0.2,
        32,
        2
    );
    
    // Create wave pattern
    const rippleVertices = rippleGeometry.attributes.position.array;
    for (let j = 0; j < rippleVertices.length; j += 3) {
        const x = rippleVertices[j];
        rippleVertices[j + 2] = Math.sin(x * 2) * 0.05;
    }
    rippleGeometry.computeVertexNormals();
    
    const rippleMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8d4b0,
        roughness: 0.9,
        metalness: 0
    });
    
    const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
    ripple.rotation.x = -Math.PI / 2;
    ripple.rotation.z = Math.random() * Math.PI;
    ripple.position.set(
        (Math.random() - 0.5) * 100,
        -1.4 + Math.random() * 0.1,
        (Math.random() - 0.5) * 60 + 20
    );
    ripple.castShadow = true;
    ripple.receiveShadow = true;
    rippleGroup.add(ripple);
}
scene.add(rippleGroup);

// Create footprints in sand
function createFootprint(x, z, rotation = 0) {
    const footprintGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.05, 8);
    footprintGeometry.scale(1.5, 1, 1);
    const footprintMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4a574,
        roughness: 0.9,
        metalness: 0
    });
    
    const footprint = new THREE.Mesh(footprintGeometry, footprintMaterial);
    footprint.position.set(x, -1.42, z);
    footprint.rotation.y = rotation;
    
    return footprint;
}

// Add a trail of footprints
const footprintTrail = [];
for (let i = 0; i < 20; i++) {
    const pathX = -20 + i * 2 + (Math.random() - 0.5) * 0.5;
    const pathZ = 25 + Math.sin(i * 0.3) * 3;
    const isLeft = i % 2 === 0;
    
    const footprint = createFootprint(
        pathX + (isLeft ? -0.3 : 0.3),
        pathZ,
        Math.atan2(2, Math.cos(i * 0.3) * 3 * 0.3)
    );
    footprintTrail.push(footprint);
    scene.add(footprint);
}

// Create wet sand near shoreline with reflections
const wetSandGeometry = new THREE.PlaneGeometry(200, 40, 128, 32);
const wetSandMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xa67c4a,
    roughness: 0.1,
    metalness: 0.3,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    reflectivity: 0.8,
    transparent: true,
    opacity: 0.9
});

// Create wet sand ripples
const wetSandVertices = wetSandGeometry.attributes.position.array;
for (let i = 0; i < wetSandVertices.length; i += 3) {
    const x = wetSandVertices[i];
    const y = wetSandVertices[i + 1];
    wetSandVertices[i + 2] = Math.sin(x * 0.1) * 0.05 + Math.sin(y * 0.15) * 0.03;
}
wetSandGeometry.computeVertexNormals();

const wetSand = new THREE.Mesh(wetSandGeometry, wetSandMaterial);
wetSand.rotation.x = -Math.PI / 2;
wetSand.position.set(0, -1.35, 10);
wetSand.receiveShadow = true;
scene.add(wetSand);

// Create tidal pools
function createTidalPool(x, z, size = 3) {
    const poolGroup = new THREE.Group();
    
    // Pool depression
    const poolGeometry = new THREE.CylinderGeometry(size, size * 0.8, 0.3, 16);
    const poolMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B6F47,
        roughness: 0.9
    });
    const poolDepression = new THREE.Mesh(poolGeometry, poolMaterial);
    poolDepression.position.y = -0.15;
    poolGroup.add(poolDepression);
    
    // Pool water
    const waterGeometry = new THREE.CylinderGeometry(size * 0.9, size * 0.7, 0.1, 16);
    const waterMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x006994,
        transparent: true,
        opacity: 0.8,
        roughness: 0.0,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        reflectivity: 1.0
    });
    const poolWater = new THREE.Mesh(waterGeometry, waterMaterial);
    poolWater.position.y = -0.05;
    poolGroup.add(poolWater);
    
    // Add small rocks around pool
    for (let i = 0; i < 8; i++) {
        const rockGeometry = new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.1, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.3, 0.3, 0.3)
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        const angle = (i / 8) * Math.PI * 2;
        rock.position.set(
            Math.cos(angle) * (size + 0.5),
            Math.random() * 0.1,
            Math.sin(angle) * (size + 0.5)
        );
        rock.castShadow = true;
        poolGroup.add(rock);
    }
    
    poolGroup.position.set(x, -1.3, z);
    return poolGroup;
}

// Add tidal pools
for (let i = 0; i < 5; i++) {
    scene.add(createTidalPool(
        (Math.random() - 0.5) * 60,
        18 + Math.random() * 15,
        2 + Math.random() * 2
    ));
}

// Create beach umbrella
function createBeachUmbrella(x, z) {
    const umbrellaGroup = new THREE.Group();
    
    // Umbrella pole
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 2;
    pole.castShadow = true;
    umbrellaGroup.add(pole);
    
    // Umbrella canopy
    const canopyGeometry = new THREE.ConeGeometry(3, 1.5, 12);
    const canopyMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
        roughness: 0.4,
        side: THREE.DoubleSide
    });
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.y = 4.5;
    canopy.castShadow = true;
    umbrellaGroup.add(canopy);
    
    umbrellaGroup.position.set(x, -1.5, z);
    return umbrellaGroup;
}

// Create beach towel
function createBeachTowel(x, z) {
    const towelGeometry = new THREE.PlaneGeometry(2, 3, 1, 1);
    const towelMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        roughness: 0.7,
        side: THREE.DoubleSide
    });
    
    const towel = new THREE.Mesh(towelGeometry, towelMaterial);
    towel.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    towel.rotation.z = Math.random() * Math.PI * 2;
    towel.position.set(x, -1.4, z);
    towel.receiveShadow = true;
    
    return towel;
}

// Add beach amenities
for (let i = 0; i < 3; i++) {
    scene.add(createBeachUmbrella(
        (Math.random() - 0.5) * 40,
        30 + Math.random() * 20
    ));
    
    scene.add(createBeachTowel(
        (Math.random() - 0.5) * 50,
        25 + Math.random() * 25
    ));
}

// Enhanced shoreline with breaking waves
const shorelineGroup = new THREE.Group();

// Main foam line where waves meet sand
const foamGeometry = new THREE.PlaneGeometry(180, 30, 128, 32);
const foamMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    roughness: 0.1,
    metalness: 0,
    emissive: 0xffffff,
    emissiveIntensity: 0.15
});

// Create foam wave pattern with more detail
const foamVertices = foamGeometry.attributes.position.array;
for (let i = 0; i < foamVertices.length; i += 3) {
    const x = foamVertices[i];
    const y = foamVertices[i + 1];
    // Multiple wave frequencies for realistic foam
    foamVertices[i + 2] = 
        Math.sin(x * 0.1) * 0.5 + 
        Math.sin(x * 0.3 + 1) * 0.2 + 
        Math.sin(y * 0.2) * 0.15 +
        Math.random() * 0.1;
}
foamGeometry.computeVertexNormals();

const foam = new THREE.Mesh(foamGeometry, foamMaterial);
foam.rotation.x = -Math.PI / 2;
foam.position.set(0, -1.3, 10);
shorelineGroup.add(foam);

// Secondary foam line (receding wave)
const foamLine2 = foam.clone();
foamLine2.material = foamMaterial.clone();
foamLine2.material.opacity = 0.4;
foamLine2.position.z = 15;
foamLine2.scale.x = 0.8;
shorelineGroup.add(foamLine2);

// Wet sand effect near shore
const shoreWetSandGeometry = new THREE.PlaneGeometry(200, 40, 64, 16);
const shoreWetSandMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a574,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 0.6
});

const shoreWetSand = new THREE.Mesh(shoreWetSandGeometry, shoreWetSandMaterial);
shoreWetSand.rotation.x = -Math.PI / 2;
shoreWetSand.position.set(0, -1.45, 20);
shorelineGroup.add(shoreWetSand);

// Wave crests (breaking waves)
for (let i = 0; i < 3; i++) {
    const crestGeometry = new THREE.PlaneGeometry(60 - i * 10, 5, 32, 8);
    const crestMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9 - i * 0.2,
        emissive: 0xffffff,
        emissiveIntensity: 0.1
    });
    
    const crestVertices = crestGeometry.attributes.position.array;
    for (let j = 0; j < crestVertices.length; j += 3) {
        const x = crestVertices[j];
        crestVertices[j + 2] = Math.sin(x * 0.2) * 0.3 + Math.random() * 0.05;
    }
    crestGeometry.computeVertexNormals();
    
    const crest = new THREE.Mesh(crestGeometry, crestMaterial);
    crest.rotation.x = -Math.PI / 2.5;
    crest.position.set(0, -0.5 + i * 0.2, 5 - i * 3);
    shorelineGroup.add(crest);
}

scene.add(shorelineGroup);

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
    
    // Fish body - silver instead of blue
    const bodyGeometry = new THREE.SphereGeometry(0.4, 8, 6);
    bodyGeometry.scale(1.5, 0.7, 0.5);
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xC0C0C0,
        metalness: 0.8,
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
    
    // Add hover interaction for needle spin
    let isHovering = false;
    let currentNeedleValue = value;
    
    gaugeDiv.addEventListener('mouseenter', () => {
        isHovering = true;
        const needle = gaugeDiv.querySelector('.gauge-needle');
        
        // Get current value from parent element or use initial
        const parentGauge = gaugeDiv.closest('.gauge');
        if (parentGauge && parentGauge.dataset.currentValue) {
            currentNeedleValue = parseInt(parentGauge.dataset.currentValue);
        }
        
        // Kill any existing animations
        gsap.killTweensOf(needle);
        
        // Luxurious hover animation with weighted feel
        const hoverTimeline = gsap.timeline();
        
        hoverTimeline
            // Elegant anticipation
            .to(needle, {
                rotation: currentNeedleValue * 1.8 - 90 - 15,
                duration: 0.3,
                ease: "power2.out"
            })
            // Dramatic weighted spin
            .to(needle, {
                rotation: "+=450", // 1.25 rotations
                duration: 1.8,
                ease: "power3.inOut",
                onUpdate: function() {
                    // Add sophisticated momentum feel
                    const progress = this.progress();
                    const momentum = Math.sin(progress * Math.PI) * 3;
                    if (progress > 0.7) {
                        gsap.set(needle, {
                            rotation: gsap.getProperty(needle, "rotation") + momentum * (1 - progress)
                        });
                    }
                }
            })
            // Precise luxury settle
            .to(needle, {
                rotation: currentNeedleValue * 1.8 - 90,
                duration: 1.5,
                ease: "elastic.out(1, 0.8)",
                onComplete: function() {
                    // Resume subtle breathing
                    gsap.to(needle, {
                        rotation: currentNeedleValue * 1.8 - 90 + 1,
                        duration: 2,
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: -1
                    });
                }
            });
    });
    
    gaugeDiv.addEventListener('mouseleave', () => {
        isHovering = false;
    });
    
    // Add click interaction
    gaugeDiv.addEventListener('click', () => {
        const needle = gaugeDiv.querySelector('.gauge-needle');
        const valueDisplay = gaugeDiv.querySelector('.gauge-value');
        const newValue = Math.floor(Math.random() * 100);
        const newRotation = (newValue * 1.8) - 90;
        
        currentNeedleValue = newValue;
        
        // Update stored value
        const parentGauge = gaugeDiv.closest('.gauge');
        if (parentGauge) {
            parentGauge.dataset.currentValue = newValue;
        }
        
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
    
    // Store initial value on the element
    gaugeElement.dataset.currentValue = gauge.value;
    
    // Needle spin animation on load
    const needle = gaugeElement.querySelector('.gauge-needle');
    const valueDisplay = gaugeElement.querySelector('.gauge-value');
    
    // Luxurious theatrical weighted spin animation on load
    const timeline = gsap.timeline({ delay: index * 0.2 });
    
    // Initial dramatic pause
    timeline.set(needle, { rotation: -90 })
        // First theatrical spin with acceleration
        .to(needle, {
            rotation: 630, // 1.75 full rotations
            duration: 2.5,
            ease: "power2.in",
            onUpdate: function() {
                // Add gentle wobble during spin
                const progress = this.progress();
                const wobble = Math.sin(progress * Math.PI * 8) * 2;
                gsap.set(needle, { 
                    rotation: gsap.getProperty(needle, "rotation") + wobble * (1 - progress)
                });
            }
        })
        // Elegant deceleration and settle
        .to(needle, {
            rotation: gauge.value * 1.8 - 90,
            duration: 3,
            ease: "power4.out",
            onUpdate: function() {
                const currentRotation = gsap.getProperty(needle, "rotation");
                const currentValue = Math.round((currentRotation + 90) / 1.8);
                if (currentValue >= 0 && currentValue <= 100) {
                    valueDisplay.textContent = `${currentValue}%`;
                }
            }
        })
        // Final precision adjustment with luxury ease
        .to(needle, {
            rotation: gauge.value * 1.8 - 90,
            duration: 1.2,
            ease: "back.out(1.7)",
            onComplete: function() {
                // Add subtle breathing animation
                gsap.to(needle, {
                    rotation: gauge.value * 1.8 - 90 + 1,
                    duration: 2,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1
                });
            }
        });
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

// Create tropical island before starting animations
const tropicalIsland = createTropicalIsland();
tropicalIsland.position.set(-25, 0, -30);
tropicalIsland.scale.setScalar(1.2);
scene.add(tropicalIsland);

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
    
    // Animate shoreline
    shorelineGroup.children.forEach((child, index) => {
        if (child.material && child.material.opacity !== undefined) {
            // Foam lines move in and out
            if (index < 2) {
                child.position.z = child.userData.originalZ || (index === 0 ? 10 : 15);
                child.position.z += Math.sin(Date.now() * 0.001 + index) * 3;
                child.material.opacity = child.userData.originalOpacity || (index === 0 ? 0.8 : 0.4);
                child.material.opacity += Math.sin(Date.now() * 0.002) * 0.2;
            }
            // Wave crests
            if (index > 3) {
                child.position.y = -0.5 + (index - 4) * 0.2 + Math.sin(Date.now() * 0.003 + index) * 0.1;
            }
        }
    });
    
    
    // Animate beach grass
    scene.traverse((child) => {
        if (child.material && child.material.color && child.material.color.r === 0.486) { // grass color check
            child.rotation.z = child.userData.originalRotation + Math.sin(Date.now() * 0.001) * 0.1;
        }
    });
    
    // Animate seaweed
    scene.traverse((child) => {
        if (child.geometry && child.geometry.type === 'TubeGeometry' && child.userData.originalRotation !== undefined) {
            child.rotation.z = child.userData.originalRotation + Math.sin(Date.now() * 0.0008 + child.position.x) * 0.15;
        }
    });
    
    // Animate wet sand reflection
    scene.traverse((child) => {
        if (child.material && child.material.clearcoat === 1.0 && child.position.y === -1.35) {
            child.material.opacity = 0.8 + Math.sin(Date.now() * 0.001) * 0.2;
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
    
    // Animate tropical island
    if (tropicalIsland && tropicalIsland.userData) {
        // Animate foam ring around island
        const foamRing = tropicalIsland.children.find(child => 
            child.geometry && child.geometry.type === 'RingGeometry'
        );
        if (foamRing) {
            foamRing.material.opacity = 0.6 + Math.sin(Date.now() * 0.001) * 0.2;
            foamRing.rotation.z += 0.0005;
        }
        // Animate birds circling island
        if (tropicalIsland.userData.birds) {
            tropicalIsland.userData.birds.children.forEach(bird => {
                bird.userData.angle += bird.userData.speed;
                bird.position.x = Math.cos(bird.userData.angle) * bird.userData.radius;
                bird.position.z = Math.sin(bird.userData.angle) * bird.userData.radius;
                bird.position.y = bird.userData.height + Math.sin(Date.now() * 0.001 + bird.userData.angle) * 2;
                bird.rotation.y = bird.userData.angle + Math.PI / 2;
                
                // Animate wings
                bird.children.forEach((wing, index) => {
                    if (index > 0) {
                        wing.rotation.z = (index === 1 ? -1 : 1) * (Math.sin(Date.now() * 0.01) * 0.5 + 0.3);
                    }
                });
            });
        }
        
        // Subtle mermaid animation
        if (tropicalIsland.userData.mermaid) {
            // Hair flowing
            const hair = tropicalIsland.userData.mermaid.children.find(child => child.position.y === 3.5 && child.position.z === -0.7);
            if (hair) {
                hair.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
            }
            
            // Tail movement
            const tail = tropicalIsland.userData.mermaid.children.find(child => child.geometry && child.geometry.type === 'TubeGeometry');
            if (tail) {
                tail.rotation.y = Math.sin(Date.now() * 0.0008) * 0.05;
            }
        }
    }
    
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

// Create tropical island with enhanced details
function createTropicalIsland() {
    const islandGroup = new THREE.Group();
    
    // Main island base with multiple layers
    const islandGeometry = new THREE.ConeGeometry(25, 8, 32, 8);
    const islandVertices = islandGeometry.attributes.position.array;
    
    // Create more realistic island shape
    for (let i = 0; i < islandVertices.length; i += 3) {
        const x = islandVertices[i];
        const y = islandVertices[i + 1];
        const z = islandVertices[i + 2];
        
        // Add organic variations
        const noise = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 1.5;
        const detail = Math.sin(x * 2) * Math.cos(z * 2) * 0.3;
        islandVertices[i] += noise + detail;
        islandVertices[i + 2] += noise * 0.8 + detail;
        
        // Create beach slope at water level
        if (y < -2) {
            const dist = Math.sqrt(x * x + z * z);
            islandVertices[i] *= 1 + (y + 2) * 0.1;
            islandVertices[i + 2] *= 1 + (y + 2) * 0.1;
        }
    }
    islandGeometry.computeVertexNormals();
    
    // Multiple material layers for realism
    const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0xA0826D,
        roughness: 0.8,
        metalness: 0,
        normalScale: new THREE.Vector2(1, 1)
    });
    
    const island = new THREE.Mesh(islandGeometry, rockMaterial);
    island.position.y = -6;
    island.rotation.y = Math.random() * Math.PI;
    island.castShadow = true;
    island.receiveShadow = true;
    islandGroup.add(island);
    
    // Sandy beach around island
    const beachGeometry = new THREE.RingGeometry(20, 30, 32);
    const beachMaterial = new THREE.MeshStandardMaterial({
        color: 0xf4e4c1,
        roughness: 0.95,
        metalness: 0
    });
    const beach = new THREE.Mesh(beachGeometry, beachMaterial);
    beach.rotation.x = -Math.PI / 2;
    beach.position.y = -1.8;
    beach.receiveShadow = true;
    islandGroup.add(beach);
    
    // Add tropical vegetation
    const vegetation = new THREE.Group();
    
    // Create lush palm trees on island
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 8 + Math.random() * 5;
        const palm = createPalmTree(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
        );
        palm.scale.setScalar(0.8 + Math.random() * 0.4);
        palm.position.y = 2 + Math.random() * 2;
        vegetation.add(palm);
    }
    
    // Add tropical flowers
    for (let i = 0; i < 20; i++) {
        const flowerGroup = new THREE.Group();
        
        // Flower petals
        const petalGeometry = new THREE.SphereGeometry(0.3, 8, 4);
        const petalMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.85, 1, 0.6),
            roughness: 0.3,
            metalness: 0
        });
        
        for (let j = 0; j < 5; j++) {
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            const petalAngle = (j / 5) * Math.PI * 2;
            petal.position.x = Math.cos(petalAngle) * 0.3;
            petal.position.z = Math.sin(petalAngle) * 0.3;
            petal.scale.y = 1.5;
            flowerGroup.add(petal);
        }
        
        // Flower center
        const centerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const centerMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            roughness: 0.6
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        flowerGroup.add(center);
        
        // Position flowers randomly on island
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 12;
        flowerGroup.position.set(
            Math.cos(angle) * radius,
            3 + Math.random() * 2,
            Math.sin(angle) * radius
        );
        flowerGroup.scale.setScalar(0.5 + Math.random() * 0.5);
        vegetation.add(flowerGroup);
    }
    
    // Add rocks and pebbles
    for (let i = 0; i < 30; i++) {
        const rockGeometry = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.5, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.3 + Math.random() * 0.2, 0.3 + Math.random() * 0.2, 0.3),
            roughness: 0.9,
            metalness: 0
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 20;
        rock.position.set(
            Math.cos(angle) * radius,
            -1.5 + Math.random() * 4,
            Math.sin(angle) * radius
        );
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.castShadow = true;
        islandGroup.add(rock);
    }
    
    islandGroup.add(vegetation);
    
    // Add foam ring around island
    const foamRingGeometry = new THREE.RingGeometry(28, 35, 64);
    const foamRingMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0,
        emissive: 0xffffff,
        emissiveIntensity: 0.1
    });
    
    // Create foam vertices variation
    const foamVertices = foamRingGeometry.attributes.position.array;
    for (let i = 0; i < foamVertices.length; i += 3) {
        const x = foamVertices[i];
        const y = foamVertices[i + 1];
        const distance = Math.sqrt(x * x + y * y);
        const wave = Math.sin(distance * 0.5) * 0.3;
        foamVertices[i + 2] = wave;
    }
    foamRingGeometry.computeVertexNormals();
    
    const foamRing = new THREE.Mesh(foamRingGeometry, foamRingMaterial);
    foamRing.rotation.x = -Math.PI / 2;
    foamRing.position.y = -1.8;
    islandGroup.add(foamRing);
    
    // Create mermaid sunbathing on a rock
    const mermaidGroup = new THREE.Group();
    
    // Sunbathing rock
    const rockPlatformGeometry = new THREE.BoxGeometry(6, 1, 3);
    const rockPlatformMaterial = new THREE.MeshStandardMaterial({
        color: 0x696969,
        roughness: 0.8,
        metalness: 0.1
    });
    const rockPlatform = new THREE.Mesh(rockPlatformGeometry, rockPlatformMaterial);
    rockPlatform.position.set(0, 1, 0);
    rockPlatform.rotation.x = -0.1;
    rockPlatform.castShadow = true;
    rockPlatform.receiveShadow = true;
    mermaidGroup.add(rockPlatform);
    
    // Mermaid body (simplified but recognizable)
    // Upper body - more slender
    const torsoGeometry = new THREE.CapsuleGeometry(0.5, 1.8, 8, 16);
    const skinMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFDBD7,
        roughness: 0.6,
        metalness: 0
    });
    const torso = new THREE.Mesh(torsoGeometry, skinMaterial);
    torso.position.set(0, 2.5, 0);
    torso.rotation.x = -Math.PI / 2 + 0.3;
    torso.scale.set(0.8, 1, 0.7);
    mermaidGroup.add(torso);
    
    // Mermaid tail - more elegant
    const tailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.5, 0),
        new THREE.Vector3(0, 1, 0.8),
        new THREE.Vector3(0, 0.5, 1.6),
        new THREE.Vector3(0, 0.3, 2.5)
    ]);
    
    const tailGeometry = new THREE.TubeGeometry(tailCurve, 20, 0.4, 8, false);
    const tailMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x20B2AA,
        metalness: 0.8,
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0,
        reflectivity: 1
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.scale.set(1, 1, 1.2);
    mermaidGroup.add(tail);
    
    // Tail fin - more elegant
    const finGeometry = new THREE.ConeGeometry(1.2, 1.5, 8);
    finGeometry.scale(1.5, 0.3, 1);
    const fin = new THREE.Mesh(finGeometry, tailMaterial);
    fin.position.set(0, 0.3, 3);
    fin.rotation.x = Math.PI / 2;
    mermaidGroup.add(fin);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.set(0, 3.5, -0.8);
    mermaidGroup.add(head);
    
    // Hair
    const hairGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    hairGeometry.scale(1, 1.2, 1);
    const hairMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFB6C1,
        roughness: 0.8,
        metalness: 0.1
    });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.set(0, 3.5, -0.7);
    mermaidGroup.add(hair);
    
    // Arms (simplified)
    const armGeometry = new THREE.CapsuleGeometry(0.2, 1.5, 4, 8);
    const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
    leftArm.position.set(-1, 2.8, -0.3);
    leftArm.rotation.z = 0.5;
    mermaidGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
    rightArm.position.set(1, 2.8, -0.3);
    rightArm.rotation.z = -0.5;
    mermaidGroup.add(rightArm);
    
    // Add seashell bra
    const shellGeometry = new THREE.SphereGeometry(0.3, 8, 4);
    shellGeometry.scale(1, 0.7, 0.7);
    const shellMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xFFF0F5,
        metalness: 0.3,
        roughness: 0.3,
        clearcoat: 0.5
    });
    
    const leftShell = new THREE.Mesh(shellGeometry, shellMaterial);
    leftShell.position.set(-0.3, 2.8, -0.5);
    leftShell.rotation.z = 0.3;
    mermaidGroup.add(leftShell);
    
    const rightShell = new THREE.Mesh(shellGeometry, shellMaterial);
    rightShell.position.set(0.3, 2.8, -0.5);
    rightShell.rotation.z = -0.3;
    mermaidGroup.add(rightShell);
    
    // Position mermaid on island
    mermaidGroup.position.set(8, 0, -5);
    mermaidGroup.rotation.y = -Math.PI / 4;
    mermaidGroup.scale.setScalar(0.8);
    
    islandGroup.add(mermaidGroup);
    
    // Add island ambient details
    // Birds circling
    const birdGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
        const birdGeometry = new THREE.ConeGeometry(0.2, 1, 4);
        const birdMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.8
        });
        const bird = new THREE.Mesh(birdGeometry, birdMaterial);
        bird.rotation.x = Math.PI / 2;
        
        // Wing geometry
        const wingGeometry = new THREE.PlaneGeometry(0.8, 0.3);
        const leftWing = new THREE.Mesh(wingGeometry, birdMaterial);
        leftWing.position.x = -0.4;
        leftWing.rotation.z = -0.3;
        bird.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, birdMaterial);
        rightWing.position.x = 0.4;
        rightWing.rotation.z = 0.3;
        bird.add(rightWing);
        
        bird.userData = {
            angle: (i / 3) * Math.PI * 2,
            radius: 30 + i * 5,
            height: 15 + i * 3,
            speed: 0.0005 + Math.random() * 0.0005
        };
        
        birdGroup.add(bird);
    }
    islandGroup.add(birdGroup);
    
    // Animated elements
    islandGroup.userData = {
        birds: birdGroup,
        mermaid: mermaidGroup
    };
    
    return islandGroup;
}

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

// Make gauge container draggable
function makeElementDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    function dragStart(e) {
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        if (e.target === element || element.contains(e.target)) {
            isDragging = true;
            
            initialX = clientX - xOffset;
            initialY = clientY - yOffset;
            
            element.style.cursor = 'grabbing';
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        element.style.cursor = 'move';
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            
            currentX = clientX - initialX;
            currentY = clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            element.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }

    // Mouse events
    element.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    // Touch events
    element.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);
}

// Make gauge container (leather pad) draggable
makeElementDraggable(gaugeContainer);

// Make individual gauges draggable
function makeGaugesDraggable() {
    const gauges = document.querySelectorAll('.gauge');
    
    gauges.forEach(gauge => {
        gauge.style.position = 'relative';
        gauge.style.cursor = 'move';
        
        let isDragging = false;
        let currentX = 0;
        let currentY = 0;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        function dragStart(e) {
            // Don't start drag if clicking on interactive elements
            if (e.target.classList.contains('gauge-needle') || 
                e.target.classList.contains('gauge-value') ||
                e.target.classList.contains('gauge-center')) {
                return;
            }
            
            e.stopPropagation();
            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            
            isDragging = true;
            initialX = clientX - xOffset;
            initialY = clientY - yOffset;
            
            gauge.style.cursor = 'grabbing';
            gauge.style.zIndex = '1000';
        }
        
        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            gauge.style.cursor = 'move';
            gauge.style.zIndex = '';
        }
        
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
                
                const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
                const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
                
                currentX = clientX - initialX;
                currentY = clientY - initialY;
                
                xOffset = currentX;
                yOffset = currentY;
                
                gauge.style.transform = `translate(${currentX}px, ${currentY}px) scale(1)`;
            }
        }
        
        gauge.addEventListener('mousedown', dragStart);
        gauge.addEventListener('touchstart', dragStart);
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
    });
}

// Initialize gauge dragging
setTimeout(makeGaugesDraggable, 1000);

// Pattern Toggle System
document.querySelectorAll('.pattern-option').forEach(option => {
    option.addEventListener('click', () => {
        const pattern = option.getAttribute('data-pattern');
        
        // Remove active class from all options
        document.querySelectorAll('.pattern-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        // Apply pattern to gauge container
        const gaugeContainer = document.getElementById('gaugeContainer');
        gaugeContainer.setAttribute('data-leather-pattern', pattern);
        
        // Store preference
        localStorage.setItem('leatherPattern', pattern);
        
        // Add luxury transition effect
        gaugeContainer.style.transition = 'background 1s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            gaugeContainer.style.transition = '';
        }, 1000);
    });
});

// Time Mode System
let currentTimeMode = 'day';

function updateTimeMode(mode) {
    currentTimeMode = mode;
    
    // Update active state
    document.querySelectorAll('.time-mode-option').forEach(opt => opt.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    // Update scene lighting and colors
    updateSceneLighting(mode);
    
    // Update UI theme
    updateUITheme(mode);
    
    // Store preference
    localStorage.setItem('timeMode', mode);
}

function updateSceneLighting(mode) {
    if (!scene) return;
    
    switch(mode) {
        case 'day':
            // Bright daylight
            ambientLight.intensity = 0.6;
            ambientLight.color.setHex(0xffc0cb);
            directionalLight.intensity = 1.2;
            directionalLight.color.setHex(0xffd700);
            
            // Update sky
            if (skyUniforms) {
                skyUniforms['turbidity'].value = 2;
                skyUniforms['rayleigh'].value = 1;
                skyUniforms['mieCoefficient'].value = 0.003;
                skyUniforms['mieDirectionalG'].value = 0.97;
            }
            
            // Update water color
            if (water && water.material) {
                water.material.uniforms['waterColor'].value.setHex(0x006994);
                water.material.uniforms['sunColor'].value.setHex(0xffffff);
            }
            break;
            
        case 'dusk':
            // Golden hour lighting
            ambientLight.intensity = 0.4;
            ambientLight.color.setHex(0xff8c69);
            directionalLight.intensity = 0.8;
            directionalLight.color.setHex(0xff6347);
            
            // Update sky for sunset
            if (skyUniforms) {
                skyUniforms['turbidity'].value = 8;
                skyUniforms['rayleigh'].value = 3;
                skyUniforms['mieCoefficient'].value = 0.008;
                skyUniforms['mieDirectionalG'].value = 0.85;
            }
            
            // Update water color
            if (water && water.material) {
                water.material.uniforms['waterColor'].value.setHex(0x8b4513);
                water.material.uniforms['sunColor'].value.setHex(0xff6347);
            }
            break;
            
        case 'night':
            // Moonlit scene
            ambientLight.intensity = 0.2;
            ambientLight.color.setHex(0x4169e1);
            directionalLight.intensity = 0.3;
            directionalLight.color.setHex(0x87ceeb);
            
            // Update sky for night
            if (skyUniforms) {
                skyUniforms['turbidity'].value = 15;
                skyUniforms['rayleigh'].value = 0.5;
                skyUniforms['mieCoefficient'].value = 0.001;
                skyUniforms['mieDirectionalG'].value = 0.95;
            }
            
            // Update water color
            if (water && water.material) {
                water.material.uniforms['waterColor'].value.setHex(0x191970);
                water.material.uniforms['sunColor'].value.setHex(0x87ceeb);
            }
            break;
    }
}

function updateUITheme(mode) {
    document.body.setAttribute('data-time-mode', mode);
    
    // Update time mode icon
    const timeIcon = document.querySelector('.time-mode-icon');
    switch(mode) {
        case 'day':
            timeIcon.textContent = '☀️';
            break;
        case 'dusk':
            timeIcon.textContent = '🌅';
            break;
        case 'night':
            timeIcon.textContent = '🌙';
            break;
    }
}

// Time Mode Event Listeners
document.querySelectorAll('.time-mode-option').forEach(option => {
    option.addEventListener('click', () => {
        const mode = option.getAttribute('data-mode');
        updateTimeMode(mode);
    });
});

// Load saved preferences
const savedPattern = localStorage.getItem('leatherPattern') || 'classic';
const savedTimeMode = localStorage.getItem('timeMode') || 'day';

document.getElementById('gaugeContainer').setAttribute('data-leather-pattern', savedPattern);
document.querySelector(`[data-pattern="${savedPattern}"]`).classList.add('active');

updateTimeMode(savedTimeMode);

// Theme switching functionality
document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', () => {
        const theme = option.getAttribute('data-theme');
        
        // Remove active class from all options
        document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        // Apply theme
        document.body.setAttribute('data-theme', theme);
        
        // Store preference
        localStorage.setItem('diamondLineTheme', theme);
        
        // Update colors with smooth transition
        updateThemeColors(theme);
    });
});

// Load saved theme on startup
const savedTheme = localStorage.getItem('diamondLineTheme') || 'diamond';
document.body.setAttribute('data-theme', savedTheme);
document.querySelector(`[data-theme="${savedTheme}"]`).classList.add('active');

// Update theme colors dynamically
function updateThemeColors(theme) {
    const themes = {
        diamond: {
            primary: '#FFD700',
            secondary: '#FF1493',
            accent: '#FFB6C1',
            glow: 'rgba(255, 215, 0, 0.8)'
        },
        emerald: {
            primary: '#50C878',
            secondary: '#228B22',
            accent: '#90EE90',
            glow: 'rgba(80, 200, 120, 0.8)'
        },
        sapphire: {
            primary: '#0F52BA',
            secondary: '#4169E1',
            accent: '#87CEEB',
            glow: 'rgba(65, 105, 225, 0.8)'
        },
        ruby: {
            primary: '#E0115F',
            secondary: '#DC143C',
            accent: '#FA8072',
            glow: 'rgba(224, 17, 95, 0.8)'
        },
        obsidian: {
            primary: '#C0C0C0',
            secondary: '#808080',
            accent: '#D3D3D3',
            glow: 'rgba(192, 192, 192, 0.8)'
        }
    };
    
    const colors = themes[theme];
    
    // Animate gauge elements
    gsap.to('.gauge-value', {
        duration: 1,
        ease: 'power2.inOut',
        onUpdate: function() {
            document.querySelectorAll('.gauge-value').forEach(el => {
                el.style.background = `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`;
            });
        }
    });
    
    // Update gauge center glow
    document.querySelectorAll('.gauge-center').forEach(el => {
        el.style.boxShadow = `0 0 30px ${colors.glow}`;
    });
    
    // Update needle colors
    document.querySelectorAll('.gauge-needle').forEach(el => {
        el.style.filter = `drop-shadow(0 0 15px ${colors.glow})`;
    });
}