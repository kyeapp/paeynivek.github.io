import * as THREE from 'three';
import Stats from 'three.js/examples/jsm/libs/stats.module.js';
import WebGL from 'three.js/examples/jsm/capabilities/WebGL.js';
import { OrbitControls } from 'three.js/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three.js/examples/jsm/loaders/GLTFLoader.js';
import { RenderPass } from 'three.js/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three.js/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three.js/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three.js/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three.js/examples/jsm/shaders/FXAAShader.js';
import { RGBELoader } from 'three.js/examples/jsm/loaders/RGBELoader.js';

// const stats = Stats()
// document.body.appendChild(stats.dom)

const coinRadius = 13;
const assetFolder = '../assets/'

var scene, camera, renderer;
var bloomComposer, finalComposer;
var controls;

function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x000000, 1);
	renderer.outputEncoding = THREE.sRGBEncoding
	document.body.appendChild(renderer.domElement);

	controls = new OrbitControls(camera, renderer.domElement);

	camera.position.set(0, 0, 2.5 * coinRadius);
	camera.lookAt(0, 0, 0);

	const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
	scene.add(ambientLight);

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
	let l = loader.load(
		assetFolder + 'coin.glb',
		function (gltf) {
			coin = gltf.scene;
			coin.children[0].children[0].material.side = THREE.FontSide
			coin.children[0].children[1].material.side = THREE.FontSide
			scene.add(coin);

			// save original material
			for (let mesh of coin.children[0].children) {
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
			for (let i in coin.children[0].children) {
				let geometry = coin.children[0].children[i].geometry
				let coinEdgeGeometry = new THREE.EdgesGeometry(geometry, 30);
				let edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
				let coinOutline = new THREE.LineSegments(coinEdgeGeometry, edgeMaterial);
				coinOutlineGroup.add(coinOutline)
			}
			scene.add(coinOutlineGroup);
		},
		(xhr) => {
			// coin loaded
		},
		(error) => {
			console.log(error)
		}
	)

	setupLights()
	setupRings()

	window.addEventListener('resize', onWindowResize, false)
	window.addEventListener('click', onClick, false);

	const params = {
		exposure: 1.0,
		bloomStrength: 0.7,
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
	[-64, -16, -8, -4, -2, -1, 0, 0]
);
const tailSpinTrack = new THREE.NumberKeyframeTrack(
	'.rotationAmount',
	[0.0, 0.5, 1.00, 1.50, 2.0, 2.5, 3.0, 5.0],
	[-64 + Math.PI, -16 + Math.PI, -8 + Math.PI, -4 + Math.PI, -2 + Math.PI, -1 + Math.PI, 0 + Math.PI, Math.PI]
);

const mouse = new THREE.Vector2();
function onClick(event) {
	event.preventDefault();

	const raycaster = new THREE.Raycaster();

	mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
	mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);

	const intersects = raycaster.intersectObjects(coin.children[0].children);

	if (intersects.length < 1) {
		// no objects clicked
		return
	}
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
	updateRings()

	for (let mesh of coin.children[0].children) {
		mesh.material = darkMaterial
	}
	bloomComposer.render();
	for (let mesh of coin.children[0].children) {
		mesh.material = mesh.originalMaterial
	}
	finalComposer.render();

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

// TODO:
// - try forcing the color values to be apart form each other to get more
// colorul rings.
// - try different ring speeds
var ring = []
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

function setupBackground() {
	setupRings()
}

init();
animate();