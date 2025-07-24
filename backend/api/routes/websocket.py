"""
WebSocket routes for real-time communication.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Cookie
from fastapi.security import HTTPBearer, HTTPBasic, HTTPBasicCredentials
from typing import Dict, List, Optional
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
        self.connection_data: Dict[WebSocket, Dict] = {}
    
    async def connect(self, websocket: WebSocket, user: Optional[str] = None):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        is_authorized = user is not None
        self.connection_data[websocket] = {
            "is_authorized": is_authorized,
            "user": user,
            "connected_at": asyncio.get_event_loop().time()
        }
        logger.info(f"WebSocket client connected. User: {user}, Authorized: {is_authorized}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        client_data = self.connection_data.pop(websocket, {})
        logger.info(f"WebSocket client disconnected. User: {client_data.get('user')}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific WebSocket."""
        try:
            await websocket.send_text(message)
        except (WebSocketDisconnect, OSError) as e:
            logger.error(f"WebSocket error: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: str, authorized_only: bool = False):
        """Broadcast a message to all connected (and optionally, authorized) WebSockets."""
        disconnected = []
        for connection, data in self.connection_data.items():
            if authorized_only and not data.get("is_authorized"):
                continue
            try:
                await connection.send_text(message)
            except (WebSocketDisconnect, OSError) as e:
                logger.error(f"WebSocket error during broadcast: {e}")
                disconnected.append(connection)
        
        for connection in disconnected:
            self.disconnect(connection)

# Global connection manager
manager = ConnectionManager()

async def get_user_from_cookie(websocket: WebSocket, session: Optional[str] = Cookie(None)) -> Optional[str]:
    """Dependency to get user from session cookie."""
    if not session:
        return None
    # In a real app, you'd decode the session cookie to get the user ID
    # For this example, we'll just use the session value as the user ID
    return session

async def handle_websocket_messages(websocket: WebSocket, handler: callable, user: Optional[str]):
    """Helper function to handle WebSocket messages."""
    await manager.connect(websocket, user)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                is_authorized = manager.connection_data.get(websocket, {}).get("is_authorized", False)
                await handler(websocket, message, is_authorized)
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": "Invalid JSON format"
                    }),
                    websocket
                )
            except Exception as e:
                logger.exception(f"Error in WebSocket handler: {e}")
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
async def websocket_audio_processing(websocket: WebSocket, user: Optional[str] = Depends(get_user_from_cookie)):
    """WebSocket endpoint for real-time audio processing updates."""
    async def audio_handler(websocket, message, is_authorized: bool):
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
    await handle_websocket_messages(websocket, audio_handler, user)

@router.websocket("/video-generation")
async def websocket_video_generation(websocket: WebSocket, user: Optional[str] = Depends(get_user_from_cookie)):
    """WebSocket endpoint for real-time video generation updates."""
    async def video_handler(websocket, message, is_authorized: bool):
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
    await handle_websocket_messages(websocket, video_handler, user)

@router.websocket("/notifications")
async def websocket_notifications(websocket: WebSocket, user: Optional[str] = Depends(get_user_from_cookie)):
    """WebSocket endpoint for general notifications."""
    async def notification_handler(websocket, message, is_authorized: bool):
        if message.get("broadcast"):
            if not is_authorized:
                await manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": "Forbidden: Not authorized to broadcast"
                    }),
                    websocket
                )
                return

            await manager.broadcast(
                json.dumps({
                    "type": "notification",
                    "message": message.get("message"),
                    "timestamp": asyncio.get_event_loop().time()
                }),
                authorized_only=True
            )
        else:
            await manager.send_personal_message(
                json.dumps({
                    "type": "notification_received",
                    "status": "acknowledged"
                }),
                websocket
            )
    await handle_websocket_messages(websocket, notification_handler, user)

# Helper functions for sending updates from other parts of the application

# Helper functions for sending updates from other parts of the application
# No longer using client_id for targeted messages, can use broadcast or specific auth mechanism

async def send_audio_update(update_data: Dict): # Removed client_id
    """Send audio processing update (broadcast for now, or implement client-specific auth)."""
    message = json.dumps({
        "type": "audio_update",
        "data": update_data,
        "timestamp": asyncio.get_event_loop().time()
    })
    await manager.broadcast(message) # Broadcasting to all for simplicity; fine-grained control needs proper client ID management

async def send_video_update(update_data: Dict): # Removed client_id
    """Send video generation update (broadcast for now, or implement client-specific auth)."""
    message = json.dumps({
        "type": "video_update",
        "data": update_data,
        "timestamp": asyncio.get_event_loop().time()
    })
    await manager.broadcast(message) # Broadcasting to all for simplicity; fine-grained control needs proper client ID management

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
