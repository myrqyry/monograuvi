"""
File validation utilities for robust file type checking.
"""

import mimetypes
import magic
import logging
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import io

logger = logging.getLogger(__name__)

# Audio file signatures (magic bytes)
AUDIO_SIGNATURES = {
    # MP3: ID3v2 header or MPEG frame header
    'mp3': [
        b'ID3',  # ID3v2
        b'\xff\xfb',  # MPEG-1 Layer 3
        b'\xff\xf3',  # MPEG-1 Layer 3
        b'\xff\xf2',  # MPEG-1 Layer 3
        b'\xff\xfa',  # MPEG-1 Layer 2
        b'\xff\xf9',  # MPEG-1 Layer 2
        b'\xff\xf8',  # MPEG-1 Layer 2
        b'\xff\xfe',  # MPEG-2 Layer 3
        b'\xff\xfd',  # MPEG-2 Layer 3
        b'\xff\xfc',  # MPEG-2 Layer 3
    ],
    # WAV: RIFF header
    'wav': [b'RIFF'],
    # FLAC: fLaC signature
    'flac': [b'fLaC'],
    # OGG: OggS signature
    'ogg': [b'OggS'],
    # M4A: ftyp box with M4A signature
    'm4a': [b'ftypM4A', b'ftypmp42', b'ftypisom', b'ftypMSNV'],
    # AAC: ADIF header or ADTS header
    'aac': [b'ADIF', b'\xff\xf1', b'\xff\xf9'],
}

# Video file signatures
VIDEO_SIGNATURES = {
    # MP4: ftyp box
    'mp4': [b'ftypmp4', b'ftypisom', b'ftypMSNV', b'ftyp3gp5'],
    # AVI: RIFF header with AVI signature
    'avi': [b'RIFF'],
    # MOV: ftyp box with qt signature
    'mov': [b'ftypqt'],
    # WebM: EBML header
    'webm': [b'\x1a\x45\xdf\xa3'],
    # MKV: EBML header
    'mkv': [b'\x1a\x45\xdf\xa3'],
}

# Image file signatures
IMAGE_SIGNATURES = {
    'png': [b'\x89PNG\r\n\x1a\n'],
    'jpg': [b'\xff\xd8\xff'],
    'jpeg': [b'\xff\xd8\xff'],
    'gif': [b'GIF87a', b'GIF89a'],
    'bmp': [b'BM'],
    'tiff': [b'II*\x00', b'MM\x00*'],
    'webp': [b'RIFF'],
}

