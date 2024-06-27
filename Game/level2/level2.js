import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box, Rock, boxCollision } from '../resources/box.js';

let randomMovement = 1;
let camera;
let scene = new THREE.Scene();
let renderer;
let ground;
let cube;
let enemies = [];
let frames = 0;
let PortalTicket = false;
let movementSpeed = 0.05;
let enemyMovementSpeed = 0.01;
let animationId;
let spotlight;
let spotlighthelper; 
let time = 30;
const keys = {
    a: {
      pressed: false
    },
    d: {
      pressed: false
    },
    s: {
      pressed: false
    },
    w: {
      pressed: false
    },
    esc: {
        pressed: false
    },
    l: {
        pressed: false
    }
}

//Start Game
init();
animate();
initAudio(); //start background music

function init(){
    const canvas = document.getElementById('canvas');

    //renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas,
        antialias: true
    });
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //camera
    camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(7, 1.5, 0.5);
    camera.rotation.y = 1.55;

    //Skybox    (background)
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        '../resources/skybox/space-posx.jpg',
        '../resources/skybox/space-negx.jpg',
        '../resources/skybox/space-posy.jpg',
        '../resources/skybox/space-negy.jpg',
        '../resources/skybox/space-posz.jpg',
        '../resources/skybox/space-negz.jpg',
    ]);
    scene.background = texture;
    
    //moving spot light
    spotlight = new THREE.SpotLight(0xFFFFFF, 100, 15.0, (Math.PI / 6.0), 0.5, 2.0);
    spotlight.castShadow = true;
    spotlight.shadow.bias = -0.00001;
    spotlight.shadow.mapSize.width = 4096;
    spotlight.shadow.mapSize.height = 4096;
    spotlight.shadow.camera.near = 1;
    spotlight.shadow.camera.far = 100;
    spotlight.position.set(2, 5, 0);
    spotlight.lookAt(0, 0, 0);
    scene.add(spotlight);

    spotlighthelper = new THREE.SpotLightHelper(spotlight);
    //scene.add(helper)

    //ground
    ground = new Box({
    width: 15,
    height: 0.5,
    depth: 120,
    color: '#0369a1',
    position: {
        x: 0,
        y: -2,
        z: -44
    }
    });
    ground.receiveShadow = true;
    scene.add(ground);

    //Flag
    const modelloader = new GLTFLoader();
    modelloader.load('../resources/models/flag/scene.gltf', (gltf) => {
      gltf.scene.scale.set(1.5, 2 ,1);
      gltf.scene.traverse(c => {
        c.castShadow = true;
      });
      gltf.scene.position.set(-5, 2, -17);

      scene.add(gltf.scene); //place model in scene
    });
    
    createFloor();
    createWalls();
    createPortal();

    //cube => player
    cube = new Box({
    width: 1,
    height: 1,
    depth: 1,
    position:{
        x: 0,
        y: 0,
        z: 0
    },
    velocity: {
        x: 0,
        y: -0.01,
        z: 0
    }
    });
    cube.gravity =  -0.004;
    cube.castShadow = true;
    scene.add(cube);

    //load enemies
    for(let i=0; i<30; i++){
        let enemy = new Rock({
            position: {
                x: (Math.random() - 0.5) * 10,
                y: 0,
                z: -22 - (i * 4)
            },
            velocity: {
                x: 0,
                y: 0,
                z: enemyMovementSpeed
            },
            zAcceleration: true
        });
        enemy.castShadow = true;
        scene.add(enemy);
        enemies.push(enemy);
        randomMovement *= -1;
    }

    window.addEventListener( 'resize', onWindowResize );
}

function createFloor(){
    const textureLoader = new THREE.TextureLoader()
    const moonbasecolor = textureLoader.load("../resources/moon/stucco1_albedo.png");
    const moonnormalMap = textureLoader.load("../resources/moon/stucco1_Normal-dx.png");
    const moonheightMap = textureLoader.load("../resources/moon/stucco1_Height.png");
    const moonroughnessMap = textureLoader.load("../resources/moon/stucco1_Roughness.png");
    const moonambientOcclusionMap = textureLoader.load("../resources/moon/stucco1_ao.png");
    const moonsmetallic = textureLoader.load("../resources/moon/stucco1_Metallic.png");

    let plane = new THREE.Mesh(
        new THREE.PlaneGeometry(15, 36),
        new THREE.MeshStandardMaterial({ 
            color: 0x5A5A5A, 
            map: moonbasecolor, 
            normalMap: moonnormalMap, 
            displacementMap: moonheightMap, 
            displacementScale: 0.5, 
            roughnessMap: moonroughnessMap, 
            roughness: 2, 
            aoMap: moonambientOcclusionMap, 
            metalnessMap: moonsmetallic, 
            metalness: 0.4
        })
    );
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(0, -1.95, -2);
    scene.add(plane);
}

