# Hydra Visual Synthesizer -- Code Examples Collection

Hydra is a livecoding visual synthesizer by Olivia Jack that runs in the browser. It compiles JavaScript to WebGL, with syntax inspired by analog modular synthesis. This document collects concrete code examples organized by category.

**Editor**: https://hydra.ojack.xyz/
**GitHub**: https://github.com/hydra-synth/hydra
**Docs**: https://hydra.ojack.xyz/docs/

---

## 1. BASIC -- Sources and Simple Transforms

### Oscillators

```js
// Basic oscillator -- scrolling colored stripes
osc().out()

// Oscillator with parameters: frequency=5, sync=-0.126, color offset=0.514
osc(5, -0.126, 0.514).out()

// Higher frequency oscillator
osc(20, 0.1, 0.8).out()

// Oscillator with specific frequency and no animation
osc(1, 1, 0).out()

// Oscillator with pi/2 offset for color shift
osc(1, 1, Math.PI/2).out()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/getting-started/

### Shapes

```js
// Default circle
shape().out()

// Hexagon
shape(6).out()

// Hexagon with small radius and maximum smoothness
shape(6, 0.1, 1).out()

// Triangle
shape(3, 0.5, 0.5).out()

// Thin line (shape with 2 sides)
shape(2, 0.0025, 0.001).out()

// Animated shape: sides and radius change over time via arrays
shape([3, 6].smooth(), [0.6, 0.1, 0.2, 0.9].smooth().fast(3).ease('easeInOutCubic')).out()
```
Source: https://hydra.cca.codes/

### Noise and Voronoi

```js
// Perlin noise texture
noise().out()

// Noise with animated scale
noise([9, 99].smooth().fast(0.3)).out()

// Noise with animated offset
noise(11, [0.1, 0.8].smooth()).out()

// Basic Voronoi diagram
voronoi().out()

// Voronoi with specific scale, no animation
voronoi(10, 0).out()
```
Source: https://hydra.cca.codes/

### Gradients and Solids

```js
// Color gradient
gradient(0).out()

// Animated gradient
speed = 1; gradient(1).out()

// Solid colors
solid(1, 0, 0).out()  // red
solid(0, 1, 0).out()  // green
solid(0, 0, 1).out()  // blue
```
Source: https://hydra.cca.codes/

### Basic Geometry Transforms

```js
// Rotation
osc(5, -0.126, 0.514).rotate().out()

// Rotation with speed + kaleidoscope
osc(5, -0.126, 0.514).rotate(0, 0.2).kaleid().out()

// Rotation + kaleidoscope + repeat tiling
osc(5, -0.126, 0.514).rotate(0, 0.2).kaleid().repeat().out()

// Pixelation
osc(20, 0.1, 0.8).rotate(0.8).pixelate(20, 30).out()

// Kaleidoscope with many sides creates circle patterns
osc(200, 0).kaleid(99).out()

// Kaleidoscope with few sides creates geometric shapes
osc(40, 0).thresh().kaleid(3).out()

// Shape tiling with horizontal scroll
shape(3).repeat(3, 2).scrollX(0, 0.1).out()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/getting-started/

---

## 2. INTERMEDIATE -- Color, Blending, and Composition

### Color Functions

```js
// Noise with color manipulation and chromatic aberration
noise(4).color(-2, 1).colorama().out()

// Color inversion via negative RGB
gradient(0).color(-1, -1, -1).out()

// Posterization with varying bin counts
gradient(0).posterize([1, 5, 15, 30], 0.5).out()

// Color channel shift
osc().shift(0.1, 0.9, 0.3).out()

// Invert toggling
solid(1, 1, 1).invert([0, 1]).out()

// Time-based contrast
osc(20).contrast(() => Math.sin(time) * 5).out()

// Animated brightness
osc(20, 0, 2).brightness(() => Math.sin(time)).out()

// Luminance key
osc(10, 0, 1).luma(0.5, 0.1).out()

// Hard threshold on noise
noise(3, 0.1).thresh(0.5, 0.04).out()

// Color tinting
osc().color(1, 0, 3).out()

// Animated saturation
osc(10, 0, 1).saturate(() => Math.sin(time) * 10).out()

// Hue rotation over time
osc(30, 0.1, 1).hue(() => Math.sin(time)).out()

// Colorama with animated patterns
osc(20).color([1,0,0,1,0],[0,1,0,1,0],[0,0,1,1,0])
  .colorama([0.005, 0.33, 0.66, 1.0].fast(0.125)).out()

// Extract individual color channels
osc(60, 0.1, 1.5).layer(gradient().r()).out()    // red channel
osc(60, 0.1, 1.5).layer(gradient().g()).out()    // green channel
osc(60, 0.1, 1.5).layer(gradient().colorama(1).b()).out()  // blue channel
```
Source: https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/video-synth-basics/color/

### Blending Modes

