# Hydra Visual Synthesizer -- Complete Learning Reference

Hydra is a live code-able video synth and coding environment by Olivia Jack that runs directly in the browser. Written in JavaScript, compiled to WebGL. Syntax inspired by analog modular synthesis -- chain functions together to generate visuals.

**Editor**: https://hydra.ojack.xyz
**Docs**: https://hydra.ojack.xyz/docs/
**GitHub**: https://github.com/hydra-synth/hydra
**npm**: https://www.npmjs.com/package/hydra-synth
**Interactive function reference**: https://hydra.ojack.xyz/api

**Keyboard shortcuts** (in editor):
- `Ctrl+Enter` -- run a line of code
- `Ctrl+Shift+Enter` -- run all code on screen
- `Alt+Enter` -- run a block
- `Ctrl+Shift+H` -- hide/show code
- `Ctrl+Shift+F` -- format code (Prettier)
- `Ctrl+Shift+S` -- save screenshot

---

## 1. The Hydra Book & Core Concepts

The Hydra Book by Naoto Hieda is the primary interactive tutorial, now part of the official docs.

### Architecture

Hydra has 4 **output buffers** (`o0`, `o1`, `o2`, `o3`) and 4 **source buffers** (`s0`, `s1`, `s2`, `s3`). The logic: start with a **source** -> add **transforms** -> send to **output** with `.out()`.

### Source Functions

```javascript
// Oscillator: frequency, sync (scroll speed), color offset
osc(20, 0.1, 0.8).out()

// Noise: scale, speed
noise(10, 0.1).out()

// Voronoi: scale, speed, blending
voronoi(5, 0.3, 0.3).out()

// Shape: sides, radius, smoothing
shape(3, 0.5, 0.01).out()

// Gradient: speed
gradient(1).out()

// Solid color: r, g, b, a
solid(1, 0, 0.5, 1).out()
```

### Geometry Transforms

```javascript
osc(20).rotate(0.8).out()          // rotate radians
osc(20).scale(1.5).out()           // scale
osc(20).pixelate(20, 30).out()     // pixelate
osc(20).kaleid(4).out()            // kaleidoscope
osc(20).repeat(3, 2).out()         // tile/repeat
osc(20).scrollX(0.5, 0.1).out()   // scroll horizontally (offset, speed)
osc(20).scrollY(0.5, 0.1).out()   // scroll vertically
```

### Color Transforms

```javascript
osc(20).color(1, 0.5, 0.3).out()     // set r, g, b multipliers
osc(20).brightness(0.3).out()         // adjust brightness
osc(20).contrast(1.5).out()           // adjust contrast
osc(20).saturate(2).out()             // adjust saturation
osc(20).hue(0.5).out()                // shift hue
osc(20).colorama(0.5).out()           // shift HSV colorspace
osc(20).thresh(0.5, 0.04).out()       // threshold to black/white
osc(20).posterize(3, 0.6).out()       // reduce color levels
osc(20).invert().out()                // invert colors
osc(20).luma(0.5, 0.1).out()          // luma key (transparency by brightness)
```

### Multiple Outputs

```javascript
osc(10).out(o0)
noise(5).out(o1)
voronoi().out(o2)
shape(4).out(o3)
render()           // show all 4 outputs in quadrants
render(o2)         // show only o2 fullscreen
```

### Dynamic Parameters (Arrow Functions)

Parameters can be functions evaluated every frame:

```javascript
// oscillator frequency changes with time
osc(() => 100 * Math.sin(time * 0.1)).out()

// use mouse position
osc(() => mouse.x / 10, 0.1, 0.8).out()

// arrays cycle through values
osc([20, 40, 60, 80].fast(0.5)).out()
```

### Textures Chapter (Naoto Hieda)

Key patterns from the Hydra Book:

```javascript
// High kaleid = circles
osc(200, 0).kaleid(99).out()

// Polka dots via shape repeat
n = 4
a = () => shape(400, 0.5).repeat(n, n)
a().add(a().scrollX(0.5/n).scrollY(0.5/n), 1).out()

// Grid pattern via shape repeat
n = 4
a = () => shape(4, 0.4).repeat(n, n)
a().add(a().scrollX(0.5/n).scrollY(0.5/n), 1).out()

// RGB pixel filter
n = 50
func = () => osc(30, 0.1, 1).modulate(noise(4, 0.1))
pix = () => shape(4, 0.3).scale(1, 1, 3).repeat(n, n)
pix().mult(func().color(1,0,0).pixelate(n,n)).out(o1)
pix().mult(func().color(0,1,0).pixelate(n,n)).scrollX(1/n/3).out(o2)
pix().mult(func().color(0,0,1).pixelate(n,n)).scrollX(2/n/3).out(o3)
solid().add(src(o1),1).add(src(o2),1).add(src(o3),1).out(o0)

// Aspect ratio correction for non-square windows
osc(200, 0).kaleid(99).scale(1, 1, () => window.innerWidth / window.innerHeight).out()
```

