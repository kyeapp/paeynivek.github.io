import * as THREE from 'three';
import { OrbitControls } from 'orbit';
// import { STLLoader } from 'stlLoader';
import { GLTFLoader } from 'gltfLoader';
import { EffectComposer } from 'effectComposer';
import { UnrealBloomPass } from 'unrealBloomPass';
import { RenderPass } from 'renderPass';
// import { SAOPass } from 'saoPass';
// import { SobelOperatorShader } from 'sobelOperatorShader';
// import { LuminosityShader } from 'luminosityShader';
import { ShaderPass } from 'shaderPass';
import Stats from 'stats';

// TODO:
// stars opacity
// 

var scene, camera, renderer, bloomComposer, finalComposer;
var coin, coinEdges;
const coordMax = 1000;
const particleCount = 1000;
const mouse = new THREE.Vector2();

var controls;
var mixer;
var clipAction;

const stats = Stats()
document.body.appendChild(stats.dom)

const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });

function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x000000, 1);
	document.body.appendChild(renderer.domElement);

	controls = new OrbitControls(camera, renderer.domElement);

	const coinRadius = 4;
	camera.position.set(0, -2 * coinRadius, 1);
	camera.lookAt(0, 0, 0);

	const loader = new GLTFLoader();
	let l = loader.load(
		'coin.glb',
		function (gltf) {
			coin = gltf.scene;
			// save original material
			for (let mesh of coin.children[0].children) {
				mesh.originalMaterial = mesh.material
			}
			scene.add(gltf.scene);

			// setup coin flip animation player
			mixer = new THREE.AnimationMixer(coin);
			mixer.addEventListener('finished', function (e) {
			});

			// initialize clipAction for renderer
			const initAnimation = new THREE.AnimationClip("place_holder", -1, []);
			clipAction = mixer.clipAction(initAnimation);
			clipAction.repetitions = 1
			clipAction.loop = THREE.LoopOnce
			coin.rotationAmount = 0

			scene.add(coin)

			// let edgeGeometry = new THREE.EdgesGeometry(geometry, 45);
			// let edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
			// coinEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
			// scene.add(coinEdges);
		},
		(xhr) => {
			// coin loaded
		},
		(error) => {
			console.log(error)
		}
	)

	setupLights(scene, coinRadius)
	// setupStars(scene)
	setupWeb(scene)

	window.addEventListener('resize', onWindowResize, false)
	window.addEventListener('click', onClick, false);

	const params = {
		exposure: 1.0,
		bloomStrength: 1.0,
		bloomThreshold: 0,
		bloomRadius: 0
	};

	const renderScene = new RenderPass(scene, camera);
	const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
	bloomPass.threshold = params.bloomThreshold;
	bloomPass.strength = params.bloomStrength;
	bloomPass.radius = params.bloomRadius;

	bloomComposer = new EffectComposer(renderer);
	bloomComposer.renderToScreen = false;
	bloomComposer.addPass(renderScene);
	bloomComposer.addPass(bloomPass);

	const finalPass = new ShaderPass(
		new THREE.ShaderMaterial({
			uniforms: {
				baseTexture: { value: null },
				bloomTexture: { value: bloomComposer.renderTarget2.texture }
			},
			vertexShader: document.getElementById('vertexshader').textContent,
			fragmentShader: document.getElementById('fragmentshader').textContent,
			defines: {}
		}), 'baseTexture'
	);
	finalPass.needsSwap = true;

	finalComposer = new EffectComposer(renderer);
	finalComposer.addPass(renderScene);
	finalComposer.addPass(finalPass);
};


const headSpinTrack = new THREE.NumberKeyframeTrack(
	'.rotationAmount',
	[0.0, 0.5, 1.00, 1.50, 2.0, 2.5, 3.0, 5.0],
	[-32, -16, -8, -4, -2, -1, 0, 0]
);
const tailSpinTrack = new THREE.NumberKeyframeTrack(
	'.rotationAmount',
	[0.0, 0.5, 1.00, 1.50, 2.0, 2.5, 3.0, 5.0],
	[-32 + Math.PI, -16 + Math.PI, -8 + Math.PI, -4 + Math.PI, -2 + Math.PI, -1 + Math.PI, 0 + Math.PI, Math.PI]
);

function onClick(event) {
	event.preventDefault();

	const raycaster = new THREE.Raycaster();

	mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
	mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);

	// use raycaster to check if pointer has over an object
	const intersects = raycaster.intersectObjects(scene.children);

	if (intersects.length < 1) {
		// no objects clicked
		return
	}
	if (clipAction.isRunning()) {
		// animation already running
		return
	}

	// Determine outcome of coin
	let heads = Math.floor(Math.random() * 2);
	let spinTrack
	if (heads) {
		coin.rotation.z = 0
		spinTrack = headSpinTrack
	} else {
		coin.rotation.z = Math.PI
		spinTrack = tailSpinTrack
	}

	const spinAnimation = new THREE.AnimationClip("spin", -1, [spinTrack]);
	clipAction = mixer.clipAction(spinAnimation);
	clipAction.repetitions = 1
	clipAction.loop = THREE.LoopOnce

	clipAction.play();
}