```js
// Additive blend
shape().scale(0.5).add(shape(4), [0, 0.25, 0.5, 0.75, 1]).out()

// Subtraction
osc().sub(osc(6)).out()

// Multiply -- two oscillators creating interference patterns
osc(9, 0.1, 2).mult(osc(13, 0.5, 5)).out()

// Difference
osc(9, 0.1, 1).diff(osc(13, 0.5, 5)).out()

// Layer with animated transparency
solid(1, 0, 0, 1).layer(shape(4).color(0, 1, 0, () => Math.sin(time * 2))).out()

// Mask -- voronoi masking a gradient
gradient(5).mask(voronoi(), 3, 0.5).invert([0, 1]).out()

// Chained blending: oscillator + noise + shape difference
osc(10, 0.1, 1.2).blend(noise(3)).diff(shape(4, 0.6).rotate(0, 0.1)).out()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/video-synth-basics/blending/

### Multi-Output Composition

```js
// Four different sources to four outputs, displayed simultaneously
gradient(1).out(o0)
osc().out(o1)
voronoi().out(o2)
noise().out(o3)
render()

// Show only a specific output
render(o2)

// Two oscillators with additive and multiplicative blending
osc().color(0.6, 0.2, 0.1).out(o0)
osc().color(0.2, 0.8, 0.7).rotate(-Math.PI/2).out(o2)
src(o0).add(src(o2)).out(o1)
src(o2).mult(src(o0)).out(o3)
render()
```
Source: https://hydra.cca.codes/

### Texture Patterns

```js
// Grid pattern with overlapping squares
n = 4
a = () => shape(4, 0.4).repeat(n, n)
a().add(a().scrollX(0.5/n).scrollY(0.5/n), 1).out()

// Polka dot pattern
n = 4
a = () => shape(400, 0.5).repeat(n, n)
a().add(a().scrollX(0.5/n).scrollY(0.5/n), 1).out()

// Rotated polka dots
n = 8/Math.sqrt(2)
a = () => shape(400, 0.75).repeat(n, n)
a().rotate(Math.PI/4).out()

// RGB pixel filter (simulating LCD subpixels)
n = 50; func = () => osc(30, 0.1, 1).modulate(noise(4, 0.1))
pix = () => shape(4, 0.3).scale(1, 1, 3).repeat(n, n)
pix().mult(func().color(1, 0, 0).pixelate(n, n)).out(o1)
pix().mult(func().color(0, 1, 0).pixelate(n, n)).scrollX(1/n/3).out(o2)
pix().mult(func().color(0, 0, 1).pixelate(n, n)).scrollX(2/n/3).out(o3)
solid().add(src(o1), 1).add(src(o2), 1).add(src(o3), 1).out(o0)
```
Source: https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/guides/textures/

---

## 3. MODULATION -- Coordinate Warping and Distortion

### Basic Modulation

```js
// Noise modulates (warps) oscillator
osc().modulate(noise(1), 0.4).out()

// ModulateRotate -- rotation based on another source
osc().modulateRotate(osc(3).rotate(), 1).out()

// ModulateScrollX -- horizontal scroll from oscillator
voronoi(25, 0, 0).modulateScrollX(osc(10), 0.5).out()

// ModulateScrollY -- vertical scroll from oscillator
voronoi(25, 0, 0).modulateScrollY(osc(10), 0.5).out()

// ModulateScale -- "cosmic radiation" effect
gradient(5).repeat(50, 50).kaleid([3, 5, 7, 9].fast(0.5))
  .modulateScale(osc(4, -0.5, 0).kaleid(50).scale(0.5), 15, 0).out()

// ModulateHue -- complex motion from color channel differences
src(o0)
  .modulateHue(src(o0).scale(1.01), 1)
  .layer(osc(4, 0.5, 2).mask(shape(4, 0.5, 0.001)))
  .out(o0)

// ModulateKaleid
osc(10, 0.1, 2).modulateKaleid(osc(16).kaleid(999), 1).out()

// ModulatePixelate
src(o0).modulatePixelate(
  src(o0).hue(() => time/9).r().contrast(2).pixelate(32, 32),
  1024, 8
).out()

// ModulateRepeatX
shape(4, 0.9).mult(osc(4, 0.25, 1))
  .modulateRepeatX(osc(10), 5.0, ({time}) => Math.sin(time) * 5)
  .scale(1, 0.5, 0.05).out()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/video-synth-basics/modulate/

### Webcam + Modulation

```js
// Shape distorted by camera brightness
s0.initCam()
shape().modulate(src(s0)).out()

// Camera warped by animated shape
s0.initCam()
src(s0).modulate(shape()).out()

// Camera with modulateRotate
s0.initCam()
src(s0).out(o0)
osc(10).out(o1)
src(o0).modulateRotate(o1, 2).out(o2)
render()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/getting-started/

---

## 4. FEEDBACK LOOPS -- Recursive Self-Referencing

### Basic Feedback

```js
// Classic feedback: output feeds back into itself with modulation
// Creates organic, evolving patterns
osc(40, 0.1, 1).modulate(src(o0), 0.1).scale(1.1).rotate(0.04).out(o0)
```
Source: https://github.com/hydra-synth/hydra

### Scaling Feedback

```js
// Shape shrinking into itself -- fractal-like
shape(4, 0.8).diff(src(o0).scale(0.9)).out(o0)