---

## 2. Blending, Layering & Modulation

### Blend Functions (combine colors)

```javascript
// blend: mix two sources by amount (0-1)
osc(10).blend(noise(3), 0.5).out()

// diff: color difference (inverts dark areas)
osc(10).diff(shape(4)).out()

// add: additive blending (only gets brighter)
osc(10).add(shape(4), 0.5).out()

// mult: multiplicative blending (only gets darker)
osc(10).mult(shape(4)).out()

// layer: overlay with alpha transparency
osc(10).layer(shape(4, 0.3).luma()).out()

// mask: use brightness of second source as alpha
osc(10).mask(shape(4)).out()
```

### Combining via output buffers

```javascript
s0.initCam()
src(s0).out(o0)                        // webcam to o0
osc(10).out(o1)                        // oscillator to o1
src(o0).blend(o1).out(o2)             // blend webcam + osc
src(o0).diff(o1).out(o3)              // diff webcam + osc
render()
```

### Modulation Functions (warp geometry using another source)

Modulate functions use the **red and green channels** of the input texture to **displace x and y coordinates** of the base texture.

```javascript
// modulate: basic displacement
osc(10).modulate(noise(3), 0.5).out()

// modulateRotate: rotate by varying amounts across the image
osc().modulateRotate(osc(3).rotate(), 1).out()

// modulateScale: zoom in/out based on modulator brightness
gradient(5).repeat(50,50).kaleid([3,5,7,9].fast(0.5))
  .modulateScale(osc(4,-0.5,0).kaleid(50).scale(0.5), 15, 0).out()

// modulateScrollX: horizontal scroll based on modulator
voronoi(25, 0, 0).modulateScrollX(osc(10), 0.5).out()

// modulateScrollY: vertical scroll based on modulator
voronoi(25, 0, 0).modulateScrollY(osc(10), 0.5).out()

// modulateHue: warp based on channel differences (complex motion)
src(o0)
  .modulateHue(src(o0).scale(1.01), 1)
  .layer(osc(4, 0.5, 2).mask(shape(4, 0.5, 0.001)))
  .out(o0)
```

### Inline Composition (no separate buffers needed)

```javascript
osc(10, 0.1, 1.2)
  .blend(noise(3))
  .diff(shape(4, 0.6).rotate(0, 0.1))
  .out()
```

---

## 3. Feedback Loops

Feedback is created by routing a buffer's output back to its own input with `src(o0)...out(o0)`.

### Basic Feedback

```javascript
// simple feedback with slow modulation
src(o0).modulate(noise(3), 0.005).blend(shape(4), 0.01).out(o0)

// oscillator feeding back into itself
osc(40, 0.1, 1).modulate(src(o0), 0.1).scale(1.1).rotate(0.04).out(o0)
```

### Recursive Scaling (creates fractal-like depth)

```javascript
// scaling feedback creates infinite zoom
shape(4, 0.8).diff(src(o0).scale(0.9)).out(o0)

// voronoi fractal pattern
voronoi(10, 0).diff(src(o0).scale(0.9)).out(o0)

// with rotation for spiral effect
shape(4, 0.9).diff(src(o0).scale(0.9).mask(shape(4, 0.9, 0.01)).rotate(0.1)).out(o0)

// scrolling feedback
shape(4, 0.7).diff(src(o0).scrollX(0.01).mask(shape(4, 0.7))).out(o0)
```

### Feedback with Layer (elapse-style)

```javascript
// motion emerges from displacement modulation in a closed loop
src(o0)
  .scroll(()=>mouse.x/innerWidth, ()=>mouse.y/innerHeight)
  .layer(noise(3).sub(osc(5,.1,2)).luma(.1,.01))
  .scroll("-sign(st.x-0.5)*0.5", "-sign(st.y-0.5)*0.2")
  .scale("0.8+st.x*0.2")
  .rotate(0, .1)
  .brightness(.01)
  .out()
```

