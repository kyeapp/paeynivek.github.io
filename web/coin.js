import * as THREE from 'three';
import Stats from 'three.js/examples/jsm/libs/stats.module.js';
import WebGL from 'three.js/examples/jsm/capabilities/WebGL.js';
import { OrbitControls } from 'three.js/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three.js/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three.js/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three.js/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three.js/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader } from 'three.js/examples/jsm/shaders/CopyShader.js';
import { UnrealBloomPass } from 'three.js/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RGBELoader } from 'three.js/examples/jsm/loaders/RGBELoader.js';

// const stats = Stats()
// document.body.appendChild(stats.dom)

const coinRadius = 13;
const assetFolder = '../assets/'

let scene, camera, renderer;
let controls;
let finalComposer;
let bloomComposer;
function init() {
	// WebGL 2.0 required for multisampled anti-aliasing
	if (WebGL.isWebGL2Available() === false) {
		document.body.appendChild(WebGL.getWebGL2ErrorMessage());
		return;
	}

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
	camera.position.set(0, 0, 2.5 * coinRadius);
	camera.lookAt(0, 0, 0);

	const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
	scene.add(ambientLight);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.autoClear = false;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x000000, 1);
	renderer.outputEncoding = THREE.sRGBEncoding
	document.body.appendChild(renderer.domElement);

	controls = new OrbitControls(camera, renderer.domElement);

	const size = renderer.getDrawingBufferSize(new THREE.Vector2());
	const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, { samples: 4 });

	const renderPass = new RenderPass(scene, camera);

	const params = {
		exposure: 1,
		bloomStrength: 1.5,
		bloomThreshold: 0,
		bloomRadius: 0
	};

	const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
	bloomPass.threshold = params.bloomThreshold;
	bloomPass.strength = params.bloomStrength;
	bloomPass.radius = params.bloomRadius;

	bloomComposer = new EffectComposer(renderer);
	bloomComposer.renderToScreen = false;
	bloomComposer.addPass(renderPass);
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

	finalComposer = new EffectComposer(renderer, renderTarget);
	finalComposer.addPass(renderPass);
	finalComposer.addPass(finalPass);

	setupCoin()
	setupLights()
	setupBackground()
};

var coin, mixer, clipAction;
const coinOutlineGroup = new THREE.Group();
function setupCoin() {
	window.addEventListener('resize', onWindowResize, false)
	window.addEventListener('click', onClick, false);

	const loader = new GLTFLoader();
	let l = loader
		.setPath(assetFolder)
		.load(
			'coin.glb',
			function (gltf) {
				coin = gltf.scene;
				coin.children[0].material.side = THREE.FrontSide
				scene.add(coin);
				for (let mesh of coin.children) {
					mesh.originalMaterial = mesh.material
				}

				// setup coin flip animation player
				mixer = new THREE.AnimationMixer(coin);

				// initialize clipAction for renderer
				const initAnimation = new THREE.AnimationClip("place_holder", -1, []);
				clipAction = mixer.clipAction(initAnimation);
				clipAction.repetitions = 1
				clipAction.loop = THREE.LoopOnce
				coin.rotationAmount = 0

				// initialize coin outline
				let geometry = coin.children[0].geometry
				let coinEdgeGeometry = new THREE.EdgesGeometry(geometry, 30);
				let edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
				let coinOutline = new THREE.LineSegments(coinEdgeGeometry, edgeMaterial);
				coinOutlineGroup.add(coinOutline)
				scene.add(coinOutlineGroup);
			},
			(xhr) => {
				// coin loaded
			},
			(error) => {
				console.log(error)
			}
		)
}

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

const mouse = new THREE.Vector2();
function onClick(event) {
	event.preventDefault();

	const raycaster = new THREE.Raycaster();

	mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
	mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);

	const intersects = raycaster.intersectObjects(scene.children);

	if (intersects.length < 1) {
		// no objects clicked
		return
	}

	controls.reset();
	clipAction.stop() // stop previous spin action before we lose its handle

	// Determine outcome of coin
	let heads = Math.floor(Math.random() * 2);
	let spinTrack
	if (heads) {
		coin.rotation.y = 0
		spinTrack = headSpinTrack
	} else {
		coin.rotation.y = Math.PI
		spinTrack = tailSpinTrack
	}

	const spinAnimation = new THREE.AnimationClip("spin", -1, [spinTrack]);
	clipAction = mixer.clipAction(spinAnimation);
	clipAction.repetitions = 1
	clipAction.loop = THREE.LoopOnce

	clipAction.play();
}

