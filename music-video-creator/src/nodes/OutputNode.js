import BaseNode from './BaseNode.js';

class OutputNode extends BaseNode {
    constructor(type = 'video-render', options = {}) {
        super(`Output ${type}`, { 
            color: '#27AE60', 
            size: [220, 180],
            ...options 
        });
        
        this.outputType = type;
        this.canvas = null;
        this.context = null;
        this.renderTarget = null;
        this.recording = false;
        this.recorder = null;
        
        this.setupOutputNode();
    }

    setupOutputNode() {
        switch (this.outputType) {
            case 'video-render':
                this.setupVideoRender();
                break;
            case 'audio-render':
                this.setupAudioRender();
                break;
            case 'stream-output':
                this.setupStreamOutput();
                break;
            case 'file-export':
                this.setupFileExport();
                break;
            case 'preview':
                this.setupPreview();
                break;
            case 'social-export':
                this.setupSocialExport();
                break;
            case 'real-time':
                this.setupRealTime();
                break;
        }
    }

    setupVideoRender() {
        this.addInput('Visual', 'visual', { required: true, description: 'Visual input to render' });
        this.addInput('Audio', 'audio', { description: 'Audio track to include' });
        this.addInput('Trigger', 'boolean', { description: 'Start/stop recording trigger' });
        
        this.addProperty('resolution', '1920x1080', {
            options: ['1280x720', '1920x1080', '2560x1440', '3840x2160', '1080x1920', '1080x1080'],
            type: 'enum',
            description: 'Output resolution',
            category: 'Video'
        });
        this.addProperty('framerate', 30, {
            options: [24, 30, 60, 120],
            type: 'enum',
            description: 'Frame rate (fps)',
            category: 'Video'
        });
        this.addProperty('codec', 'h264', {
            options: ['h264', 'h265', 'vp9', 'av1'],
            type: 'enum',
            description: 'Video codec',
            category: 'Video'
        });
        this.addProperty('bitrate', 8000, { 
            min: 1000, max: 50000, step: 500,
            description: 'Video bitrate (kbps)',
            category: 'Quality'
        });
        this.addProperty('duration', 10, { 
            min: 1, max: 300, step: 1,
            description: 'Recording duration (seconds)',
            category: 'Recording'
        });
        this.addProperty('autoRecord', false, { 
            type: 'boolean',
            description: 'Auto-start recording',
            category: 'Recording'
        });
        this.addProperty('useBackend', true, { 
            type: 'boolean',
            description: 'Use Python backend for rendering',
            category: 'Processing'
        });
        this.addProperty('outputPath', './output/', { 
            type: 'string',
            description: 'Output directory path',
            category: 'Output'
        });
        this.addProperty('filename', 'monograuvi_output', { 
            type: 'string',
            description: 'Output filename (without extension)',
            category: 'Output'
        });
    }

    setupAudioRender() {
        this.addInput('Audio', 'audio', { required: true, description: 'Audio input to render' });
        this.addInput('Trigger', 'boolean', { description: 'Start/stop recording trigger' });
        
        this.addProperty('format', 'wav', {
            options: ['wav', 'mp3', 'flac', 'ogg', 'aac'],
            type: 'enum',
            description: 'Audio format',
            category: 'Audio'
        });
        this.addProperty('sampleRate', 44100, {
            options: [22050, 44100, 48000, 96000],
            type: 'enum',
            description: 'Sample rate (Hz)',
            category: 'Audio'
        });
        this.addProperty('bitDepth', 16, {
            options: [16, 24, 32],
            type: 'enum',
            description: 'Bit depth',
            category: 'Audio'
        });
        this.addProperty('channels', 2, {
            options: [1, 2],
            type: 'enum',
            description: 'Number of channels',
            category: 'Audio'
        });
        this.addProperty('duration', 30, { 
            min: 1, max: 600, step: 1,
            description: 'Recording duration (seconds)',
            category: 'Recording'
        });
        this.addProperty('normalize', true, { 
            type: 'boolean',
            description: 'Normalize audio levels',
            category: 'Processing'
        });
    }