### Feedback with modulateHue (complex organic motion)

```javascript
src(o0)
  .modulateHue(src(o0).scale(1.01), 1)
  .layer(osc(4, 0.5, 2).mask(shape(4, 0.5, 0.001)))
  .out(o0)
```

### Tips for Feedback
- Always include some decay (`.brightness(-.01)` or `.blend(solid(), 0.01)`) to prevent complete whiteout
- Small scale values (0.99-1.01) create slow zoom effects
- Small rotation values (0.01-0.05) create spiral effects
- Use `.mask()` to constrain feedback to specific regions
- Clear a buffer before trying new feedback: `solid().out(o0)`

---

## 4. External Inputs (Webcam, Screen, Images, Video)

### Webcam

```javascript
s0.initCam()           // default webcam
s0.initCam(1)          // second webcam
src(s0).out()          // display webcam

// webcam with effects
s0.initCam()
src(s0).kaleid(4).out()                           // kaleidoscope
src(s0).color(-1, 1).kaleid().out()               // inverted kaleidoscope
src(s0).modulate(osc(10), 0.1).out()              // warped by oscillator
shape().modulate(src(s0)).out()                    // shape modulated by webcam
```

### Images

```javascript
s0.initImage("https://upload.wikimedia.org/wikipedia/commons/2/25/Hydra-Foto.jpg")
src(s0).out()

// local files (in Pulsar/Atom or local server)
s0.initImage("file:///home/user/Images/image.png")
// supported: .jpeg, .png, .bmp, .gif, .webp
```

### Video

```javascript
s0.initVideo("https://media.giphy.com/media/AS9LIFttYzkc0/giphy.mp4")
src(s0).out()
// supported: .mp4, .ogg, .webm

// control playback
s0.src.playbackRate = 2     // double speed
s0.src.currentTime = 10     // seek to 10s
s0.src.loop = false          // don't loop
```

### Screen Sharing

```javascript
s0.initScreen()    // opens dialog to select window/tab/screen
src(s0).out()
```

### HTML Canvas (generic source)

```javascript
myCanvas = document.createElement('canvas')
ctx = myCanvas.getContext('2d')
ctx.font = "30px Arial"
ctx.fillStyle = "red"
ctx.fillText("Hello World", 10, 50)

s0.init({ src: myCanvas, dynamic: false })
src(s0).diff(osc(2, 0.1, 1.2)).out()

// dynamic: true for animated canvas, false for static
```

### Texture Interpolation

```javascript
// smooth scaling for external sources
s0.initCam(0, { mag: 'linear' })
// default is 'nearest' (pixelated at large scales)
```

### CORS Workarounds
- Re-upload images to imgur or a CORS-friendly host
- Use Wikimedia Commons (allows cross-origin)
- Run Hydra locally with local files
- Use `initScreen()` to capture browser tab playing a video

---

## 5. Audio-Reactive Visuals

Hydra uses Meyda library for FFT-based audio analysis via the `a` object. It reads from the default microphone.

### Setup & Calibration

```javascript
a.show()             // show FFT visualization (lower-right corner)
a.hide()             // hide it
a.setBins(5)         // split audio spectrum into 5 bands
a.setSmooth(0.8)     // smoothing (0=raw, 1=frozen). Prevents strobing
a.setCutoff(0.1)     // noise gate: ignore audio below this level
a.setScale(8)        // upper limit: audio at this level = 1.0
```

### Reading Audio Values

```javascript
a.fft[0]    // lowest frequency bin (bass), value 0-1
a.fft[1]    // second bin
a.fft[4]    // highest bin (if 5 bins set)
a.vol       // overall volume
a.bins      // raw (unmapped) bin values
a.prevBins  // bins from previous frame
```

### Audio-Reactive Examples

```javascript
// bass controls rotation, highs control saturation
a.setBins(5)
osc(20, .1, 2)
  .saturate(() => 1 - a.fft[4])
  .rotate(() => a.fft[0])
  .kaleid()
  .out()
```

```javascript
// noise modulated by second audio band
a.setBins(5)
a.setSmooth(0.8)
a.setScale(8)
a.setCutoff(0.1)

noise(2)
  .modulate(o0, () => a.fft[1] * 0.5)
  .out()

a.show()
render(o0)
```