function createWalls(){
        let wall = new THREE.Mesh(
            new THREE.PlaneGeometry(41, 10),
            new THREE.MeshStandardMaterial(
                { color: 0x5A5A5A }
            )
        );
        wall.position.set(-7.5, 0, -1);
        wall.rotation.y = Math.PI / 2;
        wall.castShadow = false;
        wall.receiveShadow = true;
        scene.add(wall);
    
        let wall2 = new THREE.Mesh(
        new THREE.PlaneGeometry(15, 10),
        new THREE.MeshStandardMaterial(
            { color: 0x5A5A5A }
        )
        );
        wall2.position.set(0, 0, 16);
        wall2.rotation.y = Math.PI;
        wall2.castShadow = false;
        wall2.receiveShadow = true;
        scene.add(wall2);
}

function createPortal(){
    //portal
    const portal_texture = new THREE.TextureLoader().load('../resources/blackhole.jpg' ); 
    let portal = createPlane(portal_texture, 10, 10, 0, -1.7, -20); 
    scene.add(portal);
    
    //blocks around the portal
    const block_texture = new THREE.TextureLoader().load( "../resources/block.png" );
    block_texture.wrapS = block_texture.wrapT = THREE.RepeatWrapping;
    block_texture.repeat.set( 1, 2 );

    let pillar1 = createPlane(block_texture, 2, 5, -6, 0.7, -20);
    scene.add(pillar1);
 
    let pillar2 = createPlane(block_texture, 2, 5, 6, 0.7, -20);
    scene.add(pillar2);

    let sidePillar2 = createPlane(block_texture, 4, 5, 7, 0.7, -22);
    sidePillar2.rotation.y = Math.PI / 2;
    scene.add(sidePillar2);

    //top of portal (front)
    let topPillar = createPlane(block_texture, 2, 5, -2.5, 4.2, -20);
    topPillar.rotation.z = -Math.PI / 2;
    scene.add(topPillar);

    let topPillar2 = createPlane(block_texture, 2, 5, 2.5, 4.2, -20);
    topPillar2.rotation.z = -Math.PI / 2;
    scene.add(topPillar2);

    let sideTopPillar = createPlane(block_texture, 4, 5, 5, 2.75, -22);  //right side
    sideTopPillar.rotation.y = Math.PI / 2;
    scene.add(sideTopPillar);
}

function createPlane(texture, width, height, x, y, z){
    let plane = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshStandardMaterial(
            { map:texture, side:THREE.DoubleSide}
        )
    );
    plane.position.set(x, y, z);
    plane.castShadow = false;
    plane.receiveShadow = true;

    return plane;
}

function initAudio(){//Background audio
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);
    const loader = new THREE.AudioLoader();
    loader.load('../resources/background.mp3', (buffer) => {
        sound.setBuffer(buffer);
        sound.setVolume(0.5);
        sound.play();
    });
}

