//detect webgl

if(!Detector.webgl){
	Detector.addGetWebGLMessage();
	document.getElementById('container').innerHTML = '';
}

//graphics variables
var container,stats;
var camera, controls,scene, renderer;
var textureLoader;
var clock = new THREE.Clock();
var mouseCoords = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var ballMaterial = new THREE.MeshPhongMaterial({
	color: 0x0055ff
});

//physics variables
var gravityConstant = 7.8;
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var physicsWorld;
var margin = 0.05;
var convexBreaker = new THREE.ConvexObjectBreaker();

//rigid bodies include all movable objects
var rigidBodies = [];
var pos = new THREE.Vector3();
var quat = new THREE.Quaternion();
var transformAux1 = new Ammo.btTransform();
var tempBtVec3_1 = new Ammo.btVector3(0,0,0);
var time = 0;
var objectsToRemove = [];
//?
// for(var i = 0; i < 500; i++){
// 	objectsToRemove[i] = null;
// }
var numObjectsToRemove = 0;
var impactPoint = new THREE.Vector3();
var impactNormal = new THREE.Vector3();

init();
animate();

//utility function
function init(){
	initGraphics();
	initPhysics();
	createObjects();
	initInput();
}
function initGraphics(){
	container = document.getElementById('container');
	camera = new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,1,10000);
	scene = new THREE.Scene();
	camera.position.x = -14;
	camera.position.y = 8;
	camera.position.z = 16;
	controls = new THREE.OrbitControls(camera);
	controls.target.y = 2;
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0x8ed7ff);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth,window.innerHeight);
	renderer.shadowMap.enabled = true;
	textureLoader = new THREE.TextureLoader();
	var ambientLight = new THREE.AmbientLight(0x707070);
	scene.add(ambientLight);
	var light = new THREE.DirectionalLight(0xffffff,1);
	light.position.set(-10,18,5);
	light.castShadow = true;
	var d = 14;
	light.shadow.camera.left = -d;
	light.shadow.camera.right = d;
	light.shadow.camera.top = d;
	light.shadow.camera.bottom = -d;
	light.shadow.camera.near = 2;
	light.shadow.camera.far = 50;
	light.shadow.mapSize.x = 1024;
	light.shadow.mapSize.y = 1024;
	scene.add(light);
	container.innerHTML = '';
	container.appendChild(renderer.domElement);
	// stats = new Stats();
	// stats.domElement.style.position = 'absolute';
	// stats.domElement.style.top = '0px';
	// container.appendChild(stats.domElement);

	window.addEventListener('resize',onWindowResize,false);
}

function initPhysics() {
	// Physics configuration
	collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
	broadphase = new Ammo.btDbvtBroadphase();
	solver = new Ammo.btSequentialImpulseConstraintSolver();
	physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
	physicsWorld.setGravity( new Ammo.btVector3( 0, - gravityConstant, 0 ) );
}

function createObject(mass,halfExtents,pos,quat,material){
	var object = new THREE.Mesh(new THREE.BoxGeometry(halfExtents.x*2,halfExtents.y*2,halfExtents.z*2),material);
	object.position.copy(pos);
	object.quaternion.copy(quat);
	convexBreaker.prepareBreakableObject(object,mass,new THREE.Vector3(),new THREE.Vector3(),true);
	createDebrisFromBreakableObject(object);
}