```javascript
// overall volume drives visual intensity
osc(() => 10 + a.vol * 50, 0.1, 1)
  .rotate(() => a.vol * 3)
  .scale(() => 1 + a.vol * 0.5)
  .out()
```

### Beat Detection

```javascript
a.beat.threshold = 0.5    // volume threshold to detect a beat
a.beat.decay = 0.9        // decay after beat detection

// override onBeat to trigger visual events
a.onBeat = () => {
  // this runs every time a beat is detected
  // you could toggle effects, change parameters, etc.
}
```

### Routing Desktop Audio (not just mic)
Hydra only reads the microphone. To use desktop audio:
- **Virtual audio routing**: use software like BlackHole (macOS), VB-Cable (Windows), or PulseAudio (Linux) to route system audio to a virtual mic input
- **Physical loopback**: route an audio interface output back to an input
- **DAW envelope followers**: use a DAW to analyze audio and send MIDI CC to Hydra

---

## 6. Interactivity (Mouse, MIDI, Keyboard)

### Mouse

```javascript
// raw pixel position
osc(() => mouse.x / 10).out()

// normalized 0-1
x = () => mouse.x / width
y = () => mouse.y / height
osc().scale(() => 1 + x() * 2).modulate(noise(4), () => y() / 4).out()

// center-origin (-0.5 to 0.5) for following
x = () => (-mouse.x / width) + 0.5
y = () => (-mouse.y / height) + 0.5
solid(255).diff(shape(4, 0.1).scroll(() => x(), () => y())).out()

// rotation (0 to 2pi)
osc().rotate(() => (mouse.x / width) * 2 * Math.PI).out()
```

### MIDI (via hydra-midi extension)

```javascript
// load the extension
await loadScript('https://cdn.jsdelivr.net/npm/hydra-midi@latest/dist/index.js')
await midi.start().show()

// use MIDI notes
osc(30, .01).invert(note('C4')).out()

// ADSR envelope on note trigger, scaled to range
osc(note('C3').adsr(300, 200, 1, 300).range(20, 50), 0, 0).out(o1)

// velocity
voronoi().color(note('E3').velocity(), 1, 1).out(o3)

// CC control
osc().rotate(cc(45).range(0, Math.PI * 2)).out(o0)

// specific MIDI inputs
seaboard = midi.input(1).channel('*')
faderfox = midi.input(2)
noise(seaboard.note('D3').range(2, 8)).out(o2)
```

### MIDI (custom Web MIDI script, no extension)

```javascript
// register WebMIDI
navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

function onMIDISuccess(midiAccess) {
  for (var input of midiAccess.inputs.values()) {
    input.onmidimessage = getMIDIMessage;
  }
}
function onMIDIFailure() { console.log('Could not access MIDI devices.'); }

var cc = Array(128).fill(0.5)
getMIDIMessage = function(midiMessage) {
  var arr = midiMessage.data
  var index = arr[1]
  cc[index] = (arr[2] + 1) / 128.0  // normalize 0.0 - 1.0
}

// use CC values in visuals (e.g. Korg NanoKontrol2)
noise(4).color(() => cc[16], () => cc[17], () => cc[18]).out()
osc(10, 0.2, 0.5).rotate(() => (cc[0] * 6.28) - 3.14).scale(() => cc[1]).out()
```

---

## 7. Embedding Hydra in Custom Web Pages (hydra-synth npm)

### Method 1: Script Tag (CDN)

```html
<!DOCTYPE html>
<html>
<head><title>Hydra Embed</title></head>
<body>
<script src="https://cdn.jsdelivr.net/npm/hydra-synth/dist/hydra-synth.js"></script>
<script>
  var hydra = new Hydra({ detectAudio: false })
  osc(4, 0.1, 1.2).out()
</script>
</body>
</html>
```

### Method 2: npm Module (ES modules)

```bash
npm install --save hydra-synth
```

```javascript
import Hydra from 'hydra-synth'

const hydra = new Hydra({ detectAudio: false })
osc(4, 0.1, 1.2).out()
```

### Method 3: CommonJS

```javascript
const Hydra = require('hydra-synth')
```

### Full Configuration Options