    setupStreamOutput() {
        this.addInput('Visual', 'visual', { required: true, description: 'Visual stream input' });
        this.addInput('Audio', 'audio', { description: 'Audio stream input' });
        
        this.addProperty('platform', 'rtmp', {
            options: ['rtmp', 'webrtc', 'hls', 'dash'],
            type: 'enum',
            description: 'Streaming protocol',
            category: 'Stream'
        });
        this.addProperty('serverUrl', 'rtmp://localhost:1935/live', { 
            type: 'string',
            description: 'Streaming server URL',
            category: 'Stream'
        });
        this.addProperty('streamKey', '', { 
            type: 'string',
            description: 'Stream key/password',
            category: 'Stream'
        });
        this.addProperty('resolution', '1280x720', {
            options: ['854x480', '1280x720', '1920x1080'],
            type: 'enum',
            description: 'Stream resolution',
            category: 'Quality'
        });
        this.addProperty('framerate', 30, {
            options: [15, 30, 60],
            type: 'enum',
            description: 'Stream framerate',
            category: 'Quality'
        });
        this.addProperty('videoBitrate', 2500, { 
            min: 500, max: 10000, step: 100,
            description: 'Video bitrate (kbps)',
            category: 'Quality'
        });
        this.addProperty('audioBitrate', 128, { 
            min: 64, max: 320, step: 32,
            description: 'Audio bitrate (kbps)',
            category: 'Quality'
        });
    }

    setupFileExport() {
        this.addInput('Data', 'any', { required: true, description: 'Data to export' });
        this.addInput('Trigger', 'boolean', { description: 'Export trigger' });
        
        this.addProperty('format', 'json', {
            options: ['json', 'csv', 'xml', 'txt', 'midi', 'wav', 'mp4'],
            type: 'enum',
            description: 'Export format',
            category: 'Export'
        });
        this.addProperty('compression', 'none', {
            options: ['none', 'gzip', 'zip'],
            type: 'enum',
            description: 'Compression type',
            category: 'Export'
        });
        this.addProperty('autoExport', false, { 
            type: 'boolean',
            description: 'Auto-export on data change',
            category: 'Export'
        });
        this.addProperty('outputPath', './exports/', { 
            type: 'string',
            description: 'Export directory path',
            category: 'Output'
        });
        this.addProperty('filename', 'export', { 
            type: 'string',
            description: 'Export filename',
            category: 'Output'
        });
        this.addProperty('timestamp', true, { 
            type: 'boolean',
            description: 'Add timestamp to filename',
            category: 'Output'
        });
    }

    setupPreview() {
        this.addInput('Visual', 'visual', { description: 'Visual input for preview' });
        this.addInput('Audio', 'audio', { description: 'Audio input for preview' });
        
        this.addProperty('previewSize', 'medium', {
            options: ['small', 'medium', 'large', 'fullscreen'],
            type: 'enum',
            description: 'Preview window size',
            category: 'Preview'
        });
        this.addProperty('showControls', true, { 
            type: 'boolean',
            description: 'Show playback controls',
            category: 'Interface'
        });
        this.addProperty('showStats', false, { 
            type: 'boolean',
            description: 'Show performance statistics',
            category: 'Interface'
        });
        this.addProperty('autoPlay', true, { 
            type: 'boolean',
            description: 'Auto-play on input change',
            category: 'Playback'
        });
        this.addProperty('loop', false, { 
            type: 'boolean',
            description: 'Loop playback',
            category: 'Playback'
        });
        this.addProperty('volume', 1.0, { 
            min: 0, max: 2, step: 0.1,
            description: 'Preview volume',
            category: 'Audio'
        });
    }

    setupSocialExport() {
        this.addInput('Visual', 'visual', { required: true, description: 'Visual content to export' });
        this.addInput('Audio', 'audio', { description: 'Audio content to include' });
        this.addInput('Trigger', 'boolean', { description: 'Export trigger' });
        
        this.addProperty('platform', 'instagram', {
            options: ['instagram', 'tiktok', 'youtube-shorts', 'twitter', 'facebook', 'custom'],
            type: 'enum',
            description: 'Target social platform',
            category: 'Platform'
        });
        this.addProperty('aspectRatio', '9:16', {
            options: ['1:1', '4:5', '9:16', '16:9', '21:9'],
            type: 'enum',
            description: 'Video aspect ratio',
            category: 'Format'
        });
        this.addProperty('duration', 15, { 
            min: 3, max: 180, step: 1,
            description: 'Video duration (seconds)',
            category: 'Format'
        });
        this.addProperty('quality', 'high', {
            options: ['low', 'medium', 'high', 'maximum'],
            type: 'enum',
            description: 'Export quality preset',
            category: 'Quality'
        });
        this.addProperty('addCaptions', false, { 
            type: 'boolean',
            description: 'Auto-generate captions',
            category: 'Content'
        });
        this.addProperty('addWatermark', false, { 
            type: 'boolean',
            description: 'Add watermark/branding',
            category: 'Content'
        });
        this.addProperty('watermarkText', 'Made with Monograuvi', { 
            type: 'string',
            description: 'Watermark text',
            category: 'Content'
        });
    }

