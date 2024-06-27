import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

// Define the initial game time (in seconds)
let gameTime = 30;
let NumShot = 0;
let timerElement = document.getElementById("timer");

let isGameRunning = true;

let insetHeight = window.innerHeight / 5;
let insetWidth = window.innerWidth / 5;

function updateTimer() {
    if (isGameRunning) {
      gameTime -= 0.01;
      
      timerElement.innerText = `Time: ${gameTime.toFixed(1)}s`;

      if (gameTime <= 0) {
        timerElement.innerText = "Game Over";
        isGameRunning = false;

        controls.unlock();
        document.getElementById('playButton').innerText = 'CONGRATULATIONS, YOU HIT ' + NumShot + ' Objects';

        }
    }
  }

// Set up the scene
var scene = new THREE.Scene();

// Create the first-person camera
const firstPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
firstPersonCamera.position.set(9, 1, 0); // Set the initial position for the first-person camera

let camera = firstPersonCamera;

var player = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
player.position.set(0, 0, 0);
camera.add(player);

//mini map
let mapCamera = new THREE.PerspectiveCamera(90,window.innerWidth / window.innerHeight, 0.01, 500);
mapCamera.position.set(0, 10, 0);
mapCamera.lookAt(0, 0, 0);
camera.add(mapCamera);
scene.add(camera);

// Create the renderer
var renderer = new THREE.WebGLRenderer({ alpha: true, depth: true });
// Configure renderer settings
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
renderer.setClearColor(0x000000, 1); // Set background color to black
renderer.domElement.style.position = 'fixed';
renderer.domElement.id = 'renderer';
renderer.domElement.style.zIndex = '-1';
renderer.domElement.style.left = '0';
renderer.domElement.style.top = '0';
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMapSoft = true;



var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var particles = [];
var triangles = [];
let cubes = []

var hasCubeMoved = false; // Flag to track if the cube has already been moved


// Add PointerLockControls
var controls = new THREE.PointerLockControls(camera, document.body);

const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

const water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load( '../resources/waternormals.jpg', function ( texture ) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            } ),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 5,
            fog: scene.fog !== undefined
        }
    );

    water.rotation.x = - Math.PI / 2;
    water.position.set(0, -1, 0);
    scene.add( water );


    // Skybox
let sun = new THREE.Vector3();
const sky = new Sky();
sky.scale.setScalar( 10000 );
scene.add( sky );
const skyUniforms = sky.material.uniforms;
skyUniforms[ 'turbidity' ].value = 10;
skyUniforms[ 'rayleigh' ].value = 2;
skyUniforms[ 'mieCoefficient' ].value = 0.005;
skyUniforms[ 'mieDirectionalG' ].value = 0.8;
const parameters = {
    elevation: 5,
    azimuth: 180
};
const pmremGenerator = new THREE.PMREMGenerator( renderer );
const sceneEnv = new THREE.Scene();
let renderTarget;

function updateSun() {

    const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
    const theta = THREE.MathUtils.degToRad( parameters.azimuth );

    sun.setFromSphericalCoords( 1, phi, theta );

    sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
    water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

    if ( renderTarget !== undefined ) renderTarget.dispose();

    sceneEnv.add( sky );
    renderTarget = pmremGenerator.fromScene( sceneEnv );
    scene.add( sky );

    scene.environment = renderTarget.texture;

}

updateSun();

// Create a cube
var shapes = [new THREE.SphereGeometry(1), new THREE.IcosahedronGeometry( 2 ), new THREE.BoxGeometry(1, 1, 1), new THREE.CylinderGeometry(1, 2, 3, 4 ), new THREE.ConeGeometry( 1, 3, 6 )]
let randcolor = new THREE.Color( 0xffffff );

for (var i = 0; i < 5; i++) {
    randcolor.setHex( Math.random() * 0xffffff );
    var cube = new THREE.Mesh(shapes[i], new THREE.MeshBasicMaterial({ color: randcolor }));
    cube.position.set(0, 0.5, 0); // Set cube position 0.5 units above the grid
    cube.castShadow = true;
    scene.add(cube);
    cubes.push(cube);
}

// Set camera to face cube position
camera.lookAt(cube.position)

// Set up pointer lock controls
var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
var playButton = document.getElementById('playButton');

playButton.addEventListener('click', function () {
    controls.lock();
});

controls.addEventListener('lock', function () {
    instructions.style.display = 'none';
    blocker.style.display = 'none';
    document.getElementById('crosshair').style.display = 'block'; // Show the crosshair when screen is locked
});

controls.addEventListener('unlock', function () {
    blocker.style.display = 'block';
    instructions.style.display = '';
    document.getElementById('crosshair').style.display = 'none'; // Hide the crosshair when screen is unlocked
});

scene.add(controls.getObject());

// Keyboard controls
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;

var onKeyDown = function (event) {
    switch (event.keyCode) {
        case 38: // up arrow
        case 87: // W key
            moveForward = true;
            break;
        case 37: // left arrow
        case 65: // A key
            moveLeft = true;
            break;
        case 40: // down arrow
        case 83: // S key
            moveBackward = true;
            break;
        case 39: // right arrow
        case 68: // D key
            moveRight = true;
            break;
    }
};