class FileValidator:
    """Robust file validation using multiple methods."""

    def validate_path_is_safe(self, base_path: str, user_path: str) -> bool:
        """
        Validate that the user-provided path is securely within the base path.
        Prevents path traversal attacks.

        Args:
            base_path: The secure base directory.
            user_path: The user-provided file path or filename.

        Returns:
            True if the path is safe, False otherwise.
        """
        try:
            # Resolve the absolute path of the base directory
            resolved_base_path = Path(base_path).resolve()

            # Resolve the absolute path of the requested file by joining it with the base path
            # and then resolving. This is the crucial step to prevent traversal.
            resolved_user_path = (resolved_base_path / user_path).resolve()

            # Check if the resolved user path is a subdirectory of (or same as) the base path.
            # This is a reliable way to check for path traversal on different OS.
            return resolved_user_path.is_relative_to(resolved_base_path)
            
        except Exception as e:
            logger.error(f"Error during path validation for user_path='{user_path}' in base_path='{base_path}': {e}")
            return False

    def validate_audio_file_from_path(self, file_path: str) -> Tuple[bool, str]:
        """
        Validate audio file using file path.

        Args:
            file_path: Path to the audio file.

        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            with open(file_path, "rb") as f:
                file_content = f.read()  # Read the file in chunks if needed
                return self.validate_audio_file(file_content, Path(file_path).name)
        except Exception as e:
            logger.error(f"Error validating audio file {file_path}: {e}")
            return False, f"Validation error: {str(e)}"
    
    def __init__(self):
        # Initialize mimetypes
        mimetypes.init()
        
        # Supported audio formats
        self.supported_audio_formats = {
            'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'
        }
        
        # Supported video formats
        self.supported_video_formats = {
            'mp4', 'avi', 'mov', 'webm', 'mkv'
        }
        
        # Supported image formats
        self.supported_image_formats = {
            'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'
        }
    
    def validate_audio_file(self, file_content: bytes, filename: str) -> Tuple[bool, str]:
        """
        Validate audio file using multiple methods.
        
        Args:
            file_content: Raw file content
            filename: Original filename
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Method 1: Check file extension
            extension = self._get_file_extension(filename)
            if not extension:
                return False, "No file extension found"
            
            if extension.lower() not in self.supported_audio_formats:
                return False, f"Unsupported audio format: {extension}"
            
            # Method 2: Check MIME type
            mime_type = self._get_mime_type(file_content, filename)
            # If MIME type is generic binary, don't fail here; rely on magic bytes and extension.
            # If it's a specific non-audio type (e.g., image/jpeg), then fail.
            if mime_type and not mime_type.startswith('audio/') and mime_type != 'application/octet-stream':
                return False, f"Invalid MIME type for audio file: {mime_type}"
            
            # Method 3: Check magic bytes (file signature)
            # This becomes more important if MIME type was application/octet-stream
            if not self._check_magic_bytes(file_content, AUDIO_SIGNATURES):
                return False, f"File signature does not match audio format: {extension}"
            
            # Method 4: Additional format-specific validation
            if not self._validate_audio_format_specific(file_content, extension):
                return False, f"Format-specific validation failed for: {extension}"
            
            logger.info(f"Audio file validation passed: {filename} ({extension})")
            return True, ""
            
        except Exception as e:
            logger.error(f"Error validating audio file {filename}: {e}")
            return False, f"Validation error: {str(e)}"
    
    def validate_video_file(self, file_content: bytes, filename: str) -> Tuple[bool, str]:
        """
        Validate video file using multiple methods.
        
        Args:
            file_content: Raw file content
            filename: Original filename
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Method 1: Check file extension
            extension = self._get_file_extension(filename)
            if not extension:
                return False, "No file extension found"
            
            if extension.lower() not in self.supported_video_formats:
                return False, f"Unsupported video format: {extension}"
            
            # Method 2: Check MIME type
            mime_type = self._get_mime_type(file_content, filename)
            if mime_type and not mime_type.startswith('video/'):
                return False, f"Invalid MIME type for video file: {mime_type}"
            
            # Method 3: Check magic bytes
            if not self._check_magic_bytes(file_content, VIDEO_SIGNATURES):
                return False, f"File signature does not match video format: {extension}"
            
            logger.info(f"Video file validation passed: {filename} ({extension})")
            return True, ""
            
        except Exception as e:
            logger.error(f"Error validating video file {filename}: {e}")
            return False, f"Validation error: {str(e)}"
    
    def validate_image_file(self, file_content: bytes, filename: str) -> Tuple[bool, str]:
        """
        Validate image file using multiple methods.
        
        Args:
            file_content: Raw file content
            filename: Original filename
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Method 1: Check file extension
            extension = self._get_file_extension(filename)
            if not extension:
                return False, "No file extension found"
            
            if extension.lower() not in self.supported_image_formats:
                return False, f"Unsupported image format: {extension}"
            
            # Method 2: Check MIME type
            mime_type = self._get_mime_type(file_content, filename)
            if mime_type and not mime_type.startswith('image/'):
                return False, f"Invalid MIME type for image file: {mime_type}"
            
            # Method 3: Check magic bytes
            if not self._check_magic_bytes(file_content, IMAGE_SIGNATURES):
                return False, f"File signature does not match image format: {extension}"
            
            logger.info(f"Image file validation passed: {filename} ({extension})")
            return True, ""
            
        except Exception as e:
            logger.error(f"Error validating image file {filename}: {e}")
            return False, f"Validation error: {str(e)}"
    
    def _get_file_extension(self, filename: str) -> Optional[str]:
        """Extract file extension from filename."""
        path = Path(filename)
        return path.suffix.lower().lstrip('.') if path.suffix else None
    
    def _get_mime_type(self, file_content: bytes, filename: str) -> Optional[str]:
        """Get MIME type using python-magic."""
        try:
            # Use python-magic to detect MIME type from content
            mime_type = magic.from_buffer(file_content, mime=True)
            return mime_type
        except Exception as e:
            logger.warning(f"Could not detect MIME type for {filename}: {e}")
            # Fallback to mimetypes module
            try:
                mime_type, _ = mimetypes.guess_type(filename)
                return mime_type
            except Exception:
                return None
    
    def _check_magic_bytes(self, file_content: bytes, signatures: Dict[str, List[bytes]]) -> bool:
        """Check if file content matches any of the expected signatures."""
        if not file_content:
            return False
        
        # Get the first 16 bytes for signature checking
        header = file_content[:16]
        
        for format_name, format_signatures in signatures.items():
            for signature in format_signatures:
                if header.startswith(signature):
                    return True
        
        return False
    
    def _validate_audio_format_specific(self, file_content: bytes, extension: str) -> bool:
        """Perform format-specific validation for audio files."""
        try:
            if extension.lower() == 'mp3':
                # For MP3, check if it has valid MPEG frame headers
                return self._validate_mp3_structure(file_content)
            elif extension.lower() == 'wav':
                # For WAV, check RIFF structure
                return self._validate_wav_structure(file_content)
            elif extension.lower() == 'flac':
                # For FLAC, check fLaC signature and metadata
                return self._validate_flac_structure(file_content)
            else:
                # For other formats, basic signature check is sufficient
                return True
        except Exception as e:
            logger.warning(f"Format-specific validation failed for {extension}: {e}")
            return False
    
    def _validate_mp3_structure(self, file_content: bytes) -> bool:
        """Validate MP3 file structure."""
        if len(file_content) < 10:
            return False
        
        # Skip ID3v2 header if present
        offset = 0
        if file_content.startswith(b'ID3'):
            # ID3v2 header is 10 bytes
            offset = 10
        
        # Check for MPEG frame header
        if offset + 4 > len(file_content):
            return False
        
        # Look for MPEG frame sync (0xFF followed by 0xE0-0xFF)
        for i in range(offset, min(offset + 100, len(file_content) - 1)):
            if file_content[i] == 0xFF and (file_content[i + 1] & 0xE0) == 0xE0:
                return True
        
        return False
    
    def _validate_wav_structure(self, file_content: bytes) -> bool:
        """Validate WAV file structure."""
        if len(file_content) < 12:
            return False
        
        # Check RIFF header
        if not file_content.startswith(b'RIFF'):
            return False
        
        # Check WAVE signature
        if file_content[8:12] != b'WAVE':
            return False
        
        return True
    
    def _validate_flac_structure(self, file_content: bytes) -> bool:
        """Validate FLAC file structure."""
        if len(file_content) < 4:
            return False
        
        # Check fLaC signature
        if not file_content.startswith(b'fLaC'):
            return False
        
        return True

# Global instance for reuse
file_validator = FileValidator()
