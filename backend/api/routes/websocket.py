"""
WebSocket routes for real-time communication.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from typing import Dict, List
import json
import logging
import asyncio
import time

from core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        # Removed redundant active_connections list
        self.connection_data: Dict[WebSocket, Dict] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str = None):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.connection_data[websocket] = {
            "client_id": client_id,
            "connected_at": asyncio.get_event_loop().time()
        }
        logger.info(f"WebSocket client connected: {client_id}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
# Simplified removal as active_connections is removed
        client_data = self.connection_data.pop(websocket, {})
        client_id = client_data.get("client_id", "unknown")
        logger.info(f"WebSocket client disconnected: {client_id}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific WebSocket."""
        try:
            await websocket.send_text(message)
        except (WebSocketDisconnect, OSError) as e:
            logger.error(f"WebSocket error: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: str):
        """Broadcast a message to all connected WebSockets."""
        disconnected = []
        for connection in self.connection_data.keys():
            try:
                await connection.send_text(message)
            except (WebSocketDisconnect, OSError) as e:
                logger.error(f"WebSocket error during broadcast: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected websockets
        for connection in disconnected:
            self.disconnect(connection)
    
    async def send_to_client(self, client_id: str, message: str):
        """Send a message to a specific client by ID."""
        sent = False
        for websocket, data in self.connection_data.items():
            if data.get("client_id") == client_id:
                await self.send_personal_message(message, websocket)
                sent = True
        return sent

# Global connection manager
manager = ConnectionManager()

async def handle_websocket_messages(websocket: WebSocket, client_id: str, handler: callable):
    """Helper function to handle WebSocket messages."""
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                await handler(websocket, message)
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": "Invalid JSON format"
                    }),
                    websocket
                )
            except Exception as e:
                logger.exception(f"Error in WebSocket handler for client {client_id}: {e}")
                await manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": "An internal error occurred."
                    }),
                    websocket
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.websocket("/audio-processing")
async def websocket_audio_processing(websocket: WebSocket, client_id: str = "anonymous"):
    """WebSocket endpoint for real-time audio processing updates."""
    async def audio_handler(websocket, message):
        message_type = message.get("type")
        if message_type == "ping":
            await manager.send_personal_message(
                json.dumps({"type": "pong", "timestamp": message.get("timestamp")}),
                websocket
            )
        elif message_type == "audio_progress":
            progress = message.get("progress", 0)
            await manager.send_personal_message(
                json.dumps({
                    "type": "audio_progress_ack",
                    "progress": progress,
                    "status": "received"
                }),
                websocket
            )
        elif message_type == "subscribe_updates":
            update_types = message.get("update_types", [])
            manager.connection_data[websocket]["subscriptions"] = update_types
            await manager.send_personal_message(
                json.dumps({
                    "type": "subscription_confirmed",
                    "update_types": update_types
                }),
                websocket
            )
        else:
            await manager.send_personal_message(
                json.dumps({
                    "type": "echo",
                    "original_message": message
                }),
                websocket
            )
    await handle_websocket_messages(websocket, client_id, audio_handler)

@router.websocket("/video-generation")
async def websocket_video_generation(websocket: WebSocket, client_id: str = "anonymous"):
    """WebSocket endpoint for real-time video generation updates."""
    async def video_handler(websocket, message):
        message_type = message.get("type")
        if message_type == "video_progress":
            progress = message.get("progress", 0)
            frame_count = message.get("frame_count", 0)
            await manager.send_personal_message(
                json.dumps({
                    "type": "video_progress_update",
                    "progress": progress,
                    "frame_count": frame_count,
                    "status": "processing"
                }),
                websocket
            )
        elif message_type == "video_complete":
            video_path = message.get("video_path")
            await manager.send_personal_message(
                json.dumps({
                    "type": "video_generation_complete",
                    "video_path": video_path,
                    "status": "complete"
                }),
                websocket
            )
        else:
            await manager.send_personal_message(
                json.dumps({
                    "type": "echo",
                    "original_message": message
                }),
                websocket
            )
    await handle_websocket_messages(websocket, client_id, video_handler)

@router.websocket("/notifications")
async def websocket_notifications(websocket: WebSocket, client_id: str = "anonymous"):
    """WebSocket endpoint for general notifications."""
    async def notification_handler(websocket, message):
        if message.get("broadcast"):
            # Ensure only authorized clients can broadcast
            # NOTE: A proper token-based authentication mechanism should be implemented here.
            # This check is currently non-functional as 'is_authorized' is never set.
            connection_info = manager.connection_data.get(websocket, {})
            if not connection_info.get("is_authorized", False):
                await manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": "Unauthorized broadcast attempt"
                    }),
                    websocket
                )
                return
            await manager.broadcast(
                json.dumps({
                    "type": "notification",
                    "from": client_id,
                    "message": message.get("message"),
                    "timestamp": asyncio.get_event_loop().time()
                })
            )
        else:
            await manager.send_personal_message(
                json.dumps({
                    "type": "notification_received",
                    "status": "acknowledged"
                }),
                websocket
            )
    await handle_websocket_messages(websocket, client_id, notification_handler)

# Helper functions for sending updates from other parts of the application

async def send_audio_update(client_id: str, update_data: Dict):
    """Send audio processing update to a specific client."""
    message = json.dumps({
        "type": "audio_update",
        "data": update_data,
        "timestamp": asyncio.get_event_loop().time()
    })
    await manager.send_to_client(client_id, message)

async def send_video_update(client_id: str, update_data: Dict):
    """Send video generation update to a specific client."""
    message = json.dumps({
        "type": "video_update",
        "data": update_data,
        "timestamp": asyncio.get_event_loop().time()
    })
    await manager.send_to_client(client_id, message)

async def broadcast_system_notification(notification: str):
    """Broadcast a system notification to all connected clients."""
    message = json.dumps({
        "type": "system_notification",
        "message": notification,
        "timestamp": asyncio.get_event_loop().time()
    })
    await manager.broadcast(message)

# Endpoint to get connection statistics
security = HTTPBasic()

def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != settings.ADMIN_USERNAME or credentials.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/stats", dependencies=[Depends(authenticate)])
async def get_websocket_stats():
    """Get WebSocket connection statistics. Requires authentication."""
    return {
        "active_connections": len(manager.connection_data),
        "connection_details": [
            {
                "client_id": data.get("client_id"),
                "connected_at": data.get("connected_at")
            }
            for data in manager.connection_data.values()
        ]
    }