function createObjects(){
	//ground
	pos.set(0,-0.5,0);
	quat.set(0,0,0,1);
	var ground = createParalellepipedWithPhysics(60,1,60,0,pos,quat,new THREE.MeshPhongMaterial({color:0xffffff}));
	ground.receiveShadow = true;
	textureLoader.load('textures/background.png',function(texture){
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(40,40);
		ground.material.map = texture;
		ground.material.needsUpdate = true;
	});

	// Tower 1
	var towerMass = 1000;
	var towerHalfExtents = new THREE.Vector3( 2, 5, 2 );
	var towerHalfExtents1 = new THREE.Vector3( 2, 6, 2 );
	pos.set( -8, 5, 5 );
	quat.set( 0, 0, 0, 1 );
	createObject( towerMass, towerHalfExtents, pos, quat, createMaterial(0xfcd62a) );
	// Tower 2
	pos.set( 8, 5, 5 );
	quat.set( 0, 0, 0, 1 );
	createObject( towerMass, towerHalfExtents1, pos, quat, createMaterial(0x32c9b0) );

	pos.set( -8, 5, -5 );
	quat.set( 0, 0, 0, 1 );
	createObject( towerMass, towerHalfExtents, pos, quat, createMaterial(0x42af21) );

	pos.set( 8, 5, -5 );
	quat.set( 0, 0, 0, 1 );
	createObject( towerMass, towerHalfExtents1, pos, quat, createMaterial(0x4286f4) );

	//Bridge
	var bridgeMass = 100;
	var bridgeHalfExtents = new THREE.Vector3( 7, 0.2, 1.5 );

	var bridgeHalfExtents1 = new THREE.Vector3( 1.5, 0.2, 7 );
	pos.set( 0, 10.2, 5 );
	quat.set( 0, 0, 0, 1 );
	createObject( bridgeMass, bridgeHalfExtents, pos, quat, createMaterial(0xff9999) );

	pos.set( 0, 10.2, -5 );
	quat.set( 0, 0, 0, 1 );
	createObject( bridgeMass, bridgeHalfExtents, pos, quat, createMaterial(0xff3333) );

	pos.set( -8.3, 10.2, 0 );
	quat.set( 0, 0, 0, 1 );
	createObject( bridgeMass, bridgeHalfExtents1, pos, quat, createMaterial(0xff6666) );

	pos.set( 8.3, 10.2, 0 );
	quat.set( 0, 0, 0, 1 );
	createObject( bridgeMass, bridgeHalfExtents1, pos, quat, createMaterial(0x800000) );

	// Stones
	var stoneMass = 120;
	var stoneHalfExtents = new THREE.Vector3( 1, 2, 0.15 );
	var numStones = 8;
	quat.set( 0, 0, 0, 1 );
	for ( var i = 0; i < numStones; i++ ) {
	    pos.set( 0, 2, 15 * ( 0.5 - i / ( numStones + 1 ) ) );
	    createObject( stoneMass, stoneHalfExtents, pos, quat, createMaterial( 0x663300 ) );
	}
	// Mountain
	// var mountainMass = 860;
	// var mountainHalfExtents = new THREE.Vector3( 4, 5, 4 );
	// pos.set( 5, mountainHalfExtents.y * 0.5, - 7 );
	// quat.set( 0, 0, 0, 1 );
	// var mountainPoints = [];
	// mountainPoints.push( new THREE.Vector3( mountainHalfExtents.x, - mountainHalfExtents.y, mountainHalfExtents.z ) );
	// mountainPoints.push( new THREE.Vector3( - mountainHalfExtents.x, - mountainHalfExtents.y, mountainHalfExtents.z ) );
	// mountainPoints.push( new THREE.Vector3( mountainHalfExtents.x, - mountainHalfExtents.y, - mountainHalfExtents.z ) );
	// mountainPoints.push( new THREE.Vector3( - mountainHalfExtents.x, - mountainHalfExtents.y, - mountainHalfExtents.z ) );
	// mountainPoints.push( new THREE.Vector3( 0, mountainHalfExtents.y, 0 ) );
	// var mountain = new THREE.Mesh( new THREE.ConvexGeometry( mountainPoints ), createMaterial( 	0xffbf00 ) );
	// mountain.position.copy( pos );
	// mountain.quaternion.copy( quat );
	// convexBreaker.prepareBreakableObject( mountain, mountainMass, new THREE.Vector3(), new THREE.Vector3(), true );
	// createDebrisFromBreakableObject( mountain );
}

