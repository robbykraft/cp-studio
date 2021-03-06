/**
 * Created by ghassaei on 9/16/16.
 */

import * as THREE from "three";
// const TrackballControls = window.TrackballControls || require("three-trackballcontrols");
import window from "./environment/window";
import {
  isBrowser,
  isNode
} from "./environment/detect";


// workaround for trackball controls in node. which isn't working server side
// let TrackballControls;
// if (isNode && !isBrowser) {
//   TrackballControls = function () { return {}; };
// } else {
//   TrackballControls = window.TrackballControls || require("three-trackballcontrols");
// }

// import * as THREE from "../import/three.module";
// import { TrackballControls } from "../import/trackballcontrols";

function initThreeView(globals) {
  // todo, make sure whatever is calling this is waiting for DOM to load
  // to get the client rect below
  const container = globals.parent || window.document.getElementsByTagName("body")[0];
  const rect = (container != null
    ? container.getBoundingClientRect()
    : { x: 0, y: 0, width: 320, height: 240 });

  const scene = new THREE.Scene();
  const modelWrapper = new THREE.Object3D();

  const camera = new THREE.PerspectiveCamera(60, rect.width / rect.height, 0.1, 500);
  // var camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2,
  // window.innerHeight / 2, window.innerHeight / -2, -10000, 10000);//-40, 40);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  // var svgRenderer = new THREE.SVGRenderer();
  // let controls;

  function setCameraX(sign) {
    // controls.reset(new THREE.Vector3(sign, 0, 0));
  }
  function setCameraY(sign) {
    // controls.reset(new THREE.Vector3(0, sign, 0));
  }
  function setCameraZ(sign) {
    // controls.reset(new THREE.Vector3(0, 0, sign));
  }
  function setCameraIso() {
    // controls.reset(new THREE.Vector3(1, 1, 1));
  }

  function resetCamera() {
    camera.zoom = 7;
    camera.fov = 100;
    // camera.lookAt(new THREE.Vector3(0,10,0));
    // camera.up = new THREE.Vector3(0,1,0);

    camera.updateProjectionMatrix();
    camera.position.x = 4;
    camera.position.y = 4;
    camera.position.z = 4;
    // camera.lookAt.x = 0;
    // camera.lookAt.y = 10;
    // camera.lookAt.z = 0;
    // camera.lookAt(new THREE.Vector3(100,100,100));
    // camera.lookAt({x:0, y:100, z:0});
    // if (controls) setCameraIso();
  }

  function render() {
    if (globals.vrEnabled) {
      globals.vive.render();
      return;
    }
    renderer.render(scene, camera);
    if (globals.capturer) {
      if (globals.capturer === "png") {
        const canvas = globals.threeView.renderer.domElement;
        canvas.toBlob((blob) => {
          // saveAs(blob, `${globals.screenRecordFilename}.png`);
        }, "image/png");
        globals.capturer = null;
        globals.shouldScaleCanvas = false;
        globals.shouldAnimateFoldPercent = false;
        globals.threeView.onWindowResize();
        return;
      }
      globals.capturer.capture(renderer.domElement);
    }
  }

  function loop() {
    if (globals.needsSync) {
      globals.model.sync();
    }
    if (globals.simNeedsSync) {
      globals.model.syncSolver();
    }
    if (globals.simulationRunning) globals.model.step();
    if (globals.vrEnabled) {
      render();
      return;
    }
    // controls.update();
    render();
  }

  // function startAnimation() {
  //   console.log("starting animation");
  //   renderer.setAnimationLoop(loop);
  // }

  function pauseSimulation() {
    globals.simulationRunning = false;
    console.log("pausing simulation");
  }

  function startSimulation() {
    console.log("starting simulation");
    globals.simulationRunning = true;
  }

  function sceneAddModel(object) {
    modelWrapper.add(object);
  }

  function onWindowResize() {
    if (globals.vrEnabled) {
      globals.warn("Can't resize window when in VR mode.");
      return;
    }
    // camera.aspect = window.innerWidth / window.innerHeight;
    // const rect = document.getElementById("simulator-container")
    //   .getBoundingClientRect();
    // camera.aspect = rect.width / rect.height;
    camera.aspect = window.innerWidth / window.innerHeight;
    // camera.left = -window.innerWidth / 2;
    // camera.right = window.innerWidth / 2;
    // camera.top = window.innerHeight / 2;
    // camera.bottom = -window.innerHeight / 2;
    camera.updateProjectionMatrix();

    let scale = 1;
    if (globals.shouldScaleCanvas) scale = globals.capturerScale;
    // renderer.setSize(scale*window.innerWidth, scale*window.innerHeight);
    renderer.setSize(scale * window.innerWidth * 0.5, scale * window.innerHeight * 0.5);
    // console.log("new rect", rect.width, rect.height, scale);
    // renderer.setSize(scale*rect.width, scale*rect.height);
    // controls.handleResize();
  }

  function enableCameraRotate(state) {
    // controls.enabled = state;
    // controls.enableRotate = state;
  }

  // function saveSVG() {
  //     // svgRenderer.setClearColor(0xffffff);
  //     svgRenderer.setSize(window.innerWidth,window.innerHeight);
  //     svgRenderer.sortElements = true;
  //     svgRenderer.sortObjects = true;
  //     svgRenderer.setQuality('high');
  //     svgRenderer.render(scene,camera);
  //     //get svg source.
  //     var serializer = new XMLSerializer();
  //     var source = serializer.serializeToString(svgRenderer.domElement);
  //
  //     //add name spaces.
  //     if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
  //         source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  //     }
  //     if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
  //         source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  //     }
  //
  //     //add xml declaration
  //     source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
  //
  //     var svgBlob = new Blob([source], {type:"image/svg+xml;charset=utf-8"});
  //     var svgUrl = URL.createObjectURL(svgBlob);
  //     var downloadLink = document.createElement("a");
  //     downloadLink.href = svgUrl;
  //     downloadLink.download = globals.filename + " : "
  //       + parseInt(globals.creasePercent*100) +  "PercentFolded.svg";
  //     document.body.appendChild(downloadLink);
  //     downloadLink.click();
  //     document.body.removeChild(downloadLink);
  // }

  function resetModel() {
    modelWrapper.rotation.set(0, 0, 0);
  }

  function setBackgroundColor(color = globals.backgroundColor) {
    scene.background.setStyle(`${color}`);
  }

  function init() {
    // const container = $("#simulator-container");
    // const rect = document.querySelector("#simulator-container")
    //   .getBoundingClientRect();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(rect.width, rect.height);
    container.append(renderer.domElement);

    scene.background = new THREE.Color(0xffffff); // new THREE.Color(0xe6e6e6);
    setBackgroundColor();
    scene.add(modelWrapper);

    // shining from above
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight1.position.set(100, 100, 100);
    scene.add(directionalLight1);

    // shining from below
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight2.position.set(0, -100, 0);
    scene.add(directionalLight2);

    const spotLight1 = new THREE.SpotLight(0xffffff, 0.3);
    spotLight1.position.set(0, 100, 200);
    scene.add(spotLight1);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    scene.add(camera);

    resetCamera();

    // controls = new TrackballControls(camera, renderer.domElement);
    // controls.rotateSpeed = 4.0;
    // controls.zoomSpeed = 15;
    // controls.noPan = true;
    // controls.staticMoving = true;
    // controls.dynamicDampingFactor = 0.3;
    // controls.minDistance = 0.1;
    // controls.maxDistance = 30;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    render(); // render before model loads

    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = 2048;
    directionalLight1.shadow.mapSize.height = 2048;
    directionalLight1.shadow.camera.near = 0.5;
    directionalLight1.shadow.camera.far = 500;
  }

  init();

  return {
    sceneAddModel,
    onWindowResize,

    // startAnimation,
    startSimulation,
    pauseSimulation,

    enableCameraRotate, // user interaction
    scene,
    camera, // needed for user interaction
    renderer, // needed for VR
    modelWrapper,

    // saveSVG, // svg screenshot

    setCameraX,
    setCameraY,
    setCameraZ,
    setCameraIso,

    resetModel, // reset model orientation
    resetCamera,
    setBackgroundColor
  };
}

export default initThreeView;