```javascript
const hydra = new Hydra({
  canvas: null,           // canvas element; if null, one is created & appended
  width: 1280,            // default if no canvas provided
  height: 720,            // default if no canvas provided
  autoLoop: true,         // use requestAnimationFrame; false = manual tick()
  makeGlobal: true,       // if false, don't pollute global namespace
  detectAudio: true,      // set false to skip microphone prompt
  numSources: 4,          // number of source buffers (s0-s3)
  numOutputs: 4,          // number of output buffers (o0-o3)
  extendTransforms: [],   // custom GLSL transforms to add
  precision: null,        // 'highp', 'mediump', 'lowp' (lowp for iOS)
  pb: null,               // rtc-patch-bay instance for streaming
})
```

### Render to Specific Canvas

```javascript
const canvas = document.getElementById('myCanvas')
const hydra = new Hydra({
  canvas: canvas,
  detectAudio: false,
  makeGlobal: false
}).synth

hydra.osc(10, 0.1, 1.2).out()
```

### Non-Global Mode (avoid namespace pollution)

```javascript
const h = new Hydra({ makeGlobal: false, detectAudio: false }).synth
h.osc().diff(h.shape()).out()
h.gradient().out(h.o1)
h.render()
```

### Destructured Non-Global Mode (hydra-like syntax)

```javascript
const hydra = new Hydra({ makeGlobal: false, detectAudio: false }).synth
const { src, osc, gradient, shape, voronoi, noise, s0, s1, s2, s3, o0, o1, o2, o3, render } = hydra
shape(4).diff(osc(2, 0.1, 1.2)).out()
```

### Multiple Hydra Canvases

```javascript
const h1 = new Hydra({ makeGlobal: false, detectAudio: false }).synth
h1.osc().diff(h1.shape()).out()

const h2 = new Hydra({ makeGlobal: false, detectAudio: false }).synth
h2.shape(4).diff(h2.osc(2, 0.1, 1.2)).out()
```

### Custom Render Loop

```javascript
const hydra = new Hydra({ autoLoop: false, detectAudio: false })

function myLoop() {
  hydra.tick(16.67)  // dt in ms (60fps = ~16.67ms)
  requestAnimationFrame(myLoop)
}
myLoop()
```

### Vite Workaround

If you get `Uncaught ReferenceError: global is not defined`:

```javascript
// vite.config.js
export default {
  define: {
    global: {},
  },
}
```

### hydra-element (Web Component)

```html
<!-- Each element gets its own hydra instance, no collisions -->
<script src="https://cdn.jsdelivr.net/npm/hydra-element"></script>
<hydra-element code="osc(10, 0.1, 1.2).out()"></hydra-element>
```

GitHub: https://github.com/jdomizz/hydra-element

---

## 8. Integration with Other Tools

### P5.js (Pre-loaded in Hydra editor)

```javascript
// initialize p5 in instance mode
p5 = new P5()  // or: new P5({width: 512, height: 512, mode: 'P2D'})

// draw with p5
p5.clear()
for (var i = 0; i < 100; i++) {
  p5.fill(i * 10, i % 30, 255)
  p5.rect(i * 20, 200, 10, 200)
}

// animated draw loop
p5.draw = () => {
  p5.fill(p5.mouseX / 5, p5.mouseY / 5, 255, 100)
  p5.rect(p5.mouseX, p5.mouseY, 30, 150)
}

// use p5 canvas as hydra source
s0.init({ src: p5.canvas })
src(s0).repeat().out()
```

#### Synchronized p5 + Hydra render loop

```javascript
p5.noLoop()
p5.clear()
p5.colorMode(p5.HSB)
p5.stroke(0)
p5.strokeWeight(1)

src(o0)
  .scale(1.05)
  .blend(src(o0).brightness(-.02), .4)
  .modulateHue(o0, 100)
  .layer(s0)
  .out()

p5.draw = () => {
  if (p5.random() < 0.01) p5.clear()
  p5.fill(time * 100 % 200, 70, 100)
  p5.rect(p5.random() * p5.width, p5.abs(p5.sin(time * 2)) * p5.height, 50, 50)
}

// synchronize p5 with hydra's render loop
update = (dt) => {
  p5.redraw()
}
```

### Three.js

```javascript
await loadScript("https://threejs.org/build/three.js")

scene = new THREE.Scene()
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
renderer = new THREE.WebGLRenderer()
renderer.setSize(width, height)

geometry = new THREE.BoxGeometry()
material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
cube = new THREE.Mesh(geometry, material)
scene.add(cube)
camera.position.z = 1.5

// 'update' is a reserved function run every hydra frame
update = () => {
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01
  renderer.render(scene, camera)
}

s0.init({ src: renderer.domElement })
src(s0).repeat().out()
```