function onWindowResize() {//adjust screen based on resize (different aspect ratios)
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

//when keys is pressed

window.addEventListener('keydown', (event) => {
switch (event.code) {
    case 'KeyA':
    keys.a.pressed = true
    break
    case 'KeyD':
    keys.d.pressed = true
    break
    case 'KeyS':
    keys.s.pressed = true
    break
    case 'KeyW':
    keys.w.pressed = true
    break
    case 'KeyL':
        if(keys.l.pressed){//switch off spotlight helper
            keys.l.pressed = false;
            scene.remove(spotlighthelper);
        }
        else{//switch on spotlight helper
            keys.l.pressed = true;
            scene.add(spotlighthelper);
        }
    break
    case 'Space':
        if(cube.position.y <= 0){//prevent double jumping
            cube.velocity.y = 0.13
        }
    break
    case 'Escape':
        if(keys.esc.pressed){//close in-game menu
            keys.esc.pressed = false
            closeMenu();
            animate();
        }
        else{//open in-game menu
            keys.esc.pressed = true
            cancelAnimationFrame(animationId);
            openMenu();
        }
    break
    
}
});

window.addEventListener('keyup', (event) => {
switch (event.code) {
    case 'KeyA':
    keys.a.pressed = false
    break
    case 'KeyD':
    keys.d.pressed = false
    break
    case 'KeyS':
    keys.s.pressed = false
    break
    case 'KeyW':
    keys.w.pressed = false
    break
}
});

function animate() {
    animationId = requestAnimationFrame(animate);
    renderer.render(scene, camera);

    if(frames == 10){
        document.getElementById("load").classList.add("close-loading"); //close loading screen
    }

    //timer
    if(frames % 60 == 0 && time != 0 && time != -1){
        time--;
        document.getElementById("timer").innerHTML = "Time: " + time;
    }

    //movement code
    cube.velocity.x = 0;
    cube.velocity.z = 0;
    if (keys.w.pressed){
        cube.velocity.x = -movementSpeed;
        spotlight.position.x += movementSpeed; //move light
        spotlight.lookAt(cube.position.x, cube.position.y, cube.position.z);
        camera.position.x += -0.05; //move camera to follow player
    }
    else if (keys.s.pressed) {
        cube.velocity.x = movementSpeed;
        spotlight.position.x += -movementSpeed; //move light
        spotlight.lookAt(cube.position.x, cube.position.y, cube.position.z);
        camera.position.x += 0.05; //move camera to follow player
    }
    if (keys.a.pressed){
        cube.velocity.z = movementSpeed;
        spotlight.position.z += -movementSpeed; //move light
        spotlight.lookAt(cube.position.x, cube.position.y, cube.position.z);
        camera.rotation.y += 0.003; //move camera to follow player
    }
    else if (keys.d.pressed) {
        cube.velocity.z = -movementSpeed;
        spotlight.position.z += movementSpeed; //move light
        spotlight.lookAt(cube.position.x, cube.position.y, cube.position.z);
        camera.rotation.y -= 0.003; //move camera to follow player
    }
    cube.update(ground);

    //Enemy movement
    if(time <= 30 && time >= 20){//wave 1
        for(let i = 0; i < 10; i++ ){
            enemies[i].update(ground);
            enemies[i].rotation.x += 0.05;
            if ( boxCollision({ box1: cube, box2: enemies[i]}) ) { //player collides with enemy
                cancelAnimationFrame(animationId);
                gameOver(); //screen
            }
        }
        
    }
    else if(time <= 20 && time >= 10){ //wave 2
        for(let i = 0; i < 20; i++ ){
            enemies[i].update(ground);
            enemies[i].rotation.x += 0.05;
            if ( boxCollision({ box1: cube, box2: enemies[i]}) ) { //player collides with enemy
                cancelAnimationFrame(animationId);
                gameOver(); //screen
            }
        }
        
    }
    else if(time <= 10){//wave 3
        for(let i = 0; i < 30; i++ ){
            enemies[i].update(ground);
            enemies[i].rotation.x += 0.05;
            if ( boxCollision({ box1: cube, box2: enemies[i]}) ) { //player collides with enemy
                cancelAnimationFrame(animationId);
                gameOver(); //screen
            }
        }
        
    }
    
    //Player fell off platform
    if(cube.position.y < -2.5){//fell off platform
        cancelAnimationFrame(animationId); //stop game
        gameOver(); //add game over screen
    }

    //Win Condition
    if(time == 0){
        //create portal lights
        let portalLight1 = new THREE.PointLight( 0xffffff, 3, 150 );
        portalLight1.position.set( -1, 1, -18 );
        scene.add( portalLight1 );

        let portalLight2 = new THREE.PointLight( 0xffffff, 3, 150 );
        portalLight2.position.set( 1, 1, -18 );
        scene.add( portalLight2 );

        //create portal lightfor flag
        let flaglight = new THREE.PointLight( 0xffffff, 3, 150 );
        flaglight.position.set( -5, 2, -16 );
        scene.add( flaglight ); 

        PortalTicket = true;
        camera.rotation.y -= 0.1; //turn camera to portal
        
        document.getElementById("mission_title").innerHTML = "Mission Completed";
        document.getElementById("mission").innerHTML = "Enter Portal!";
        document.getElementById("objective").style = "margin-left: 35%;"
        time = -1;
    }

    if(PortalTicket){ //you may enter the portal
        if(cube.position.z <= -20){
            //go to level 3
            cancelAnimationFrame(animationId);
            window.location.href = "../level3/level3.html";
        }
    }

    frames++;
}
  
function gameOver(){//game over screen
    const openModalButtons = document.querySelectorAll('[data-modal-target]')
    const restartButton = document.querySelectorAll('[restart-button]')
    const overlay = document.getElementById('overlay')

    openModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.querySelector(button.dataset.modalTarget)
            openModal(modal)
        })
    })

    overlay.addEventListener('click', () => {
        const modals = document.querySelectorAll('.modal.active')
        modals.forEach(modal => {
        })
    })

    function openModal(modal) {
        if (modal == null) return
        modal.classList.add('active')
        overlay.classList.add('active')
    }

    restartButton.forEach(button => {
        button.addEventListener('click', () => {
            location.reload();
        })
    })
    document.getElementById("open").click();  //click button
}

//in-Game Menu
function openMenu(){
    document.getElementById("popup").classList.add("open-popup");
}
function closeMenu(){
    document.getElementById("popup").classList.remove("open-popup");
}  