    setupRealTime() {
        this.addInput('Visual', 'visual', { description: 'Real-time visual input' });
        this.addInput('Audio', 'audio', { description: 'Real-time audio input' });
        
        this.addProperty('outputDevice', 'default', {
            options: ['default', 'virtual-camera', 'obs', 'screen-capture'],
            type: 'enum',
            description: 'Output device/method',
            category: 'Output'
        });
        this.addProperty('latency', 'low', {
            options: ['ultra-low', 'low', 'medium', 'high'],
            type: 'enum',
            description: 'Latency optimization',
            category: 'Performance'
        });
        this.addProperty('bufferSize', 256, {
            options: [64, 128, 256, 512, 1024],
            type: 'enum',
            description: 'Buffer size (samples)',
            category: 'Performance'
        });
        this.addProperty('enableSync', true, { 
            type: 'boolean',
            description: 'Enable audio/video sync',
            category: 'Sync'
        });
    }

    async onProcess(inputs) {
        switch (this.outputType) {
            case 'video-render':
                return this.processVideoRender(inputs);
            case 'audio-render':
                return this.processAudioRender(inputs);
            case 'stream-output':
                return this.processStreamOutput(inputs);
            case 'file-export':
                return this.processFileExport(inputs);
            case 'preview':
                return this.processPreview(inputs);
            case 'social-export':
                return this.processSocialExport(inputs);
            case 'real-time':
                return this.processRealTime(inputs);
            default:
                return this.getErrorOutput();
        }
    }

    async processVideoRender(inputs) {
        const visual = inputs.Visual;
        const audio = inputs.Audio;
        const trigger = inputs.Trigger;
        
        if (trigger && !this.recording) {
            this.startVideoRecording(visual, audio);
        } else if (!trigger && this.recording) {
            this.stopVideoRecording();
        }
        
        if (this.getProperty('useBackend') && visual) {
            try {
                const result = await this.callBackendAPI('/api/video/render', {
                    visual_data: visual,
                    audio_data: audio,
                    resolution: this.getProperty('resolution'),
                    framerate: this.getProperty('framerate'),
                    codec: this.getProperty('codec'),
                    bitrate: this.getProperty('bitrate'),
                    duration: this.getProperty('duration'),
                    output_path: this.getProperty('outputPath'),
                    filename: this.getProperty('filename')
                });
                
                return {
                    status: 'rendering',
                    progress: result.progress || 0,
                    outputFile: result.output_file,
                    error: null
                };
            } catch (error) {
                return {
                    status: 'error',
                    progress: 0,
                    outputFile: null,
                    error: error.message
                };
            }
        }
        
        return {
            status: this.recording ? 'recording' : 'ready',
            progress: 0,
            outputFile: null,
            error: null
        };
    }

    async processAudioRender(inputs) {
        const audio = inputs.Audio;
        const trigger = inputs.Trigger;
        
        if (trigger && !this.recording && audio) {
            try {
                const result = await this.callBackendAPI('/api/audio/render', {
                    audio_data: audio,
                    format: this.getProperty('format'),
                    sample_rate: this.getProperty('sampleRate'),
                    bit_depth: this.getProperty('bitDepth'),
                    channels: this.getProperty('channels'),
                    duration: this.getProperty('duration'),
                    normalize: this.getProperty('normalize')
                });
                
                return {
                    status: 'rendered',
                    outputFile: result.output_file,
                    duration: result.duration,
                    error: null
                };
            } catch (error) {
                return {
                    status: 'error',
                    outputFile: null,
                    duration: 0,
                    error: error.message
                };
            }
        }
        
        return {
            status: 'ready',
            outputFile: null,
            duration: 0,
            error: null
        };
    }

    async processStreamOutput(inputs) {
        const visual = inputs.Visual;
        const audio = inputs.Audio;
        
        if (visual) {
            try {
                const result = await this.callBackendAPI('/api/stream/output', {
                    visual_data: visual,
                    audio_data: audio,
                    platform: this.getProperty('platform'),
                    server_url: this.getProperty('serverUrl'),
                    stream_key: this.getProperty('streamKey'),
                    resolution: this.getProperty('resolution'),
                    framerate: this.getProperty('framerate'),
                    video_bitrate: this.getProperty('videoBitrate'),
                    audio_bitrate: this.getProperty('audioBitrate')
                });
                
                return {
                    streaming: result.streaming,
                    viewers: result.viewers || 0,
                    uptime: result.uptime || 0,
                    error: null
                };
            } catch (error) {
                return {
                    streaming: false,
                    viewers: 0,
                    uptime: 0,
                    error: error.message
                };
            }
        }
        
        return {
            streaming: false,
            viewers: 0,
            uptime: 0,
            error: null
        };
    }