function setupLights(scene, coinRadius) {
	const ambientLight = new THREE.AmbientLight(0xffffff, 1);
	scene.add(ambientLight);

	// SpotLight( color : Integer, intensity : Float, distance : Float, angle : Radians, penumbra : Float, decay : Float )
	// Key light
	const light = new THREE.SpotLight(0xFFFFFF, 1, 8 * coinRadius, Math.PI / 4, 0, 2);
	light.position.set(-2 * coinRadius, 2 * coinRadius, coinRadius / 2);
	light.castShadow = true;
	// light.add(new THREE.SpotLightHelper(light));
	scene.add(light);

	// Fill light
	const light2 = new THREE.SpotLight(0xFFFFFF, .1, 8 * coinRadius, Math.PI / 4, 0, 2);
	light2.position.set(2 * coinRadius, 2 * coinRadius, coinRadius / 2);
	// light2.add(new THREE.SpotLightHelper(light2));
	scene.add(light2);

	// Back light
	const light3 = new THREE.SpotLight(0xFFFFFF, .25, 20 * coinRadius, Math.PI / 4, 0, 2);
	light3.position.set(-4 * coinRadius, -6 * coinRadius, coinRadius / 2);
	// light3.add(new THREE.SpotLightHelper(light3));
	scene.add(light3);

	const light4 = new THREE.SpotLight(0xFFFFFF, 1, 20, Math.PI / 4, 0, 2);
	light4.position.set(0, 0, 5);
	// light4.add(new THREE.SpotLightHelper(light4));
	scene.add(light4);


	// Create a helper for the shadow camera (optional)
	// const helper = new THREE.CameraHelper( light.shadow.camera );
	// scene.add( helper );

	// The X axis is red. The Y axis is green. The Z axis is blue.
	// scene.add(new THREE.AxesHelper(15));

}

const clock = new THREE.Clock();
var delta = 0;
const fps = 60;
const interval = 1 / fps;
function animate() {
	requestAnimationFrame(animate);
	delta += clock.getDelta();

	if (delta < interval) {
		// skip frame
		return
	}

	updateCoin()
	// updateStars()
	updateWeb()

	// controls.update();
	delta = delta % interval;
	stats.update()
	// renderer.render(scene, camera);
};

function updateCoin() {
	mixer.update(delta);

	if (clipAction.isRunning()) {
		coin.rotation.z = coin.rotationAmount;
	} else {
		coin.rotation.z += Math.PI / 1028;
	}

	// coinEdges.rotation.z = coin.rotation.z;
}

var stars;
function setupStars() {
	let vertices = [];

	var x, y, z
	for (var i = 0; i < particleCount; i++) {
		x = THREE.MathUtils.randFloatSpread(coordMax);
		y = THREE.MathUtils.randFloatSpread(coordMax);
		z = THREE.MathUtils.randFloatSpread(coordMax);
		vertices.push(x, y, z);
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

	let starSprite = new THREE.TextureLoader().load('star.png');
	const starMaterial = new THREE.PointsMaterial({ size: 2, map: starSprite, transparent: false });

	stars = new THREE.Points(geometry, starMaterial);
	scene.add(stars);
}

// Background of coin moving through space
var vertices;
var resetStarPos;
function updateStars() {
	// rotate stars ever so slightly
	stars.rotation.y += .0004

	vertices = stars.geometry.attributes.position.array;
	resetStarPos = camera.position.y - 50
	for (let i = 1; i < vertices.length; i += 3) {
		vertices[i] -= 1
		if (vertices[i] < resetStarPos) {
			vertices[i - 1] = THREE.MathUtils.randFloatSpread(coordMax);
			vertices[i] += coordMax
			vertices[i + 1] = THREE.MathUtils.randFloatSpread(coordMax);
		}
	}
	stars.geometry.attributes.position.needsUpdate = true;
}

var web
function setupWeb() {
	let vertices = [];
	let lineColors = [];

	var x, y, z
	for (var i = 0; i < particleCount; i++) {
		x = THREE.MathUtils.randFloatSpread(coordMax);
		y = THREE.MathUtils.randFloatSpread(coordMax);
		z = THREE.MathUtils.randFloatSpread(coordMax);
		vertices.push(x, y, z);

		// color of vertex
		lineColors.push(Math.floor(Math.random() * 266))
		lineColors.push(Math.floor(Math.random() * 266))
		lineColors.push(Math.floor(Math.random() * 266))
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
	geometry.setAttribute('color', new THREE.Uint8BufferAttribute(lineColors, 3, true));

	const lineMaterial = new THREE.LineBasicMaterial({ vertexColors: true });

	web = new THREE.LineSegments(geometry, lineMaterial);
	scene.add(web);
}

// Background of coin moving through web
var resetWebPos;
function updateWeb() {
	web.rotation.y += .001

	vertices = web.geometry.attributes.position.array;
	resetWebPos = camera.position.y - 50
	for (let i = 1; i < vertices.length; i += 3) {
		vertices[i] -= 1
		if (vertices[i] < resetWebPos) {
			vertices[i - 1] = THREE.MathUtils.randFloatSpread(coordMax);
			vertices[i] += coordMax
			vertices[i + 1] = THREE.MathUtils.randFloatSpread(coordMax);
		}
	}
	web.geometry.attributes.position.needsUpdate = true;

	for (let mesh of coin.children[0].children) {
		mesh.material = darkMaterial
	}
	bloomComposer.render();
	for (let mesh of coin.children[0].children) {
		mesh.material = mesh.originalMaterial
	}
	finalComposer.render();
}

function onWindowResize() {
	const width = window.innerWidth;
	const height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize( width, height );

	bloomComposer.setSize( width, height );
	finalComposer.setSize( width, height );

	finalComposer.render();
}

init();
animate();