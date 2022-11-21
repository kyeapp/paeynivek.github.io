if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

		var MARGIN = 0;
    
    var panor_bool = true;
    
		var SCREEN_WIDTH = window.innerWidth;
		var SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;

		var container;
		var camera, scene, renderer;
		var mesh, texture, geometry, materials, material, current_material;
		var light, pointLight, ambientLight, spotLight;
		var m_cubes, resolution, numBlobsl
		var m_cubes_controller;
    var arm, arm_is_lowered;
		var time = 0;
    
		var clock = new THREE.Clock();

    function setup() {
      init();
      animate();
    }

		function init() {
			container = document.getElementById( 'container' );
      
			// CAMERA
      var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 5000;
      camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
			camera.position.set( 500, 500, 1200 );

			// SCENE
			scene = new THREE.Scene();
        
			// LIGHTS
      var spotLight	= new THREE.SpotLight( 0x808080 );
      spotLight.position.set(0, 1400, 0);
      spotLight.target.position.set( 0, 0, 0 );
      spotLight.castShadow	= true;
      spotLight.shadowDarkness	= .5;
      //spotLight.shadowCameraVisible	= true;
      spotLight.intensity = 1;
      spotLight.distance = 2000;
      scene.add(spotLight);
      
			pointLight = new THREE.PointLight( 0x808080 );
			pointLight.position.set(0, 1000, 0);
      pointLight.intensity = .8;
      pointLight.distance = 2500;
			scene.add( pointLight );
      
			var light = new THREE.AmbientLight( 0xf0f0f0 ); // soft white light
      scene.add( light );
      
			// MARCHING CUBES
      var m_cube_material = new THREE.MeshPhongMaterial( { color: 0x0066CC, specular: 0xFFFFFF } );
			resolution = 10;
			numBlobs = 100;

			m_cubes = new THREE.MarchingCubes( resolution, m_cube_material , true, true );
			m_cubes.position.set( 0, 0, 0 );
			m_cubes.scale.set( 600, 600, 600 );

			m_cubes.enableUvs = false;
			m_cubes.enableColors = false;
			scene.add( m_cubes );
      
      //BAMBOO ARM
      var bamboo = new THREE.MeshPhongMaterial({
        specular: 0x404040,
        map: THREE.ImageUtils.loadTexture('./images/bamboo_arm.jpg')
      });
      
      arm = new THREE.Mesh(new THREE.CylinderGeometry(80, 80, 600, 50, 50, false), bamboo);
      arm.translateZ(-600); //positioning
      scene.add(arm);
      
      //BAMBOO STAND
      stand1 = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 400, 50, 50, false), bamboo);
      stand1.translateZ(-600); //positioning
      stand1.translateY(-150);
      stand1.translateX(-120);
      scene.add(stand1);
      
      stand2 = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 400, 50, 50, false), bamboo);
      stand2.translateZ(-600); //positioning
      stand2.translateY(-150);
      stand2.translateX(120);
      scene.add(stand2);
      
      stand3 = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 300, 50, 50, false), bamboo);
      stand3.translateZ(-600); //positioning
      stand3.translateY(-200);
      stand3.rotation.z = Math.PI/2 + Math.sin(Math.PI);
      scene.add(stand3);
      
      //BOX
      var wood = new THREE.MeshPhongMaterial({
        specular: 0x404040,
        map: THREE.ImageUtils.loadTexture('./images/wood.jpg'),
      });
          
      box_side1 = new THREE.Mesh( new THREE.BoxGeometry( 1200, 400, 50 ), wood );
      box_side1.translateZ(-540);
      box_side1.translateY(-469);
      scene.add(box_side1);
      
      box_side2 = new THREE.Mesh( new THREE.BoxGeometry( 1200, 400, 50 ), wood );
      box_side2.translateZ(540);
      box_side2.translateY(-469);
      scene.add(box_side2);
      
      box_side2 = new THREE.Mesh( new THREE.BoxGeometry( 1200, 400, 50 ), wood );
      box_side2.translateX(540);
      box_side2.translateY(-470);
      box_side2.rotation.y = Math.PI/2 + Math.sin(Math.PI);
      scene.add(box_side2);
      
      box_side3 = new THREE.Mesh( new THREE.BoxGeometry( 1200, 400, 50 ), wood );
      box_side3.translateX(-540);
      box_side3.translateY(-470);
      box_side3.rotation.y = Math.PI/2 + Math.sin(Math.PI);
      scene.add(box_side3);
      
      box_side4 = new THREE.Mesh( new THREE.BoxGeometry( 1080, 50, 1080 ), wood );
      box_side4.translateY(-640);
      scene.add(box_side4);
 
       //panoramic background
      var sphere = new THREE.SphereGeometry(1000, 1000, 400);
			sphere.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1));
 
			// creation of the sphere material
			var sphereMaterial = new THREE.MeshBasicMaterial();
			sphereMaterial.map = THREE.ImageUtils.loadTexture('./images/panoramic.jpg')
 
			// geometry + material = mesh (actual object)
			var panoramic = new THREE.Mesh(sphere, sphereMaterial);
			if (panor_bool) { scene.add(panoramic); }
      
      //shadows
      m_cubes.castShadow		= true;
      m_cubes.receiveShadow =	true;
      
      arm.castShadow	= true;
      arm.receiveShadow	= true;
      
      stand1.castShadow	= false;
      stand1.receiveShadow	= true;
      
      stand2.castShadow	= false;
      stand2.receiveShadow	= true;
      
      stand3.castShadow	= false;
      stand3.receiveShadow	= true;
      
			// RENDERER
			renderer = new THREE.WebGLRenderer({ antialias: true });
			renderer.setClearColor( 0x050505 );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
      
      renderer.shadowMapEnabled	= true; //enable shadows
      renderer.shadowMapType = THREE.PCFSoftShadowMap; //shadow antialiasing

			renderer.domElement.style.position = "absolute";
			renderer.domElement.style.top = MARGIN + "px";
			renderer.domElement.style.left = "0px";

			container.appendChild( renderer.domElement );

			// CONTROLS
			controls = new THREE.OrbitControls( camera, renderer.domElement );
			var renderModel = new THREE.RenderPass( scene, camera );

			// GUI
			setupGui();

			// EVENTS
			window.addEventListener( 'resize', onWindowResize, false );
		}

		function onWindowResize( event ) {
			SCREEN_WIDTH = window.innerWidth;
			SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;

			camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
			camera.updateProjectionMatrix();

			renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
		}

		function setupGui() {
			m_cubes_controller = {

			speed: 1,
			numBlobs: 10,
			resolution: 28,
			isolation: 80,

			floor: true,
			dummy: function() {}

			};
		}
    
		// this controls content of marching cubes voxel field
		function update_cubes( object, time, numblobs, floor, wallx, wallz ) {
			object.reset();

			// fill the field with some metaballs
			var i, ballx, bally, ballyy, ballz, subtract, strength;
           
      //water surface
			subtract = 10;
			strength = 1;
      
			for ( i = 0; i < numBlobs; i ++ ) {
				ballx = Math.sin( i + .7 * time * ( 1.03 + 0.5 * Math.cos( 5* i ) ) ) * 0.5 + 0.5;
				bally = -.04;
				ballz = Math.cos( i + .7 * time * 0.1 * Math.sin( ( 0.92 + 0.53 * i ) ) ) * 0.5 + 0.5;

				object.addBall(ballx, bally, ballz, strength, subtract);
			}
      
      //Water dump
      subtract = .1;
			strength = .11;
      
      if (arm_is_lowered) {
        for ( i = 0; i < 10; i ++ ) {
          ballx = .5;
          ballz = Math.pow(Math.sin(time-i/10), .6) -.6; 
          bally = Math.cos(time-i/10) -.24; 
          
          if (bally < .44) {
            object.addBall(ballx, bally, ballz, strength, subtract);
          }
        }
      }
      
			if ( floor ) object.addPlaneY( 4.5, 12 );
		}
     
    function update_arm(object, time){
      object.rotation.x = 1.3+Math.sin(time)*.6;
      
      if (object.rotation.x > 1.55) { arm_is_lowered = true; }
      else { arm_is_lowered = false; }
    }

		function animate() {
			requestAnimationFrame( animate );
			render();
		}
    
		function render() {
			var delta = clock.getDelta();
      
			time += delta * m_cubes_controller.speed;
      
			// marching cubes
			if ( m_cubes_controller.resolution !== resolution ) {
				resolution = m_cubes_controller.resolution;
				m_cubes.init( resolution );
			}

			update_cubes( m_cubes, time, m_cubes_controller.numBlobs, m_cubes_controller.floor, m_cubes_controller.wallx, m_cubes_controller.wallz );
      update_arm(arm, time);

			// render
			renderer.clear();
      renderer.render( scene, camera );
		}
    
//CODE SITING/ACKNOWLEDGEMENTS:
//Three.js - mrdoob
//marching_cubes.js - alteredq