### Tone.js (Audio Synthesis)

```javascript
await loadScript("https://unpkg.com/tone")
synth = new Tone.Synth().toDestination()
synth.triggerAttackRelease("C4", "8n")
```

### Strudel (Pattern Sequencing)

```javascript
await loadScript("https://cdn.jsdelivr.net/gh/atfornes/Hydra-strudel-extension@1/hydra-strudel.js")
await initHydraStrudel()

pattern = "3 <4 5 6 7>"  // tidal mini notation

// pattern drives shape sides
shape(P(pattern)).out(o0)

// same pattern drives sound
n(pattern).scale("C:major").play()

// pattern drives color
src(o0).color(
  () => P(pattern)() % 2,
  () => P(pattern)() % 3,
  () => P(pattern)() % 5
).out(o1)
render(o1)
```

### Loading Any External Library

```javascript
await loadScript("https://www.somewebsite.com/url/to/library.js")

// for GitHub repos, use a CDN like statically.io to avoid CORS
await loadScript("https://cdn.statically.io/gh/user/repo/branch/file.js")
```

---

## 9. Custom GLSL Shaders

Hydra compiles to GLSL. You can write custom shader functions with `setFunction()`.

### Function Types

| Type | Purpose | Receives | Returns |
|------|---------|----------|---------|
| `src` | Generate visuals | `vec2 _st` (coordinates) | `vec4` (color) |
| `color` | Transform color | `vec4 _c0` (input color) | `vec4` |
| `coord` | Transform geometry | `vec2 _st` (coordinates) | `vec2` |
| `combine` | Blend two textures | `vec4 _c0, vec4 _c1` | `vec4` |
| `combineCoord` | Modulate with texture | `vec2 _st, vec4 _c0` | `vec2` |

### Example: Custom Source

```javascript
setFunction({
  name: 'myOsc',
  type: 'src',
  inputs: [
    { type: 'float', name: 'frequency', default: 60 },
    { type: 'float', name: 'sync', default: 0.1 },
    { type: 'float', name: 'offset', default: 0 }
  ],
  glsl: `
    vec2 st = _st;
    float r = sin((st.x-offset/frequency+time*sync)*frequency)*0.5 + 0.5;
    float g = sin((-st.x+time*sync*2.)*frequency)*0.5 + 0.5;
    float b = sin((st.x+offset/frequency+time*sync)*frequency)*0.5 + 0.5;
    return vec4(r, g, b, 1.0);
  `
})
myOsc(10).out()
```

### Example: Chroma Key

```javascript
setFunction({
  name: 'chroma',
  type: 'color',
  inputs: [],
  glsl: `
    float maxrb = max(_c0.r, _c0.b);
    float k = clamp((_c0.g - maxrb) * 5.0, 0.0, 1.0);
    float dg = _c0.g;
    _c0.g = min(_c0.g, maxrb * 0.8);
    _c0 += vec4(dg - _c0.g);
    return vec4(_c0.rgb, 1.0 - k);
  `
})
solid(0, 1, 0).layer(shape(5, 0.3, 0.3).luma()).out(o0)
osc(30, 0, 1).layer(src(o0).chroma()).out(o1)
render()
```

### Example: Polar Coordinates

```javascript
setFunction({
  name: 'polar',
  type: 'coord',
  inputs: [],
  glsl: `
    vec2 st = _st - 0.5;
    float r = length(st);
    float a = atan(st.y, st.x);
    float pi = 2. * 3.1416;
    return vec2(r * 2., a / pi);
  `
})
gradient(2).add(noise(), .4).polar().out()
```

### Example: Custom Blend Mode (Negate)

```javascript
setFunction({
  name: 'negate',
  type: 'combine',
  inputs: [
    { type: 'float', name: 'amount', default: 1 }
  ],
  glsl: `
    _c1 *= amount;
    return vec4(vec3(1.0) - abs(vec3(1.0) - _c0.rgb - _c1.rgb), min(max(_c0.a, _c1.a), 1.0));
  `
})
osc().negate(noise().brightness(.5)).out()
```

### Example: Custom Modulator

```javascript
setFunction({
  name: 'myModulator',
  type: 'combineCoord',
  inputs: [],
  glsl: `
    return vec2(_st.x + (_c0.g - _c0.b * 0.1), _st.y + (_c0.r * 0.2));
  `
})
noise(2).myModulator(osc(20, .1, 1).diff(o0)).out()
```