// Voronoi scaling feedback
voronoi(10, 0).diff(src(o0).scale(0.9)).out(o0)

// Voronoi with threshold and sharp edges
voronoi(10, 0, 0).thresh(0.5, 0.01).diff(src(o0).scale(0.9)).out(o0)

// Voronoi with square mask
voronoi(10, 0, 0).thresh(0.5, 0.01)
  .mask(shape(4, 0.8, 0.01))
  .diff(src(o0).scale(0.9)).out(o0)

// Square with rotation feedback
shape(4, 0.9).diff(
  src(o0).scale(0.9).mask(shape(4, 0.9, 0.01)).rotate(0.1)
).out(o0)

// Scrolling feedback (horizontal trail)
shape(4, 0.7).diff(
  src(o0).scrollX(0.01).mask(shape(4, 0.7))
).out(o0)
```
Source: https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/guides/textures/

### Frame-Count Feedback with Toggle

```js
// Layer appears every 120 frames, rotation reverses
toggle = 0; rotation = 0.01
src(o0)
  .scale(1.017)
  .rotate(() => rotation)
  .layer(osc(10, 0.25, 2).mask(shape(4, 0.2)).mult(solid(0, 0, 0, 0), () => 1-toggle))
  .out()
frameCount = 0
update = (dt) => {
  toggle = 0
  if (frameCount % 120 == 0) { toggle = 1; rotation *= -1; }
  frameCount++
}
```
Source: https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/guides/frames-and-timing/

### Random Walker Feedback

```js
// Organic random movement with feedback trail and color blending
x = 0; y = 0;
t = () => solid(1, 1, 1, 1).mask(shape(3, 0.05, 0.01).rotate(Math.PI))
src(o0)
  .blend(osc(8, 0.1, 0.2).hue(0.3), -0.015)
  .scale(1.01)
  .rotate(0.01).mult(solid(0, 0, 0), 0.006)
  .layer(t().scroll(() => x, () => y))
  .layer(t().scroll(() => -x, () => -y))
  .out()
update = (dt) => {
  x += (Math.random() - 0.47) / 100
  y += (Math.random() - 0.47) / 100
}
```
Source: https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/guides/frames-and-timing/

### ModulateHue Feedback -- Evolving Color Fields

```js
src(o0)
  .modulateHue(src(o0).scale(1.01), 1)
  .layer(osc(4, 0.5, 2).mask(shape(4, 0.5, 0.001)))
  .out(o0)
```
Source: https://hydra.ojack.xyz/docs/docs/learning/video-synth-basics/modulate/

### ModulateRotate Feedback -- Spiral Motion

```js
src(o0).modulateRotate(
  src(o0).scale(1.01).hue(() => time/9).brightness(-0.3), 0.01
).out()
```
Source: https://hydra.cca.codes/

---

## 5. EXTERNAL SOURCES -- Webcam, Images, Video, Screen Capture

### Webcam

```js
// Initialize and display webcam
s0.initCam()
src(s0).out()

// Webcam with color inversion and kaleidoscope
s0.initCam()
src(s0).color(-1, 1).kaleid().out()

// Webcam with rotation, hue shift, and saturation
s0.initCam()
src(s0).rotate(0, 0.1).hue().saturate(5).out()

// Multiple cameras: select by index
s0.initCam(0)   // first camera
s0.initCam(1)   // second camera
```
Source: https://github.com/hydra-synth/hydra-examples/blob/master/0-getting-started.js

### Images

```js
// Load and display a remote image
s0.initImage("https://upload.wikimedia.org/wikipedia/commons/2/25/Hydra-Foto.jpg")
src(s0).out()

// Image with pixelation and color animation
s0.initImage('https://i.imgur.com/B2wV89r.png')
src(s0).scale(0.2, 0.8, 0.3)
  .modulatePixelate(osc(() => Math.sin(time)), 999)
  .color([0.7, 0.3].smooth(), [0.3, 0.7].smooth(), 0.4)
  .out()

// Image with kaleidoscopic voronoi modulation
s0.initImage('https://i.imgur.com/B2wV89r.png')
src(s0).scale(0.2, 0.8, 0.3)
  .modulatePixelate(osc(() => Math.sin(time)), 999)
  .color([0.7, 0.3].smooth(), [0.3, 0.7].smooth(), 0.4)
  .modulateKaleid(voronoi(), [2, 6].smooth().fast(0.4))
  .out()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/external-sources/

### Video