var onKeyUp = function (event) {
    switch (event.keyCode) {
        case 38: // up arrow
        case 87: // W key
            moveForward = false;
            break;
        case 37: // left arrow
        case 65: // A key
            moveLeft = false;
            break;
        case 40: // down arrow
        case 83: // S key
            moveBackward = false;
            break;
        case 39: // right arrow
        case 68: // D key
            moveRight = false;
            break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Check collision with the grid
function checkCollision(position) {
    var gridSize = 50;
    var halfGridSize = gridSize / 2;
    var margin = 0.1;

    if (
        position.x < -halfGridSize + margin ||
        position.x > halfGridSize - margin ||
        position.z < -halfGridSize + margin ||
        position.z > halfGridSize - margin
    ) {
        return true; // Collision detected
    }

    return false; // No collision
}

// Render loop
function animate() {
    requestAnimationFrame(animate);

    //water
    water.material.uniforms[ 'time' ].value += 1.0 / 50.0;

    //render camera
    renderer.setViewport(0, 0,  window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    //render minmap
    renderer.clearDepth();
    renderer.setScissorTest(true);
    renderer.setScissor(
        window.innerWidth - insetWidth - 16, 
        16,
        insetWidth,
        insetHeight
    );
    renderer.setViewport(
        window.innerWidth - insetWidth - 16, 
        16,
        insetWidth,
        insetHeight
    );
    renderer.render(scene, mapCamera);
    renderer.setScissorTest(false);
    
    if (isGameRunning) {
        updateParticles();
        checkParticleCollision();
    
        if (controls.isLocked) {
          var delta = 0.09;
    
          if (moveForward) {
            controls.moveForward(delta);
            if (checkCollision(controls.getObject().position)) {
              controls.moveForward(-delta); // Move back to the previous position
            }
          }
    
          if (moveBackward) {
            controls.moveForward(-delta);
            if (checkCollision(controls.getObject().position)) {
              controls.moveForward(delta); // Move back to the previous position
            }
          }
    
          if (moveLeft) {
            controls.moveRight(-delta);
            if (checkCollision(controls.getObject().position)) {
              controls.moveRight(delta); // Move back to the previous position
            }
          }
    
          if (moveRight) {
            controls.moveRight(delta);
            if (checkCollision(controls.getObject().position)) {
              controls.moveRight(-delta); // Move back to the previous position
            }
          }
    
          updateTimer();
        }
    
        updateTriangles();
    }

}

animate();


function removeParticle(particle) {
    scene.remove(particle);
    particles.splice(particles.indexOf(particle), 1);
}

function createParticle() {
    playLaserSound();
    var geometry = new THREE.SphereGeometry(0.05, 16, 16);
    var material = new THREE.MeshBasicMaterial({ color: 0xADD8E6 });
    var particle = new THREE.Mesh(geometry, material);
    particle.position.copy(camera.position);
    particle.initialDirection = camera.getWorldDirection(new THREE.Vector3());
    particle.velocity = particle.initialDirection.clone().multiplyScalar(0.25);
    scene.add(particle);
    particles.push(particle);
}

function updateParticles() {
    var distanceThreshold = 20;

    for (var i = particles.length - 1; i >= 0; i--) {
        var particle = particles[i];
        particle.position.add(particle.velocity);

        var distance = particle.position.distanceTo(camera.position);
        if (distance > distanceThreshold) {
            removeParticle(particle);
        }
    }
}

function onMouseDown(event) {
    event.preventDefault();

    if (controls.isLocked) {
        // Particle creation is allowed only when controls are locked
        if (event.button === 0) {
            createParticle();
        }
    }
}

function onMouseMove(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
}

// Mouse click event listener
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove, false);

// Declare a variable to count collided particles
var collidedParticles = 0;

var hasCubeMoved = false; // Flag to track if the cube has already been moved

// Check collision between particles and cubes
function checkParticleCollision() {
    for (var j = 0; j < cubes.length; j++) {
        var cube = cubes[j];
        var isColliding = false;

        if (cube.visible) {
            for (var i = 0; i < particles.length; i++) {
                var particle = particles[i];
                var particlePosition = particle.position;
                var particleEdge = particlePosition
                    .clone()
                    .add(particle.velocity.clone().normalize().multiplyScalar(0.1));

                raycaster.set(particlePosition, particleEdge.sub(particlePosition).normalize());
                var intersects = raycaster.intersectObject(cube);

                if (intersects.length === 1) {
                    // Particle collided with the cube
                    isColliding = true;
                    break;
                }
            }
        }

        //cube.material.color.set(0xff0000);
        // Set cube color and visibility based on collision status
        if (isColliding) {
            explosion(cube);
            moveCubeRandomly(cube);
            hasCubeMoved = false; // Reset the flag when the cube is hidden
            NumShot++;
        } else {

            // Check if all particles have been removed and the cube has not moved
            if (collidedParticles === particles.length && !hasCubeMoved) {
                collidedParticles = 0; // Reset the collided particles counter
                hasCubeMoved = true; // Set the flag to indicate that the cube has been moved
            }
        }
        
    }
}

// Move the cube to a random location on the grid
function moveCubeRandomly(cube) {
    var gridSize = 50; // Adjust the grid size as desired
    var randomX = Math.floor(Math.random() * gridSize) - gridSize / 2;
    var randomZ = Math.floor(Math.random() * gridSize) - gridSize / 2;

    cube.position.x += randomX;
    cube.position.z += randomZ;
}


// Create an explosion of small triangles
function explosion(cube) {

    playExplosionSound();

    var explosionCount = 20;

    for (var i = 0; i < explosionCount; i++) {
        var triangle = createTriangle(cube);
        scene.add(triangle);
        triangles.push(triangle); // Add the triangle to the triangles array

        triangle.userData = {
            direction: new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize(),
            speed: Math.random() * 0.05 + 0.01, // Random speed
            rotationAxis: new THREE.Vector3(
                Math.random(),
                Math.random(),
                Math.random()
            ).normalize(),
            rotationSpeed: Math.random() * 0.1 + 0.005, // Random rotation speed
            distance: 0, // Distance traveled by the triangle
            remove: false, // Flag to mark if the triangle should be removed
            parentCube: cube, // Reference to the collided cube
        };
    }
}


// Create a small triangle
function createTriangle(cube) {
    var geometry = new THREE.BufferGeometry();
    var vertices = new Float32Array([
        -0.1, 0, 0,
        0.1, 0, 0,
        0, 0.1, 0
    ]);
    var indices = new Uint16Array([0, 1, 2]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    var material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });

    var triangle = new THREE.Mesh(geometry, material);

    // Set initial position at the center of the collided cube
    triangle.position.copy(cube.position);

    // Set the rotation to face the camera
    triangle.lookAt(camera.position);

    // Set random scale
    var scale = Math.random() * 1 + 0.5; // Adjust the scale range as desired
    triangle.scale.set(scale, scale, scale);

    return triangle;
}


// Update the triangles' positions, rotations, and remove them if necessary
function updateTriangles() {
    for (var i = 0; i < triangles.length; i++) {
        var triangle = triangles[i];
        var userData = triangle.userData;

        // Move the triangle in its direction at a random speed
        var speed = userData.speed;
        triangle.position.add(userData.direction.clone().multiplyScalar(speed));

        // Rotate the triangle around its rotation axis at a random speed
        var rotationSpeed = userData.rotationSpeed;
        triangle.rotateOnWorldAxis(userData.rotationAxis, rotationSpeed);

        // Update the distance traveled by the triangle
        userData.distance += speed;

        // If the triangle has traveled a certain distance, mark it for removal
        if (userData.distance >= 2) {
            userData.remove = true;
        }
    }

    // Remove triangles that are marked for removal
    for (var i = triangles.length - 1; i >= 0; i--) {
        if (triangles[i].userData.remove) {
            scene.remove(triangles[i]);
            triangles.splice(i, 1);
        }
    }


    // Resize renderer when window size changes
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

        insetHeight = window.innerHeight / 5;
        insetWidth = window.innerWidth / 5;

        mapCamera.aspect = insetWidth / insetHeight;
        mapCamera.updateProjectionMatrix();
    });

}