    async processFileExport(inputs) {
        const data = inputs.Data;
        const trigger = inputs.Trigger;
        
        if ((trigger || this.getProperty('autoExport')) && data) {
            try {
                const filename = this.generateFilename();
                const result = await this.exportData(data, filename);
                
                return {
                    exported: true,
                    filename: result.filename,
                    path: result.path,
                    size: result.size,
                    error: null
                };
            } catch (error) {
                return {
                    exported: false,
                    filename: null,
                    path: null,
                    size: 0,
                    error: error.message
                };
            }
        }
        
        return {
            exported: false,
            filename: null,
            path: null,
            size: 0,
            error: null
        };
    }

    processPreview(inputs) {
        const visual = inputs.Visual;
        const audio = inputs.Audio;
        
        // Update preview display
        if (visual || audio) {
            this.updatePreviewDisplay(visual, audio);
        }
        
        return {
            previewing: !!(visual || audio),
            visual: !!visual,
            audio: !!audio,
            volume: this.getProperty('volume'),
            controls: this.getProperty('showControls')
        };
    }

    async processSocialExport(inputs) {
        const visual = inputs.Visual;
        const audio = inputs.Audio;
        const trigger = inputs.Trigger;
        
        if (trigger && visual) {
            try {
                const result = await this.callBackendAPI('/api/social/export', {
                    visual_data: visual,
                    audio_data: audio,
                    platform: this.getProperty('platform'),
                    aspect_ratio: this.getProperty('aspectRatio'),
                    duration: this.getProperty('duration'),
                    quality: this.getProperty('quality'),
                    add_captions: this.getProperty('addCaptions'),
                    add_watermark: this.getProperty('addWatermark'),
                    watermark_text: this.getProperty('watermarkText')
                });
                
                return {
                    exported: true,
                    platform: this.getProperty('platform'),
                    outputFile: result.output_file,
                    optimized: result.optimized,
                    fileSize: result.file_size,
                    error: null
                };
            } catch (error) {
                return {
                    exported: false,
                    platform: this.getProperty('platform'),
                    outputFile: null,
                    optimized: false,
                    fileSize: 0,
                    error: error.message
                };
            }
        }
        
        return {
            exported: false,
            platform: this.getProperty('platform'),
            outputFile: null,
            optimized: false,
            fileSize: 0,
            error: null
        };
    }

    processRealTime(inputs) {
        const visual = inputs.Visual;
        const audio = inputs.Audio;
        
        if (visual || audio) {
            this.outputRealTime(visual, audio);
        }
        
        return {
            outputting: !!(visual || audio),
            device: this.getProperty('outputDevice'),
            latency: this.getLatencyMs(),
            bufferLoad: this.getBufferLoad(),
            synced: this.getProperty('enableSync')
        };
    }

    // Helper methods
    startVideoRecording(visual, audio) {
        this.recording = true;
        // Initialize recording with browser APIs or backend
        console.log('Starting video recording...');
    }

    stopVideoRecording() {
        this.recording = false;
        console.log('Stopping video recording...');
    }

    generateFilename() {
        const base = this.getProperty('filename');
        const format = this.getProperty('format');
        const timestamp = this.getProperty('timestamp') ? 
            `_${new Date().toISOString().replace(/[:.]/g, '-')}` : '';
        
        return `${base}${timestamp}.${format}`;
    }

    async exportData(data, filename) {
        // This would implement actual file export
        // For now, return mock result
        return {
            filename,
            path: `${this.getProperty('outputPath')}${filename}`,
            size: JSON.stringify(data).length
        };
    }

    updatePreviewDisplay(visual, audio) {
        // Update the preview canvas/display
        // This would integrate with the actual preview system
    }

    outputRealTime(visual, audio) {
        // Output to real-time device/stream
        // This would integrate with actual output APIs
    }

    getLatencyMs() {
        // Calculate current latency
        const latency = this.getProperty('latency');
        const bufferSize = this.getProperty('bufferSize');
        
        switch (latency) {
            case 'ultra-low': return Math.max(5, bufferSize / 48);
            case 'low': return Math.max(10, bufferSize / 24);
            case 'medium': return Math.max(20, bufferSize / 12);
            case 'high': return Math.max(40, bufferSize / 6);
            default: return 20;
        }
    }

    getBufferLoad() {
        // Calculate buffer load percentage
        return Math.random() * 0.8; // Mock value
    }

    destroy() {
        super.destroy();
        
        if (this.recording) {
            this.stopVideoRecording();
        }
        
        if (this.recorder) {
            this.recorder.stop();
            this.recorder = null;
        }
        
        if (this.canvas) {
            this.canvas = null;
            this.context = null;
        }
    }
}

// Factory function for creating different output node types
export function createOutputNode(type, options = {}) {
    return new OutputNode(type, options);
}

export default OutputNode;