function setupLights() {
	const light = new THREE.DirectionalLight(0xFFFFFF, 1);
	light.position.set(0, coinRadius, 0);
	scene.add(light)
	// const helper = new THREE.DirectionalLightHelper(light, 5);
	// scene.add(helper);

	const light2 = new THREE.DirectionalLight(0xFFFFFF, 1);
	light2.position.set(0, coinRadius, coinRadius);
	scene.add(light2)
	// const helper2 = new THREE.DirectionalLightHelper(light2, 5);
	// scene.add(helper2);

	const light3 = new THREE.DirectionalLight(0xFFFFFF, 1);
	light3.position.set(0, -coinRadius, coinRadius);
	scene.add(light3)
	// const helper3 = new THREE.DirectionalLightHelper(light3, 5);
	// scene.add(helper3);

	const light4 = new THREE.DirectionalLight(0xFFFFFF, 1);
	light4.position.set(-2 * coinRadius, coinRadius, -coinRadius / 2);
	scene.add(light4)
	// const helper4 = new THREE.DirectionalLightHelper(light4, 5);
	// scene.add(helper4);

	const light5 = new THREE.DirectionalLight(0xFFFFFF, .1);
	light5.position.set(coinRadius, coinRadius / 4, -coinRadius);
	scene.add(light5)
	// const helper5 = new THREE.DirectionalLightHelper(light5, 5);
	// scene.add(helper5);

	const light6 = new THREE.DirectionalLight(0xFFFFFF, .2);
	light6.position.set(coinRadius, coinRadius / 5, coinRadius);
	scene.add(light6)
	// const helper6 = new THREE.DirectionalLightHelper(light6, 5);
	// scene.add(helper6);

	// The X axis is red. The Y axis is green. The Z axis is blue.
	// scene.add(new THREE.AxesHelper(15));

}

function setupBackground() {
	// setupSpace()
	setupWeb()
	// setupRings()
}

const clock = new THREE.Clock();
var delta = 0;
const fps = 60;
const interval = 1 / fps;
const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
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
	// updateRings()

	finalComposer.render()
	delta = delta % interval;
	// stats.update()
};

function updateCoin() {
	mixer.update(delta);

	if (clipAction.isRunning()) {
		coin.rotation.y = coin.rotationAmount;
	} else {
		coin.rotation.y += Math.PI / 2048;
	}

	coinOutlineGroup.rotation.y = coin.rotation.y;
}

function onWindowResize() {
	const width = window.innerWidth;
	const height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
	bloomComposer.setSize(width, height);
	finalComposer.setSize(width, height);

	finalComposer.render();
}

let coordMax;
let particleCount;

let stars
coordMax = 1000
particleCount = 1000
function setupSpace() {
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

	let starSprite = new THREE.TextureLoader().load(assetFolder + 'star.png');
	const starMaterial = new THREE.PointsMaterial({ size: 2, map: starSprite, transparent: true });

	stars = new THREE.Points(geometry, starMaterial);
	scene.add(stars);
}

// Background of coin moving through space
var vertices;
var resetStarPos;
function updateStars() {
	// rotate stars ever so slightly
	stars.rotation.z += .0004

	vertices = stars.geometry.attributes.position.array;
	resetStarPos = camera.position.z + 50
	for (let i = 1; i < vertices.length; i += 3) {
		vertices[i + 1] += 1
		if (vertices[i + 1] > resetStarPos) {
			vertices[i - 1] = THREE.MathUtils.randFloatSpread(coordMax);
			vertices[i] = THREE.MathUtils.randFloatSpread(coordMax);
			vertices[i + 1] -= coordMax
		}
	}
	stars.geometry.attributes.position.needsUpdate = true;
}

var web
coordMax = 1000;
particleCount = 400;
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
function updateWeb() {
	web.rotation.z += .0001

	let vertices = web.geometry.attributes.position.array;
	let resetPos = camera.position.z + 50
	for (let i = 2; i < vertices.length; i += 6) {
		let j = i + 3
		vertices[i] += .4
		vertices[j] += .4
		if (vertices[i] > resetPos || vertices[j] > resetPos) {
			vertices[i - 2] = THREE.MathUtils.randFloatSpread(coordMax);
			vertices[i - 1] = THREE.MathUtils.randFloatSpread(coordMax);
			vertices[i] = THREE.MathUtils.randFloatSpread(coordMax) - coordMax

			vertices[j - 2] = THREE.MathUtils.randFloatSpread(coordMax);
			vertices[j - 1] = THREE.MathUtils.randFloatSpread(coordMax);
			vertices[j] = THREE.MathUtils.randFloatSpread(coordMax) - coordMax
		}
	}
	web.geometry.attributes.position.needsUpdate = true;

	// render bloom
	for (let mesh of coin.children) {
		mesh.material = darkMaterial
	}
	bloomComposer.render();
	for (let mesh of coin.children) {
		mesh.material = mesh.originalMaterial
	}
}

// TODO:
// - try forcing the color values to be apart form each other to get more
// colorul rings.
// - try different ring speeds
let ring = []
function setupRings() {
	for (let i = 0; i < 10; i++) {
		const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });

		const radius = 3 * coinRadius + i / 2
		const tube = coinRadius / 16
		const radialSegments = 8
		const tubularSegments = 32

		const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
		const torus = new THREE.Mesh(geometry, material);
		torus.rotation.x = 2 * Math.PI * Math.random();
		torus.rotation.y = 2 * Math.PI * Math.random();
		torus.rotation.z = 2 * Math.PI * Math.random();
		ring.push(torus)
		scene.add(torus);
	}
}

function updateRings() {
	for (let i = 0; i < ring.length; i++) {
		ring[i].rotation.x += delta / 60;
		ring[i].rotation.y += delta / 70;
		ring[i].rotation.z += delta / 80;
	}

	// render bloom
	coin.children[0].material = darkMaterial
	bloomComposer.render();
	coin.children[0].material = coin.children[0].originalMaterial
}







init();

// TODO: don't call animate until the gltf is done loading to prevent harmless
// startup errors.
animate();