function createParalellepipedWithPhysics(sx,sy,sz,mass,pos,quat,material){
	var object = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz,1,1,1),material);
	var shape = new Ammo.btBoxShape(new Ammo.btVector3(sx*0.5,sy*0.5,sz*0.5));
	shape.setMargin(margin);
	createRigidBody(object,shape,mass,pos,quat);
	return object;
}

function createDebrisFromBreakableObject(object){
	object.castShadow = true;
	object.receiveShadow = true;
	var shape = createConvexHullPhysicsShape(object.geometry.vertices);
	shape.setMargin(margin);
	var body = createRigidBody(object,shape,object.userData.mass,null,null,object.userData.velocity,object.userData.angularVelocity);

	//set pointer back to the three object only in the debris objects
	var btVecUserData = new Ammo.btVector3(0,0,0);
	btVecUserData.threeObject = object;
	body.setUserPointer(btVecUserData);
}

function removeDebris(object){
	scene.remove(object);
	physicsWorld.removeRigidBody(object.userData.physicsBody);
}

function createConvexHullPhysicsShape( points ) {
			var shape = new Ammo.btConvexHullShape();
			for ( var i = 0, il = points.length; i < il; i++ ) {
				var p = points[ i ];
				this.tempBtVec3_1.setValue( p.x, p.y, p.z );
				var lastOne = ( i === ( il - 1 ) );
				shape.addPoint( this.tempBtVec3_1, lastOne );
			}
			return shape;
		}

function createRigidBody(object,physicsShape,mass,pos,quat,vel,angVel){
	if(pos){
		object.position.copy(pos);
	}else{
		pos = object.position;
	}

	if(quat){
		object.quaternion.copy(quat);
	}else{
		quat = object.quaternion;
	}
	var transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btVector3(pos.x,pos.y,pos.z));
	transform.setRotation(new Ammo.btQuaternion(quat.x,quat.y,quat.z,quat.w));
	var motionState = new Ammo.btDefaultMotionState(transform);
	var localInertia = new Ammo.btVector3(0,0,0);
	physicsShape.calculateLocalInertia(mass,localInertia);
	var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass,motionState,physicsShape,localInertia);
	var body = new Ammo.btRigidBody(rbInfo);
	body.setFriction(0.5);
	if(vel){
		body.setLinearVelocity(new Ammo.btVector3(vel.x,vel.y,vel.z));
	}
	if(angVel){
		body.setAngularVelocity(new Ammo.btVector3(angVel.x,angVel.y,angVel.z));

	}
	object.userData.physicsBody = body;
	object.userData.collided = false;
	scene.add(object);
	if(mass > 0){
		rigidBodies.push(object);
		body.setActivationState(4);
	}
	physicsWorld.addRigidBody(body);
	return body;
}

function createRandomColor(){
	return Math.floor(Math.random()*(1 << 24));
}

function createMaterial(color){
	color = color || createRandomColor();
	return new THREE.MeshPhongMaterial({color:color});
}

function initInput(){
	window.addEventListener('mousedown',mouseEvent,false);
	window.addEventListener('touchend',mouseEvent,false);
}

function mouseEvent(event){
	mouseCoords.set((event.clientX/window.innerWidth)*2-1,-(event.clientY/window.innerHeight)*2+1);
	raycaster.setFromCamera(mouseCoords,camera);

	//create a ball and throws it
	var ballMass = 35;
	var ballRadius = 0.4;
	var ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius,14,10),ballMaterial);
	ball.castShadow = true;
	ball.receiveShadow = true;
	var ballShape = new Ammo.btSphereShape(ballRadius);
	ballShape.setMargin(margin);
	pos.copy(raycaster.ray.direction);
	pos.add(raycaster.ray.origin);
	quat.set(0,0,0,1);
	var ballBody = createRigidBody(ball,ballShape,ballMass,pos,quat);
	pos.copy(raycaster.ray.direction);
	pos.multiplyScalar(24);
	ballBody.setLinearVelocity(new Ammo.btVector3(pos.x,pos.y,pos.z));
}


function onWindowResize(){
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth,window.innerHeight);
}