```js
// Load a video file as a source, apply transforms
vid = document.createElement('video')
vid.autoplay = true
vid.loop = true
vid.src = 'path/to/video.webm'

s0.init({src: vid})
src(s0)
  .rotate(0, 0.2)
  .repeat(5, 3, 0.5)
  .saturate(3.0)
  .scrollX(0, -0.1)
  .diff(osc(2, 0.3, 2))
  .diff(src(s0).saturate().hue(0.2))
  .out()

// Load a GIF/MP4 from URL
s0.initVideo("https://media.giphy.com/media/AS9LIFttYzkc0/giphy.mp4")
src(s0).out()

// Control video playback
s0.src.playbackRate = 2    // double speed
s0.src.currentTime = 10   // seek to 10s
s0.src.loop = false        // disable looping
```
Source: https://github.com/hydra-synth/hydra-examples/blob/master/5-video.js, https://hydra.ojack.xyz/docs/docs/learning/external-sources/

### Screen Capture

```js
// Share a window/tab as input
s0.initScreen()
src(s0).out()

// Screen capture with rotation
s0.initScreen()
src(s0).rotate(0.1).out()

// Select specific window
s0.initScreen(2)
src(s0).out()
```
Source: https://github.com/hydra-synth/hydra-examples/blob/master/0-getting-started.js

### HTML Canvas as Source

```js
// Create a canvas with text, use as Hydra source
myCanvas = document.createElement('canvas')
ctx = myCanvas.getContext('2d')
ctx.font = "30px Arial"
ctx.fillStyle = "red"
ctx.fillText("Hello World", 10, 50)

s0.init({ src: myCanvas, dynamic: false })
src(s0).diff(osc(2, 0.1, 1.2)).out()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/external-sources/

### Streaming Between Instances

```js
// Set your session name
pb.setName('myverycoolsession')

// Receive someone else's stream
s0.initStream('myfriendsverycoolsession')
src(s0).out()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/external-sources/

---

## 6. AUDIO-REACTIVE VISUALS

### Basic Audio Reactivity

```js
// Show/hide audio FFT visualization
a.show()
a.hide()

// Shape with size controlled by bass frequency
shape(5, () => a.fft[0]).out()

// Shape with size from mid-range frequency
shape(5, () => a.fft[2]).out()

// Combine base size with frequency data for scale
shape(5, () => 0.5 + a.fft[0])
  .scale(0.5, () => 0.5 + a.fft[2])
  .out()

// Oscillator color offset driven by audio
osc(10, 0, () => (a.fft[0] * 4)).out()
```
Source: https://github.com/hydra-synth/hydra-examples/blob/master/4-audio-reactivity.js

### Conditional Logic with Audio

```js
// Change repetitions when bass exceeds threshold
shape(5)
  .repeat(
    () => {
      if (a.fft[0] > 0.4) return 5
      return 1
    },
    1
  )
  .out()
```
Source: https://github.com/hydra-synth/hydra-examples/blob/master/4-audio-reactivity.js

### Audio Configuration

```js
// Smoothing: higher = less sensitive to rapid changes
a.setSmooth(0.96)   // high smoothing (slow response)
a.setSmooth(0.3)    // low smoothing (fast response)

// Cutoff: minimum volume threshold
a.setCutoff(6)      // higher threshold
a.setCutoff(2)      // lower threshold

// Scale: frequency range detection multiplier
a.setScale(3)

// Bins: number of frequency bands
a.setBins(6)

// Per-band settings
a.settings[0].cutoff = 8    // increase cutoff for bass band
a.settings[0].scale = 10    // increase scale for bass band
```
Source: https://github.com/hydra-synth/hydra-examples/blob/master/4-audio-reactivity.js

### Audio-Reactive with Kaleidoscope

```js
// Audio-driven modulation with kaleidoscope
a.setScale(5)
osc().modulate(noise(7), () => a.fft[0])
  .color(0, 2, 34)
  .kaleid(48)
  .scrollX([-0.2, 0.2])
  .out()
```
Source: https://medium.com/@royce.taylor789/hydra-b944ae889a61

---

## 7. INTERACTIVE -- Mouse and Dynamic Functions

### Mouse Control

```js
// Oscillator frequency follows mouse X position
osc(() => mouse.x).out()

// Two oscillators controlled by mouse X and Y
osc(() => mouse.x)
  .rotate(0.5)
  .modulate(osc(() => mouse.y))
  .out()

// Mouse-controlled scrolling
shape(99).scroll(
  () => -mouse.x / width,
  () => -mouse.y / height
).out()

// Smooth mouse-tracking circle with trail
x = () => (-mouse.x / innerWidth) + 0.5
y = () => (-mouse.y / innerHeight) + 0.5
posx = x(); posy = y();
shape(16, 0.05)
  .scrollX(() => posx += (x() - posx) / 40)
  .scrollY(() => posy += (y() - posy) / 40)
  .add(o0, 0.9)
  .out()
```
Source: https://github.com/hydra-synth/hydra-examples/blob/master/3-functions.js, https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/guides/frames-and-timing/