### Built-in GLSL Helpers

Available in all custom shaders:
```glsl
float _luminance(vec3 rgb)   // get luminance
vec3 _rgbToHsv(vec3 c)       // RGB to HSV
vec3 _hsvToRgb(vec3 c)       // HSV to RGB
```

### View Generated Shader Code

```javascript
console.log(osc().glsl()[0])   // see the fragment shader
```

### GLSL Injection (advanced hack)

```javascript
// inject GLSL expressions as string arguments
osc().scroll("-sign(st.x-0.5)*0.5", "-sign(st.y-0.5)*0.2")
  .scale("0.8+st.x*0.2").out()
```

### Extensions for Extra Shaders
- extra-shaders-for-hydra: https://gitlab.com/metagrowing/extra-shaders-for-hydra
- hydra-blending-modes: https://github.com/ritchse/hydra-extensions
- hydra-glsl extension (write GLSL inline): https://github.com/ritchse/hydra-extensions/blob/main/doc/hydra-glsl.md

---

## 10. Livecoding Performance Tips

### Preparation
- Pre-write modular code blocks that can be mixed and matched
- Store reusable patterns in variables: `a = () => osc(10).rotate(0.5)`
- Use the `update` function for frame-by-frame logic
- Set up audio calibration (`a.setSmooth`, `a.setScale`, `a.setCutoff`) before performing

### Live Technique
- Use `Ctrl+Enter` to run single lines (surgical changes)
- Use `Ctrl+Shift+Enter` to run everything (full scene swap)
- Use `render()` to preview all 4 outputs, then `render(oN)` to go fullscreen on one
- Swap between pre-built scenes by commenting/uncommenting `render()` targets
- Use `.fast()` on arrays for automatic parameter cycling: `osc([10,20,30].fast(0.5))`

### Performance Optimization
- `99` as kaleid value is a compact way to get circles (2 chars, big enough)
- Use `pixelate()` to reduce resolution on complex chains
- Avoid very high `setBins()` values for audio (more bins = more processing)
- Use `precision: 'lowp'` on iOS for better performance
- Minimize the number of simultaneous feedback loops

### Useful Patterns for Quick Variation

```javascript
// time-based parameter cycling
osc(Math.sin(time) * 20 + 30).out()

// array-based cycling (hydra native)
osc([10, 20, 60, 100].fast(1)).out()

// mouse control for expressive live tweaking
osc(() => mouse.x / 5, 0.1, () => mouse.y / 500).out()

// random parameter on each evaluation
osc(Math.random() * 60 + 10, 0.1, Math.random()).out()
```

### Scene Management

```javascript
// define scenes as functions
scene1 = () => osc(10, 0.1, 1).rotate(0, 0.1).kaleid(4).out()
scene2 = () => noise(4).modulate(osc(10), 0.2).out()
scene3 = () => {
  s0.initCam()
  src(s0).modulateRotate(osc(3), 1).out()
}

// switch scenes during performance
scene1()
// scene2()
// scene3()
```

---

## 11. Quick Reference -- All Functions

### Sources
`osc(freq, sync, offset)`, `noise(scale, offset)`, `voronoi(scale, speed, blending)`, `shape(sides, radius, smoothing)`, `gradient(speed)`, `solid(r, g, b, a)`, `src(tex)`

### Geometry
`.rotate(angle, speed)`, `.scale(amount, x, y)`, `.pixelate(x, y)`, `.kaleid(sides)`, `.repeat(x, y, offsetX, offsetY)`, `.repeatX(reps, offset)`, `.repeatY(reps, offset)`, `.scrollX(scrollX, speed)`, `.scrollY(scrollY, speed)`

### Color
`.color(r, g, b, a)`, `.brightness(amount)`, `.contrast(amount)`, `.saturate(amount)`, `.hue(amount)`, `.colorama(amount)`, `.thresh(threshold, tolerance)`, `.posterize(bins, gamma)`, `.invert(amount)`, `.luma(threshold, tolerance)`, `.shift(r, g, b, a)`, `.r(scale, offset)`, `.g(scale, offset)`, `.b(scale, offset)`, `.a(scale, offset)`

### Blend (combine)
`.blend(texture, amount)`, `.add(texture, amount)`, `.diff(texture)`, `.mult(texture, amount)`, `.layer(texture)`, `.mask(texture, reps, offset)`, `.sub(texture, amount)`