function animate(){
	requestAnimationFrame(animate);
	render();
	// stats.update();
}
function render(){
	var deltaTime = clock.getDelta();
	updatePhysics(deltaTime);
	controls.update(deltaTime);
	renderer.render(scene,camera);
	time += deltaTime;
}
function updatePhysics( deltaTime ) {
			// Step world
			physicsWorld.stepSimulation( deltaTime, 10 );
			// Update rigid bodies
			for ( var i = 0, il = rigidBodies.length; i < il; i++ ) {
				var objThree = rigidBodies[ i ];
				var objPhys = objThree.userData.physicsBody;
				var ms = objPhys.getMotionState();
				if ( ms ) {
					ms.getWorldTransform( transformAux1 );
					var p = transformAux1.getOrigin();
					var q = transformAux1.getRotation();
					objThree.position.set( p.x(), p.y(), p.z() );
					objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
					objThree.userData.collided = false;
				}
			}
			for ( var i = 0, il = dispatcher.getNumManifolds(); i < il; i ++ ) {
				var contactManifold = dispatcher.getManifoldByIndexInternal( i );
				var rb0 = contactManifold.getBody0();
				var rb1 = contactManifold.getBody1();
				var threeObject0 = Ammo.castObject( rb0.getUserPointer(), Ammo.btVector3 ).threeObject;
				var threeObject1 = Ammo.castObject( rb1.getUserPointer(), Ammo.btVector3 ).threeObject;
				if ( ! threeObject0 && ! threeObject1 ) {
					continue;
				}
				var userData0 = threeObject0 ? threeObject0.userData : null;
				var userData1 = threeObject1 ? threeObject1.userData : null;
				var breakable0 = userData0 ? userData0.breakable : false;
				var breakable1 = userData1 ? userData1.breakable : false;
				var collided0 = userData0 ? userData0.collided : false;
				var collided1 = userData1 ? userData1.collided : false;
				if ( ( ! breakable0 && ! breakable1 ) || ( collided0 && collided1 ) ) {
					continue;
				}
				var contact = false;
				var maxImpulse = 0;
				for ( var j = 0, jl = contactManifold.getNumContacts(); j < jl; j ++ ) {
					var contactPoint = contactManifold.getContactPoint( j );
					if ( contactPoint.getDistance() < 0 ) {
						contact = true;
						var impulse = contactPoint.getAppliedImpulse();
						if ( impulse > maxImpulse ) {
							maxImpulse = impulse;
							var pos = contactPoint.get_m_positionWorldOnB();
							var normal = contactPoint.get_m_normalWorldOnB();
							impactPoint.set( pos.x(), pos.y(), pos.z() );
							impactNormal.set( normal.x(), normal.y(), normal.z() );
						}
						break;
					}
				}
				// If no point has contact, abort
				if ( ! contact ) {
					continue;
				}
				// Subdivision
				var fractureImpulse = 250;
				if ( breakable0 && !collided0 && maxImpulse > fractureImpulse ) {
					var debris = convexBreaker.subdivideByImpact( threeObject0, impactPoint, impactNormal , 1, 2, 1.5 );
					var numObjects = debris.length;
					for ( var j = 0; j < numObjects; j++ ) {
						createDebrisFromBreakableObject( debris[ j ] );
					}
					objectsToRemove[ numObjectsToRemove++ ] = threeObject0;
					userData0.collided = true;
				}
				if ( breakable1 && !collided1 && maxImpulse > fractureImpulse ) {
					var debris = convexBreaker.subdivideByImpact( threeObject1, impactPoint, impactNormal , 1, 2, 1.5 );
					var numObjects = debris.length;

					for ( var j = 0; j < numObjects; j++ ) {
						createDebrisFromBreakableObject( debris[ j ] );
					}
					objectsToRemove[ numObjectsToRemove++ ] = threeObject1;
					userData1.collided = true;
				}
			}
			for ( var i = 0; i < numObjectsToRemove; i++ ) {
			    removeDebris( objectsToRemove[ i ] );
			}
			numObjectsToRemove = 0;
		}



