### Dynamic Functions and Time

```js
// Time-based repetition
gradient().repeat(() => 10 * Math.sin(time * 0.6)).out()

// Reusable function variable
sides = () => Math.floor(10 * Math.sin(time * 0.6))
shape(sides)
  .diff(shape(sides, 0.1))
  .out()

// Higher-order function returning a function
scaledSides = scale => () => (Math.floor(scale * Math.sin(time * 0.6)) + scale + 3)
shape(scaledSides(8))
  .diff(shape(scaledSides(4), 0.2))
  .out()

// Sine-modulated oscillator frequency
osc(function(){ return 100 * Math.sin(time * 0.1) }).out()
```
Source: https://github.com/hydra-synth/hydra-examples/blob/master/3-functions.js

### Array Patterns and BPM

```js
// Arrays as time-sequenced values
shape([3, 8, 4]).out()

// Speed control for arrays
shape([3, 8, 4].fast(3.0)).out()
shape([3, 8, 4].fast(0.4)).out()

// Complex multi-pattern with BPM sync
shape([3, 8, 4])
  .color(
    [-1, 1, -0.5].fast(0.5),
    0.4,
    [-1, -0.6, -0.8].fast(0.4)
  )
  .repeat([10, 100, 2, 3], 3)
  .out()
bpm(140)

// Smooth interpolation between values
osc(1, 1, [Math.PI/2, Math.PI*2].smooth()).out()
```
Source: https://github.com/hydra-synth/hydra-examples/blob/master/3-functions.js

### Update Function for Frame-Level Control

```js
// Complex time-based parameter evolution
inv = 0; r = 0;
osc(30, 0.1, () => -inv)
  .invert(() => inv)
  .diff(osc(30).rotate(() => r))
  .out()
update = (dt) => {
  inv = time % 12 < 6 ? Math.abs(Math.sin(time)) : time * 2 % 2
  r += Math.sin(time / 2) * (time % 2.5) * 0.02
  r -= Math.cos(time) * 0.01
}
```
Source: https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/guides/frames-and-timing/

---

## 8. MIDI CONTROL

### WebMIDI Setup and Use

```js
// Run in browser console to register Web MIDI
navigator.requestMIDIAccess()
  .then(onMIDISuccess, onMIDIFailure);

function onMIDISuccess(midiAccess) {
  console.log(midiAccess);
  var inputs = midiAccess.inputs;
  var outputs = midiAccess.outputs;
  for (var input of midiAccess.inputs.values()) {
    input.onmidimessage = getMIDIMessage;
  }
}

function onMIDIFailure() {
  console.log('Could not access your MIDI devices.');
}

// CC values normalized to 0.0-1.0
var cc = Array(128).fill(0.5)
getMIDIMessage = function(midiMessage) {
  var arr = midiMessage.data
  var index = arr[1]
  var val = (arr[2] + 1) / 128.0
  cc[index] = val
}

// Then use MIDI CC values in Hydra patches:
noise(4).color(() => cc[16], () => cc[17], () => cc[18]).out()
osc(10, 0.2, 0.5).rotate(() => (cc[0] * 6.28) - 3.14).scale(() => cc[1]).out()
```
Source: https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/sequencing-and-interactivity/midi/

---

## 9. CUSTOM GLSL SHADERS

### Source Type (generates pixels)

```js
// Simple red color generator
setFunction({
  name: 'red',
  type: 'src',
  inputs: [{ name: 'amount', type: 'float', default: 1.0 }],
  glsl: `return vec4(amount, 0, 0, 1);`
})
red(0.7).out()

// Custom gradient
setFunction({
  name: 'gradient2',
  type: 'src',
  inputs: [{ type: 'float', name: 'speed', default: 0 }],
  glsl: `return vec4(sin(time*speed), _st, 1.0);`
})
gradient2(1).out()

// Custom oscillator with RGB sine waves
setFunction({
  name: 'myOsc',
  type: 'src',
  inputs: [
    { type: 'float', name: 'frequency', default: 60 },
    { type: 'float', name: 'sync', default: 0.1 },
    { type: 'float', name: 'offset', default: 0 }
  ],
  glsl: `vec2 st = _st;
float r = sin((st.x-offset/frequency+time*sync)*frequency)*0.5 + 0.5;
float g = sin((-st.x+time*sync*2.)*frequency)*0.5 + 0.5;
float b = sin((st.x+offset/frequency+time*sync)*frequency)*0.5 + 0.5;
return vec4(r, g, b, 1.0);`
})
myOsc(10).out()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/extending-hydra/glsl/

### Color Type (transforms pixel colors)

```js
// Channel swapping
setFunction({
  name: 'switchColors',
  type: 'color',
  inputs: [],
  glsl: `return _c0.brga;`
})
osc(60, 0.1, 5).switchColors().out()

