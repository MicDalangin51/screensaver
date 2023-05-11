import './style.css'
import vertexShaderSourceCode from './shaders/vertex.glsl?raw';
import fragmentShaderSourceCode from './shaders/fragment.glsl?raw';
import { mat4 } from 'gl-matrix';
import { OBJ } from 'webgl-obj-loader';
import { vec2by3, vec3by3 } from './types';

// objects
import gourd from './objects/gourd.obj?raw';
import kyub from './objects/cube.obj?raw';

function createShader(gl: WebGLRenderingContext, type: number, sourceCode: string): WebGLShader {
  // Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
  var shader = gl.createShader(type)!;
  gl.shaderSource(shader, sourceCode);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    var info = gl.getShaderInfoLog(shader);
    throw 'Could not compile WebGL program. \n\n' + info;
  }
  return shader;
}

let canvas = document.querySelector<HTMLCanvasElement>('#screensaver')!;
canvas.height = 360;
canvas.width = 360;

const gl = canvas.getContext('webgl2')!;
let program = gl.createProgram()!;

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSourceCode)!;
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceCode)!;

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  var info = gl.getProgramInfoLog(program);
  throw 'Could not compile WebGL program. \n\n' + info;
}

// set the program created earlier
gl.useProgram(program);

// const aPositionPointer = gl.getAttribLocation(program, 'a_position');
// const aPointSizePointer = gl.getAttribLocation(program, 'a_point_size');
// const colorLocation = gl.getAttribLocation(program, "a_color");


const uModelMatrixPointer = gl.getUniformLocation(program, "u_model_matrix");
const uViewMatrixPointer = gl.getUniformLocation(program, "u_view_matrix");
const uProjectionMatrixPointer = gl.getUniformLocation(program, "u_projection_matrix");

const vertexPositionAttribute = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(vertexPositionAttribute);

gl.enable(gl.DEPTH_TEST);


const CONST_VIEWS: vec3by3 = [0, 0, 0, 0, 0, -1, 0, 1, 0];
let VIEWS: vec3by3 = CONST_VIEWS;

const CONST_PROJECTION_ARRAY: vec2by3 = [-10, 10, -10, 10, -10, 100];
let PROJECTION_ARRAY: vec2by3 = CONST_PROJECTION_ARRAY;

let projectionMatrix = mat4.create();
let viewMatrix = mat4.create();
let modelMatrix = mat4.create();

function useObjectContainer(object: ObjectContainer) {
  // compile the shaders and create a shader program
  projectionMatrix = mat4.create();
  mat4.ortho(projectionMatrix, ...PROJECTION_ARRAY);

  viewMatrix = mat4.create();
  mat4.lookAt(viewMatrix, new Float32Array(VIEWS.slice(0, 3)), new Float32Array(VIEWS.slice(3, 6)), new Float32Array(VIEWS.slice(6, 9)));

  gl.uniformMatrix4fv(uModelMatrixPointer, false, new Float32Array(object.modelMatrix));
  gl.uniformMatrix4fv(uViewMatrixPointer, false, new Float32Array(viewMatrix));
  gl.uniformMatrix4fv(uProjectionMatrixPointer, false, new Float32Array(projectionMatrix));

  // now to render the mesh
  gl.bindBuffer(gl.ARRAY_BUFFER, object.mesh.vertexBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, object.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.mesh.indexBuffer);
  gl.drawElements(gl.TRIANGLES, object.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

import { ObjectContainer } from './ObjectContainer';

const requestAnimationFrame =
  window.requestAnimationFrame
const cancelAnimationFrame =
  window.cancelAnimationFrame

let animation: number;
let model: ObjectContainer = new ObjectContainer(gl,gourd);

let ObjectList: ObjectContainer[] = [];
ObjectList.push(new ObjectContainer(gl,gourd));
ObjectList.push(new ObjectContainer(gl,kyub));

// Catch user inputs
let direction = 0;
const handleUserKeyPress = (event: KeyboardEvent) => {
  const { key } = event;
  console.log(key);
  switch (key) {
    case "ArrowUp":
      // mat4.translate(modelMatrix, modelMatrix, [0, 0.2, 0]);
      direction = 0;
      break;
    case "ArrowDown":
      // mat4.translate(modelMatrix, modelMatrix, [0, -0.2, 0]);
      direction = 1;
      break;
    case "ArrowLeft":
      // mat4.translate(modelMatrix, modelMatrix, [-0.2, 0, 0]);
      direction = 2;
      break;
    case "ArrowRight":
      // mat4.translate(modelMatrix, modelMatrix, [0.2, 0, 0]);
      break;
    case "Escape":
      cancelAnimationFrame(animation);
      break;
    case " ":
      requestAnimate();
  }

  useObjectContainer(model);

}

function requestAnimate() {
  

  // render objects
  gl.clearColor(0, 0, 0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (let index = 0; index < ObjectList.length; index++) {
    let rotatevalue = (Math.PI / 64) + index * 100;
    const element = ObjectList[index];
    switch (direction) {
      case 0:
        element.rotateX(rotatevalue);
        break;
      case 1:
        element.rotateY(rotatevalue);
        break;
      case 2:
        element.rotateZ(rotatevalue);
        break;
  
      default:
        break;
    }
    useObjectContainer(element);
    
  }

  // recursive call
  animation = requestAnimationFrame(requestAnimate);
}

window.addEventListener('keydown', handleUserKeyPress);