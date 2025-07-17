"""
Asynchronous utilities for running blocking operations in a separate thread.
"""
import asyncio
from typing import Callable, Any, Dict, Tuple

async def run_in_thread(
    blocking_func: Callable[..., Any], 
    *args: Tuple[Any, ...], 
    **kwargs: Dict[str, Any]
) -> Any:
    """
    Run a blocking function in a separate thread to avoid blocking the asyncio event loop.

    Args:
        blocking_func: The synchronous, blocking function to execute.
        *args: Positional arguments to pass to the blocking function.
        **kwargs: Keyword arguments to pass to the blocking function.

    Returns:
        The result of the blocking function.
    """
    return await asyncio.to_thread(blocking_func, *args, **kwargs)