// Chroma key (green screen removal)
setFunction({
  name: 'chroma',
  type: 'color',
  inputs: [],
  glsl: `float maxrb = max(_c0.r, _c0.b);
float k = clamp((_c0.g-maxrb)*5.0, 0.0, 1.0);
float dg = _c0.g;
_c0.g = min(_c0.g, maxrb*0.8);
_c0 += vec4(dg - _c0.g);
return vec4(_c0.rgb, 1.0 - k);`
})
solid(0, 1, 0).layer(shape(5, 0.3, 0.3).luma()).out(o0)
osc(30, 0, 1).layer(src(o0).chroma()).out(o1)
render()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/extending-hydra/glsl/

### Coordinate Type (warps UV space)

```js
// Tangent distortion
setFunction({
  name: 'tan',
  type: 'coord',
  inputs: [
    { name: 'freq', type: 'float', default: 1 },
    { name: 'mult', type: 'float', default: 0.25 }
  ],
  glsl: `return tan(_st*3.141592*freq)*mult;`
})
osc(60, 0.1, 5).tan(2).out()

// Polar coordinate transform
setFunction({
  name: 'polar',
  type: 'coord',
  inputs: [],
  glsl: `vec2 st = _st - 0.5;
float r = length(st);
float a = atan(st.y, st.x);
float pi = 2.*3.1416;
return vec2(r*2., a/pi);`
})
gradient(2).add(noise(), 0.4).polar().out()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/extending-hydra/glsl/

### Combine Type (blending modes)

```js
// Negate blend mode
setFunction({
  name: 'negate',
  type: 'combine',
  inputs: [{ type: 'float', name: 'amount', default: 1 }],
  glsl: `_c1 *= amount;
return vec4(vec3(1.0)-abs(vec3(1.0)-_c0.rgb-_c1.rgb),
min(max(_c0.a, _c1.a), 1.0));`
})
osc().negate(noise().brightness(0.5)).out()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/extending-hydra/glsl/

### CombineCoord Type (modulation)

```js
// Custom modulator using color channels
setFunction({
  name: 'myModulator',
  type: 'combineCoord',
  inputs: [],
  glsl: `return vec2(_st.x+(_c0.g-_c0.b*0.1), _st.y+(_c0.r*0.2));`
})
noise(2).myModulator(osc(20, 0.1, 1).diff(o0)).out()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/extending-hydra/glsl/

### Inline GLSL Strings

```js
// Pass raw GLSL as string parameters
src(o0)
  .scroll(() => mouse.x/innerWidth, () => mouse.y/innerHeight)
  .layer(noise(3).sub(osc(5, 0.1, 2)).luma(0.1, 0.01))
  .scroll("-sign(st.x-0.5)*0.5", "-sign(st.y-0.5)*0.2")
  .scale("0.8+st.x*0.2")
  .rotate(0, 0.1)
  .brightness(0.01)
  .out()

// Hydra-GLSL extension syntax
glsl('vec4(sin(((_st.x*54.)+time*2.)*vec3(0.1,0.102,0.101)),1.0)')
  .diff(o0)
  .glslColor('vec4(c0.brg,1.)')
  .glslCoord('xy*=(1.0/vec2(i0, i0)); return xy', 0.25)
  .glslCombine('c0-c1', o1)
  .glslCombineCoord('uv+(vec2(c0.r,c0.b)*0.1)', o1)
  .out()
```
Source: https://hydra.ojack.xyz/docs/docs/learning/extending-hydra/glsl/

### Extract Compiled GLSL

```js
// See the raw GLSL output of a Hydra patch
shader = osc().modulate(noise()).glsl()
console.log(shader)
```
Source: https://github.com/hydra-synth/hydra-examples/blob/master/9-custom-shaders.js

---

## 10. INTEGRATION WITH OTHER LIBRARIES

### p5.js

```js
// Create a p5 instance and use it as a Hydra source
p5 = new P5({width: 512, height: 512, mode: 'P2D'})
p5.hide()  // hide the canvas overlay

p5.draw = () => {
  p5.fill(p5.mouseX / 5, p5.mouseY / 5, 255, 100)
  p5.rect(p5.mouseX, p5.mouseY, 30, 30)
}

s0.init({src: p5.canvas})
src(s0).repeat().out()
```
Source: https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/extending-hydra/extending-hydra/

### THREE.js

```js
// Load Three.js and render 3D into Hydra
await loadScript("https://threejs.org/build/three.js")

scene = new THREE.Scene()
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
renderer = new THREE.WebGLRenderer()
renderer.setSize(width, height)

geometry = new THREE.BoxGeometry()
material = new THREE.MeshBasicMaterial({color: 0x00ff00})
cube = new THREE.Mesh(geometry, material)
scene.add(cube)
camera.position.z = 1.5

