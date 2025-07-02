# Music Video Creator

## Overview
The Music Video Creator is a web application designed for creating dynamic music videos with reactive audio visuals. Users can connect various audio feature extractors to visual elements, including shaders, images, videos, timed lyrics, and customizable typographic displays, all within an intuitive node graph interface.

## Features
- **Node Graph Layout**: A user-friendly interface that allows users to connect audio feature extractors to visual elements.
- **Audio Feature Extractors**: Multiple extractors including FFT Analyzer, Beat Detector, and Pitch Detector to analyze audio data.
- **Visual Elements**: A variety of visual components such as shaders, images, videos, and animated typography.
- **Reactive Shaders**: Shaders that respond to audio feature streams, creating immersive visual experiences.
- **Customizable Typography**: Animated displays for lyrics with customizable appearance and timing.

## Project Structure
```
music-video-creator
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
│   │   ├── MusicPlayer.jsx
│   │   ├── ThemeSelector.jsx
│   │   ├── AudioExtractors.js
│   │   ├── VisualElements.js
│   │   └── Canvas.js
│   ├── audio
│   │   ├── FeatureExtractor.js
│   │   ├── FFTAnalyzer.js
│   │   ├── BeatDetector.js
│   │   └── PitchDetector.js
│   ├── visuals
│   │   ├── ShaderManager.js
│   │   ├── AnimationEngine.js
│   │   ├── ParticleSystem.js
│   │   └── Typography.js
│   ├── shaders
│   │   ├── vertex.glsl
│   │   ├── fragment.glsl
│   │   └── audio-reactive.glsl
│   ├── nodes
│   │   ├── BaseNode.js
│   │   ├── AudioNode.js
│   │   ├── VisualNode.js
│   │   └── OutputNode.js
│   ├── utils
│   │   ├── WebGLUtils.js
│   │   ├── AudioUtils.js
│   │   └── MathUtils.js
│   └── assets
│       ├── fonts
│       └── presets
├── package.json
├── webpack.config.js
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/music-video-creator.git
   ```
2. Navigate to the project directory:
   ```
   cd music-video-creator
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage
1. Start the development server:
   ```
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000` to access the application.
3. Use the node graph interface to connect audio feature extractors to visual elements and create your music video.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for details.