### Modulate (combineCoord)
`.modulate(texture, amount)`, `.modulateRotate(texture, multiple, offset)`, `.modulateScale(texture, multiple, offset)`, `.modulateScrollX(texture, scrollX, speed)`, `.modulateScrollY(texture, scrollY, speed)`, `.modulateHue(texture, amount)`, `.modulatePixelate(texture, multiple, offset)`, `.modulateKaleid(texture, nSides)`, `.modulateRepeat(texture, repeatX, repeatY, offsetX, offsetY)`, `.modulateRepeatX(texture, reps, offset)`, `.modulateRepeatY(texture, reps, offset)`

### Output
`.out(buffer)`, `render(buffer)`

### External Sources
`s0.initCam(index)`, `s0.initImage(url)`, `s0.initVideo(url)`, `s0.initScreen()`, `s0.init({src, dynamic})`, `s0.initStream(name)`

### Audio
`a.show()`, `a.hide()`, `a.setBins(n)`, `a.fft[i]`, `a.vol`, `a.setSmooth(v)`, `a.setScale(v)`, `a.setCutoff(v)`, `a.onBeat`

### Utility
`render()` (all outputs), `update = (dt) => {}` (custom per-frame logic), `time` (global ms since load), `mouse.x`, `mouse.y`, `width`, `height`

---

## Sources

- [Hydra Documentation Portal](https://hydra.ojack.xyz/docs/)
- [Hydra Book: Textures by Naoto Hieda](https://hydra.ojack.xyz/docs/docs/learning/guides/textures/)
- [Audio-Reactivity Explained (by Geikha)](https://hydra.ojack.xyz/docs/docs/learning/guides/audio/)
- [Audio Interactivity Docs](https://hydra.ojack.xyz/docs/docs/learning/interactivity/audio/)
- [External Sources Docs](https://hydra.ojack.xyz/docs/docs/learning/external-sources/)
- [Modulation Docs](https://hydra.ojack.xyz/docs/docs/learning/video-synth-basics/modulate/)
- [Custom GLSL Docs](https://hydra.ojack.xyz/docs/docs/learning/extending-hydra/glsl/)
- [Other Libraries (P5, Three.js, Tone.js, Strudel)](https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/extending-hydra/extending-hydra/)
- [Embed Hydra on Your Webpage](https://hydra.ojack.xyz/docs/docs/learning/guides/how-to/hydra-in-a-webpage/)
- [hydra-synth npm Package](https://github.com/hydra-synth/hydra-synth)
- [hydra-synth on npm](https://www.npmjs.com/package/hydra-synth)
- [hydra-element Web Component](https://github.com/jdomizz/hydra-element)
- [hydra-midi Extension](https://github.com/arnoson/hydra-midi)
- [Hydra Main GitHub Repo](https://github.com/hydra-synth/hydra)
- [Getting Started Guide](https://hydra.ojack.xyz/docs/docs/learning/getting-started/)
- [Interactive Function Reference](https://hydra.ojack.xyz/api)
- [Elapse: Video Feedback Processes (fxhash)](https://www.fxhash.xyz/article/elapse:-video-feedback-processes)
- [Hydra Tutorial Series for Everyone (CreativeApplications.Net)](https://www.creativeapplications.net/tutorial/hydra-tutorial-series-for-everyone/)
- [Hydra Tutorial - Beginners Guide (CLIP)](https://www.clipsoundandmusic.uk/hydra-tutorial-a-beginners-guide-to-live-coding-visuals/)
- [Hydra Livecoding Workshop Plan (6120.eu)](https://6120.eu/posts/workshop-hydra/)
- [hydra-threejs Example](https://github.com/rexmalebka/hydra-threejs)
- [Olivia Jack - About Hydra](https://ojack.xyz/work/hydra/)
- [Multi-Hydra Glitch Example](https://glitch.com/edit/#!/multi-hydra)
- [Hydra Webpage Glitch Example](https://glitch.com/edit/#!/hydra-webpage)
- [Custom Shaders Blog Post](https://blog.vbuckenham.com/things-i-have-learned-writing-custom-shaders-for-hydra/)
- [Adding Custom Shaders (DEV Community)](https://dev.to/brucelane/adding-custom-shaders-to-hydra-synth-efi)
- [hydra-extensions Community Repo](https://github.com/hydra-synth/hydra-extensions)