update = () => {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}

s0.init({ src: renderer.domElement })
src(s0).repeat().out()
```
Source: https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/extending-hydra/extending-hydra/

### Tone.js (Audio Synthesis)

```js
await loadScript("https://unpkg.com/tone")
synth = new Tone.Synth().toDestination()
synth.triggerAttackRelease("C4", "8n")
```
Source: https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/extending-hydra/extending-hydra/

---

## 11. ADVANCED COMMUNITY SKETCHES

### "Fugitive Geometry VHS" by @eerie_ear
Full audio-reactive composition with gradients, shapes, voronoi, posterize, luma, colorama, and feedback.

```js
s = () => shape(7.284)
  .scrollX([-0.5, -0.2, 0.3, -0.1, -0.062].smooth(0.139).fast(0.049))
  .scrollY([0.25, -0.2, 0.3, -0.095, 0.2].smooth(0.453).fast(0.15));

solid()
  .add(gradient(3, 0.05).rotate(0.05, -0.2).posterize(0.56).contrast(0.016),
    [1, 0.541, 1, 0.5, 0.181, 0.6].smooth(0.9))
  .add(s())
  .mult(s().scale(0.8).scrollX(0.01).scrollY(-0.01).rotate(0.303, 0.06)
    .add(gradient(4.573).contrast(0.008), [0.684, 0.118, 1, 0.43].smooth(1.496), 0.5)
    .mult(src(o0).scale(0.142), () => a.fft[0] * 4.226))
  .diff(s().modulate(shape(644.351)).scale([1.7, 1.2].smooth(0.392).fast(0.05)))
  .add(gradient(2).invert(), () => a.fft[2])
  .mult(gradient(() => a.fft[3] * 8))
  .blend(src(o0, () => a.fft[1] * 40))
  .add(voronoi(() => a.fft[1], () => a.fft[3], () => a.fft[0])
    .thresh(0.7).posterize(0.419, 4).luma(0.9)
    .scrollY(1, () => a.fft[0] / 30)
    .colorama(0.369).thresh(() => a.fft[1])
    .scale(() => a.fft[3] * 2), () => a.fft[0] / 2)
  .out();
speed = 1;
```
Source: https://livecoding.michelepasin.org/utils/hydra/

### "Sumet" by Rangga Purnama Aji
Oscillating shapes with gradient blending and recursive noise modulation.

```js
osc(0.5, 1.25).mult(shape(1, 0.09).rotate(1.5))
  .diff(gradient())
  .add(shape(2, 2).blend(gradient(1)))
  .modulate(noise()
    .modulate(noise().scrollY(1, 0.0625)))
  .blend(o0)
  .color(0.2, -0.1, -0.5)
  .out()
```
Source: https://livecoding.michelepasin.org/utils/hydra/

### "Puertas II" by Celeste Betancur
Kaleidoscopic rotating shapes with cascading modulateRotate.

```js
osc(4.226, 0.122, 1)
  .kaleid()
  .mask(shape(4, 0.523, 1.91))
  .modulateRotate(shape(4, 0.1, 1))
  .modulateRotate(shape(1.428, 0.1, 0.633))
  .modulateRotate(shape(5.023, 0.143, 1.001))
  .scale(0.3)
  .add(shape(4, 0.062, 0.071).color(0.433, 1, 1, 0.5))
  .rotate(() => time)
  .out();
```
Source: https://livecoding.michelepasin.org/utils/hydra/

### "Corrupted Screensaver" by Ritchse
Voronoi with cascading modulation, threshold, and feedback -- glitch aesthetic.

```js
voronoi(350, 0.15)
  .modulateScale(osc(8).rotate(Math.sin(time)), 0.5)
  .thresh(0.8)
  .modulateRotate(osc(7), 0.4)
  .thresh(0.7)
  .diff(src(o0).scale(1.8))
  .modulateScale(osc(2).modulateRotate(o0, 0.74))
  .diff(src(o0).rotate([-.012, .01, -.002, 0]).scrollY(0, [-1/199800, 0].fast(0.7)))
  .brightness([-.02, -.17].smooth().fast(0.5))
  .out()
```
Source: https://livecoding.michelepasin.org/utils/hydra/

### Complex Modulation Stack

```js
osc(40, 0.2, 1)
  .modulateScale(osc(-40, 0, 1).kaleid(80))
  .repeat(2)
  .modulate(o0, 0.05)
  .modulateKaleid(shape(4, 320, 69))
  .out(o0)
```
Source: https://medium.com/@royce.taylor789/hydra-b944ae889a61

### Voronoi with Brick Pattern and Rotation

```js
voronoi().color(8, 3, 44)
  .rotate(({time}) => (time % 360) / 20)
  .modulate(osc(5, 0.1, 0.5)
    .kaleid(58).scale(({time}) => Math.sin(time * 50) * 5)
    .modulate(noise(0.6, 0.5)), 0.5)
  .out(o0)
