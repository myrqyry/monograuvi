# monograuvi

## Overview
monograuvi is a web application designed for creating dynamic music videos with reactive audio visuals. Users can connect various audio feature extractors to visual elements, including shaders, images, videos, timed lyrics, and customizable typographic displays, all within an intuitive node graph interface. This project has been extended with a comprehensive system for adapting popular Three.js examples into modular, reusable nodes.

## Features
- **Node Graph Layout**: A user-friendly interface that allows users to connect audio feature extractors to visual elements.
- **Audio Feature Extractors**: Multiple extractors including FFT Analyzer, Beat Detector, and Pitch Detector to analyze audio data.
- **Visual Elements**: A variety of visual components such as shaders, images, videos, and animated typography.
- **Three.js Integration**: Comprehensive modular system for integrating Three.js examples as nodes for 3D graphics, scenes, and post-processing effects.
- **Reactive Shaders**: Shaders that respond to audio feature streams, creating immersive visual experiences.
- **Customizable Typography**: Animated displays for lyrics with customizable appearance and timing.
- **Customizable Themes**: Switch between different visual themes.
- **Real-Time Preview**: Instantly see changes as you edit nodes and connections.

## Project Structure
```text
src/
  App.jsx
  index.css
  index.html
  main.jsx
  store.js
  store.test.js
  api/
    axiosInstance.js
  assets/
    fonts/
    presets/
  audio/
    BeatDetector.js
    FeatureExtractor.js
    FFTAnalyzer.js
    PitchDetector.js
  components/
    AudioExtractors.jsx
    Canvas.jsx
    MotionLibraryDisplay.jsx
    MusicPlayer.jsx
    NodeLibrary.jsx
    ReteEditor.jsx
    ThemeSelector.jsx
    Timeline.jsx
    VisualElements.jsx
    VRMViewer.jsx
    WaveformTimeline.backup.jsx
    WaveformTimeline.jsx
    rete_controls/
      CheckboxControlComponent.jsx
      NumberControlComponent.jsx
      SelectControlComponent.jsx
      TextControlComponent.jsx
    rete_visuals/
      SimpleVisualComponent.jsx
  lib/
    MotionLibrary.js
    MotionLibrary.test.js
    Playhead.js
    Playhead.test.js
  motions/
    dance_moves.json
    schema.json
  nodes/
    AudioNode.js
    AudioSourceReteNode.js
    BaseNode.js
    ControlNode.js
    DanceMotionNode.js
    OutputNode.js
    PlayheadNode.js
    registerNodes.js
    VisualNode.js
    rete/
      AudioFilterReteNode.js
      AudioRenderReteNode.js
      AudioSourceReteNode.js
      AudioSourceReteNode.test.js
      BaseVisualReteNode.js
      ClockReteNode.js
      DanceMotionReteNode.js
      EnvelopeReteNode.js
      ExpressionReteNode.js
      FileExportReteNode.js
      FlowFieldReteNode.js
      GeometryRendererReteNode.js
      KaleidoscopeReteNode.js
      LfoReteNode.js
      LyricTranscriberReteNode.js
      MandalaReteNode.js
      MidiReteNode.js
      MyBaseReteNode.js
      ParticleSystemReteNode.js
      PlayheadReteNode.js
      PreviewReteNode.js
      RandomReteNode.js
      RealTimeReteNode.js
      SequencerReteNode.js
      ShaderEffectReteNode.js
      SimpleVisualReteNode.js
      SocialExportReteNode.js
      SpectrumVisualizerReteNode.js
      StreamOutputReteNode.js
      TextAnimatorReteNode.js
      TriggerReteNode.js
      UnrealBloomReteNode.js
      VideoEffectReteNode.js
      VideoRenderReteNode.js
      WaveformReteNode.js
  shaders/
    audio-reactive.glsl
    fragment.glsl
    vertex.glsl
  styles/
    main.css
    node-graph.css
  threejs/
    core/
      AnimationNode.js
      CameraNode.js
      MeshNode.js
      RendererNode.js
      SceneNode.js
      SceneRendererNode.js
      ThreeJSBaseNode.js
      ThreeJSRenderPipeline.js
      ThreeJSResourceManager.js
    geometry/
      BoxGeometryNode.js
      SphereGeometryNode.js
    lighting/
      AmbientLightNode.js
      DirectionalLightNode.js
      PointLightNode.js
    materials/
      MeshBasicMaterialNode.js
      MeshStandardMaterialNode.js
      ShaderMaterialNode.js
    postprocessing/
      EffectComposerNode.js
      UnrealBloomPassNode.js
  types/
    timeline.ts
  utils/
    AudioUtils.js
    commands.js
    ContextMenuExtensions.js
    EnhancedNodeGraphIntegration.js
    EnhancedWidgets.js
    MathUtils.js
    NodeGroupingHelpers.js
    SearchEnhancements.js
    WebGLUtils.js
  visuals/
    AnimationEngine.js
    ParticleSystem.js
    ShaderManager.js
    Typography.js
└── public/
    ├── beat-detector.worklet.js
    ├── models/
    │   └── 4395579424381356600.vrm
    └── motions/
        ├── 01Motion_1.vmd
        ├── 01Motion_2.vmd
        ├── 01Motion_3.vmd
        └── 01Motion_4.vmd
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