// Create an AudioContext
var audioContext = null;
var laserSoundBuffer = null;
var explosionSoundBuffer = null;

// Function to load audio files
function loadAudioFile(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = function () {
        audioContext.decodeAudioData(request.response, function (buffer) {
            callback(buffer);
        });
    };

    request.send();
}


// Function to play the laser sound
function playLaserSound() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (!laserSoundBuffer) {
        loadAudioFile('https://www.shanebrumback.com/sounds/laser.wav', function (buffer) {
            laserSoundBuffer = buffer;
            playSound(buffer, 1);
        });
    } else {
        playSound(laserSoundBuffer, 1);
    }
}

// Function to play the explosion sound
function playExplosionSound() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (!explosionSoundBuffer) {
        loadAudioFile('https://www.shanebrumback.com/sounds/explosion.wav', function (buffer) {
            explosionSoundBuffer = buffer;
            playSound(buffer, 0.25); // Adjust the volume here (0.5 = 50% volume)
        });
    } else {
        playSound(explosionSoundBuffer, 0.25); // Adjust the volume here (0.5 = 50% volume)
    }
}

// Function to play a sound with a specific volume
function playSound(buffer, volume) {
    var source = audioContext.createBufferSource();
    var gainNode = audioContext.createGain();
    gainNode.gain.value = volume;

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
}

function initAudio(){//Background audio
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);
    const loader = new THREE.AudioLoader();
    loader.load('../resources/shooting.mp3', (buffer) => {
        sound.setBuffer(buffer);
        sound.setVolume(0.5);
        sound.play();
    });
}
initAudio();

// Event listener for key press
document.addEventListener('keydown', function (event) {
    if (event.key === ' ') {
        if (isGameRunning) {
            if (controls.isLocked) {
              event.preventDefault(); // Prevent default action of spacebar
              createParticle();
              playLaserSound();
            }
          }
    } else if (event.key === 'e' || event.key === 'E') {
        playExplosionSound();
    }

});