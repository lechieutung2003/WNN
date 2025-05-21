import React, { useEffect, useRef } from 'react';
import '../style/VR.scss';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import * as lilGui from 'lil-gui';
import gsap from 'gsap';

const VR = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        // Canvas
        const canvas = canvasRef.current;

        // Scene
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(-4.9, 4.4, 1.9);
        camera.rotation.set(-0.9, -0.8, -0.8);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas: canvas });
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Optionally add OrbitControls (currently commented out)
        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.minDistance = 1; // khoảng cách tối thiểu
        controls.maxDistance = 5;

        // Functions to move and rotate the camera
        const cameraMovement = (x, y, z) => {
            gsap.to(camera.position, {
                x,
                y,
                z,
                duration: 3,
            });
        };

        const cameraRotation = (x, y, z) => {
            gsap.to(camera.rotation, {
                x,
                y,
                z,
                duration: 3,
            });
        };

        let position = 0;

        // GLTF Loader
        const gltfLoader = new GLTFLoader();
        gltfLoader.load('../../static/model/scene.gltf', (gltf) => {
            console.log('Our model here!', gltf);
            const model = gltf.scene;
            scene.add(model);

            // Mouse up event to trigger camera movements
            const handleMouseUp = () => {
                switch (position) {
                    case 0:
                        cameraMovement(-6.0, 1.72, 1.34);
                        cameraRotation(-2.75, -1.24, -2.77);
                        position = 1;
                        break;
                    case 1:
                        cameraMovement(0.48, 2.09, -2.11);
                        cameraRotation(-3.12, 0.22, 3.13);
                        position = 2;
                        break;
                    case 2:
                        cameraMovement(-1.49, 1.7, 0.48);
                        cameraRotation(0.44, 1.43, -0.44);
                        position = 0;
                        break;
                    default:
                        break;
                }
            };

            window.addEventListener('mouseup', handleMouseUp);

            // GUI Configurator code is commented out:
            // const gui = new lilGui.GUI();
            // gui.add(model.position, 'x', -100, 100, 0.001).name('Model X Axis Position');
            // gui.add(model.position, 'y', -100, 100, 0.001).name('Model Y Axis Position');
            // gui.add(model.position, 'z', -100, 100, 0.001).name('Model Z Axis Position');

            // Cleanup for the event listener
            return () => {
                window.removeEventListener('mouseup', handleMouseUp);
            };
        });

        // Animation loop
        const animate = () => {
            renderer.render(scene, camera);
            // controls.update(); // if using OrbitControls
        };

        renderer.setAnimationLoop(animate);

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup on unmount
        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
        };
    }, []);

    return <canvas ref={canvasRef} className="canvas" />;
};

export default VR;