import React, { useEffect, useRef } from 'react';
// import '../style/VR.scss';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';

const VR = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(-4.9, 4.4, 1.9);
        camera.rotation.set(-0.9, -0.8, -0.8);

        const renderer = new THREE.WebGLRenderer({ canvas: canvas });
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Thêm ánh sáng
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);

        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.minDistance = 1;
        controls.maxDistance = 5;

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

        const gltfLoader = new GLTFLoader();

        gltfLoader.load('../../static/model/output.glb', (gltf) => {
            const model = gltf.scene;
            scene.add(model);

            // Tính toán bounding box và điều chỉnh camera
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3()).length();
            const center = box.getCenter(new THREE.Vector3());

            camera.position.set(center.x + size / 2, center.y + size / 5, center.z + size / 2);
            camera.lookAt(center);
            controls.target.copy(center);
            controls.update();
        });

        const animate = () => {
            controls.update();
            renderer.render(scene, camera);
        };

        renderer.setAnimationLoop(animate);

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
        };
    }, []);

    return <canvas ref={canvasRef} className="canvas" />;
};

export default VR;