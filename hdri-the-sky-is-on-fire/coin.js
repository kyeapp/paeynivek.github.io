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
function init() {
	// WebGL 2.0 required for multisampled anti-aliasing
	if (WebGL.isWebGL2Available() === false) {
		document.body.appendChild(WebGL.getWebGL2ErrorMessage());
		return;
	}

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
	const copyPass = new ShaderPass(CopyShader);

	finalComposer = new EffectComposer(renderer, renderTarget);
	finalComposer.addPass(renderPass);
	finalComposer.addPass(copyPass);

	setupCoin()
	// setupLights()
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
				coin.children[0].children[0].material.side = THREE.FontSide
				coin.children[0].children[1].material.side = THREE.FontSide
				scene.add(coin);

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

				gltf.scene.children[0].children[0].material.metalness = 0.9
				gltf.scene.children[0].children[1].material.metalness = 0.9
				gltf.scene.children[0].children[0].material.roughness = 0.0
				gltf.scene.children[0].children[1].material.roughness = 0.0
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

function setupBackground() {
	new RGBELoader()
		.setPath(assetFolder)
		.load(
			// https://polyhaven.com/a/the_sky_is_on_fire
			'the_sky_is_on_fire_2k.hdr',
			function (texture) {
				texture.mapping = THREE.EquirectangularReflectionMapping;
				scene.background = texture;
				scene.environment = texture;
			}
		);
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
}

init();
animate();