```
Source: https://medium.com/@royce.taylor789/hydra-b944ae889a61

### Dynamic Kaleidoscope

```js
shape(2, 0.8)
  .kaleid(() => 6 + Math.sin(time) * 4)
  .out(o0)
```
Source: https://medium.com/@royce.taylor789/hydra-b944ae889a61

### Complex Threshold Pattern

```js
osc(80, 0.1, 0.8)
  .thresh()
  .rotate(1.71)
  .modulateRotate(osc(20, -0.1), 1)
  .out(o3)
```
Source: https://github.com/hydra-synth/hydra-examples/blob/master/1-blending.js

### Color-Shifted Modulated Oscillator

```js
osc(80, 0.1, 0.8)
  .color(1.0, 0.8, -1.0)
  .rotate(0.51, 0.1)
  .modulate(osc(40, -0.1), 0.1)
  .out(o3)
```
Source: https://github.com/hydra-synth/hydra-examples/blob/master/1-blending.js

---

## 12. QUICK REFERENCE -- Function Types

| Type | Functions |
|------|-----------|
| **Sources** | `osc()`, `shape()`, `noise()`, `voronoi()`, `gradient()`, `solid()`, `src()` |
| **Geometry** | `rotate()`, `scale()`, `pixelate()`, `repeat()`, `repeatX()`, `repeatY()`, `kaleid()`, `scroll()`, `scrollX()`, `scrollY()` |
| **Color** | `color()`, `brightness()`, `contrast()`, `saturate()`, `hue()`, `posterize()`, `shift()`, `invert()`, `luma()`, `thresh()`, `colorama()`, `r()`, `g()`, `b()`, `a()` |
| **Blend** | `add()`, `sub()`, `mult()`, `diff()`, `blend()`, `layer()`, `mask()` |
| **Modulate** | `modulate()`, `modulateRotate()`, `modulateScale()`, `modulateScrollX()`, `modulateScrollY()`, `modulateHue()`, `modulateKaleid()`, `modulatePixelate()`, `modulateRepeat()`, `modulateRepeatX()`, `modulateRepeatY()` |
| **External** | `s0.initCam()`, `s0.initScreen()`, `s0.initImage()`, `s0.initVideo()`, `s0.initStream()`, `s0.init()` |
| **Output** | `.out(o0)`, `render()`, `render(o1)` |
| **Audio** | `a.fft[n]`, `a.show()`, `a.hide()`, `a.setSmooth()`, `a.setCutoff()`, `a.setScale()`, `a.setBins()` |
| **Utility** | `speed`, `bpm()`, `time`, `mouse.x`, `mouse.y`, `update = (dt) => {}` |

---

## Sources

- [Hydra Getting Started](https://hydra.ojack.xyz/docs/docs/learning/getting-started/)
- [Hydra Documentation Portal](https://hydra.ojack.xyz/docs/)
- [Hydra Editor](https://hydra.ojack.xyz/)
- [GitHub: hydra-synth/hydra](https://github.com/hydra-synth/hydra)
- [GitHub: hydra-synth/hydra-examples](https://github.com/hydra-synth/hydra-examples)
- [Hydra Flash Introduction (CCA)](https://hydra.cca.codes/)
- [Hydra Book: Textures](https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/guides/textures/)
- [Hydra Modulation](https://hydra.ojack.xyz/docs/docs/learning/video-synth-basics/modulate/)
- [Hydra Blending](https://hydra.ojack.xyz/docs/docs/learning/video-synth-basics/blending/)
- [Hydra Color Functions](https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/video-synth-basics/color/)
- [Hydra External Sources](https://hydra.ojack.xyz/docs/docs/learning/external-sources/)
- [Hydra Custom GLSL](https://hydra.ojack.xyz/docs/docs/learning/extending-hydra/glsl/)
- [Hydra MIDI Docs](https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/sequencing-and-interactivity/midi/)
- [Hydra Frames and Timing](https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/guides/frames-and-timing/)
- [Hydra with Other Libraries](https://hydra.ojack.xyz/hydra-docs-v2/docs/learning/extending-hydra/extending-hydra/)
- [Audio Reactive Visuals Gist](https://gist.github.com/Sangarshanan/5b2c45e8a37982594ecdd15114ab9526)
- [Hydra Sketches Collection (Michele Pasin)](https://livecoding.michelepasin.org/utils/hydra/)
- [Hydra on Medium (Royce Taylor)](https://medium.com/@royce.taylor789/hydra-b944ae889a61)
- [CLIP Tutorial](https://www.clipsoundandmusic.uk/hydra-tutorial-a-beginners-guide-to-live-coding-visuals/)
- [CDM Article on Hydra](https://cdm.link/hydra-is-spectacular-free-live-coding-for-visuals-in-browser-now-on-ios-too/)
- [hydra-midi utility](https://github.com/arnoson/hydra-midi)
