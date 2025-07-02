# Monograuvi Backend

This is the Python backend for the Monograuvi music video creator application. It provides powerful audio processing, machine learning capabilities, and video generation using libraries like librosa, PyTorch, scikit-learn, OpenCV, and moviepy.

## Features

- **Advanced Audio Processing**: Using librosa for spectral analysis, beat detection, key detection, and audio segmentation
- **Machine Learning**: Audio genre classification, mood analysis, and intelligent visual parameter generation
- **Video Generation**: Audio-reactive video creation, particle systems, and spectrogram visualizations
- **Real-time Communication**: WebSocket support for live updates during processing
- **RESTful API**: Clean FastAPI endpoints for all functionality

## Quick Start

### 1. Set up Python Virtual Environment

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Start the Server

```bash
python main.py
```

The server will start on `http://localhost:8000`

### 4. View API Documentation

Once the server is running, visit:
- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── core/                   # Core functionality
│   ├── config.py          # Configuration settings
│   ├── audio_processor.py # Advanced audio processing
│   ├── video_generator.py # Video creation and effects
│   └── ml_models.py       # Machine learning models
├── api/                   # API routes
│   └── routes/
│       ├── audio.py       # Audio processing endpoints
│       ├── video.py       # Video generation endpoints
│       ├── ml.py          # Machine learning endpoints
│       └── websocket.py   # WebSocket connections
└── temp/                  # Temporary files (created automatically)
    ├── audio/             # Temporary audio files
    ├── video/             # Generated videos
    └── ml/                # ML model cache
```

## API Endpoints

### Audio Processing (`/api/audio/`)
- `POST /upload` - Upload and analyze audio files
- `POST /analyze` - Comprehensive audio analysis
- `POST /spectrogram` - Generate spectrogram visualizations
- `POST /extract-features` - Extract specific audio features

### Video Generation (`/api/video/`)
- `POST /create-reactive` - Create audio-reactive videos
- `POST /create-spectrogram` - Create spectrogram videos
- `POST /create-particles` - Create particle system videos
- `POST /add-audio` - Combine video with audio
- `POST /apply-effects` - Apply video effects
- `GET /download/{filename}` - Download generated videos

### Machine Learning (`/api/ml/`)
- `POST /classify-genre` - Classify audio genre
- `POST /analyze-mood` - Analyze audio mood
- `POST /cluster-segments` - Cluster audio segments
- `POST /generate-visual-params` - Generate visual parameters

### WebSocket (`/ws/`)
- `/audio-processing` - Real-time audio processing updates
- `/video-generation` - Real-time video generation updates
- `/notifications` - General notifications

## Configuration

Edit `core/config.py` to customize:

- Server host and port
- File upload limits
- Audio processing parameters
- ML model settings
- WebSocket configuration

## Integration with Frontend

The backend is designed to work seamlessly with the React frontend. To connect them:

1. Start the backend server (port 8000)
2. Start the frontend development server (port 5173)
3. The frontend will automatically connect to the backend API

## Example Usage

### Upload and Analyze Audio

```python
import requests

# Upload audio file
with open('song.mp3', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/audio/analyze',
        files={'file': f},
        params={'analysis_type': 'full'}
    )

analysis_results = response.json()
```

### Generate Audio-Reactive Video

```python
import requests

video_config = {
    "fps": 30,
    "width": 1920,
    "height": 1080
}

response = requests.post(
    'http://localhost:8000/api/video/create-reactive',
    json={
        "audio_features": analysis_results['results']['features'],
        "video_config": video_config
    }
)

video_info = response.json()
```

## Key Libraries Used

- **FastAPI**: Modern, fast web framework for building APIs
- **librosa**: Music and audio analysis library
- **PyTorch**: Deep learning framework for ML models
- **scikit-learn**: Machine learning utilities and algorithms
- **OpenCV**: Computer vision and video processing
- **moviepy**: Video editing and generation
- **matplotlib**: Plotting and visualization
- **numpy**: Numerical computing

## Development

### Adding New Features

1. **Audio Processing**: Add new functions to `core/audio_processor.py`
2. **Video Generation**: Extend `core/video_generator.py`
3. **ML Models**: Add models to `core/ml_models.py`
4. **API Endpoints**: Create new routes in `api/routes/`

### Environment Variables

Create a `.env` file for custom configuration:

```bash
HOST=localhost
PORT=8000
DEBUG=true
ENABLE_GPU=true
MAX_FILE_SIZE=104857600
```

## Troubleshooting

### Common Issues

1. **ImportError**: Make sure all dependencies are installed in the virtual environment
2. **CUDA errors**: Set `ENABLE_GPU=false` in config if you don't have CUDA
3. **FFmpeg errors**: Install FFmpeg for video processing
4. **Port conflicts**: Change the port in `core/config.py`

### Installation Issues

If you encounter issues installing dependencies:

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install python3-dev libportaudio2 libportaudio-dev ffmpeg

# Install system dependencies (macOS)
brew install portaudio ffmpeg

# Upgrade pip and setuptools
pip install --upgrade pip setuptools wheel
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see the main project README for details.
