class MonograuviBaseException(Exception):
    """
    Base exception class for Monograuvi application specific errors.
    Allows for a consistent structure for custom errors.
    """
    def __init__(self, message: str, status_code: int = 400, error_code: str = "APP_ERROR"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(message)

# Example of a more specific custom exception inheriting from the base
class InvalidOperationException(MonograuviBaseException):
    def __init__(self, message: str = "The requested operation is invalid in the current state."):
        super().__init__(message=message, status_code=409, error_code="INVALID_OPERATION")

class ResourceNotFoundException(MonograuviBaseException):
    def __init__(self, resource_name: str, resource_id: str | int):
        message = f"{resource_name} with ID '{resource_id}' not found."
        super().__init__(message=message, status_code=404, error_code="RESOURCE_NOT_FOUND")

# You can add more specific exceptions here as your application grows.
# For example:
# class AuthenticationFailedException(MonograuviBaseException):
#     def __init__(self, message: str = "Authentication failed."):
#         super().__init__(message=message, status_code=401, error_code="AUTH_FAILED")

# class PermissionDeniedException(MonograuviBaseException):
#     def __init__(self, message: str = "Permission denied."):
#         super().__init__(message=message, status_code=403, error_code="PERMISSION_DENIED")
