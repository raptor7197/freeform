import { useEffect, useRef } from 'react';

// Animated cream-to-blue mesh gradient, plain WebGL (no lib — one shader,
// no reason to pull in three.js for a fullscreen quad).
// ponytail: fixed low-res framebuffer upscaled via CSS; a blurry gradient
// hides the upscale, so no resize listener is needed.

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;

vec3 palette(float t) {
  vec3 cream  = vec3(0.965, 0.945, 0.906);
  vec3 sky    = vec3(0.556, 0.788, 0.878);
  vec3 mid    = vec3(0.165, 0.365, 0.690);
  vec3 navy   = vec3(0.051, 0.106, 0.294);
  vec3 cyan   = vec3(0.122, 0.816, 0.839);
  if (t < 0.25) return mix(cream, sky, t / 0.25);
  if (t < 0.55) return mix(sky, mid, (t - 0.25) / 0.30);
  if (t < 0.80) return mix(mid, navy, (t - 0.55) / 0.25);
  return mix(navy, cyan, (t - 0.80) / 0.20);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t = uv.x * 0.6 + uv.y * 0.4;
  t += 0.15 * sin(uv.y * 3.0 + uTime * 0.15);
  t += 0.10 * sin(uv.x * 4.0 - uTime * 0.10);
  float cycle = 0.5 + 0.5 * sin(t * 3.14159 + uTime * 0.05);
  gl_FragColor = vec4(palette(cycle), 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function ShaderBg({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 640;
    canvas.height = 360;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vert = compile(gl, gl.VERTEX_SHADER, VERT);
    const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vert || !frag || !program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'uTime');
    const uResolution = gl.getUniformLocation(program, 'uResolution');
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const start = performance.now();
    let raf = 0;
    const render = () => {
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className={className} style={style} />;
}
