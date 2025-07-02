# monograuvi

## Overview
monograuvi is a web application designed for creating dynamic music videos with reactive audio visuals. Users can connect various audio feature extractors to visual elements, including shaders, images, videos, timed lyrics, and customizable typographic displays, all within an intuitive node graph interface.

## Features
- **Node Graph Layout**: A user-friendly interface that allows users to connect audio feature extractors to visual elements.
- **Audio Feature Extractors**: Multiple extractors including FFT Analyzer, Beat Detector, and Pitch Detector to analyze audio data.
- **Visual Elements**: A variety of visual components such as shaders, images, videos, and animated typography.
- **Reactive Shaders**: Shaders that respond to audio feature streams, creating immersive visual experiences.
- **Customizable Typography**: Animated displays for lyrics with customizable appearance and timing.

## Project Structure
```
monograuvi
├── src
│   ├── App.jsx
│   ├── index.css
│   ├── index.html
│   ├── main.js
│   ├── store.js
│   ├── styles
│   │   ├── main.css
│   │   └── node-graph.css
│   ├── components
│   │   ├── NodeGraph.jsx
│   │   ├── NodeLibrary.jsx
# monograuvi

## Overview

monograuvi is a web application designed for creating dynamic music videos with reactive audio visuals. Users can connect various audio feature extractors to visual elements, including shaders, images, videos, timed lyrics, and customizable typographic displays, all within an intuitive node graph interface.

## Features

- **Node Graph Layout**: A user-friendly interface that allows users to connect audio feature extractors to visual elements.
- **Audio Feature Extraction**: Includes beat detection, pitch detection, FFT analysis, and more.
- **Visual Elements**: Shaders, images, videos, lyrics, and typography.
- **Customizable Themes**: Switch between different visual themes.
- **Real-Time Preview**: Instantly see changes as you edit nodes and connections.

## Project Structure

```text
src/
  App.jsx
  index.css
  index.html
  main.js
  store.js
  assets/
    fonts/
    presets/
  audio/
    BeatDetector.js
    FeatureExtractor.js
    FFTAnalyzer.js
    PitchDetector.js
  components/
    AudioExtractors.js
    Canvas.js
    MusicPlayer.jsx
    NodeGraph.js
    NodeGraph.jsx
    NodeLibrary.jsx
    ThemeSelector.jsx
    VisualElements.js
  nodes/
    AudioNode.js
    BaseNode.js
    OutputNode.js
    VisualNode.js
  shaders/
    audio-reactive.glsl
    fragment.glsl
    vertex.glsl
  styles/
    main.css
    node-graph.css
  utils/
    AudioUtils.js
    MathUtils.js
    WebGLUtils.js
  visuals/
    AnimationEngine.js
    ParticleSystem.js
    ShaderManager.js
    Typography.js
```

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/monograuvi.git
   cd monograuvi
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Usage

1. Start the development server:

   ```bash
   npm run dev
   ```