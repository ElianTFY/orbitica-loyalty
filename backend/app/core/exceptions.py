from typing import Any
from fastapi import HTTPException, status


class DomainException(Exception):
    def __init__(self, message: str, code: str = "DOMAIN_ERROR", status_code: int = 400, details: Any = None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class NotFoundException(DomainException):
    def __init__(self, message: str = "Recurso no encontrado.", code: str = "NOT_FOUND"):
        super().__init__(message=message, code=code, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedException(DomainException):
    def __init__(self, message: str = "No autorizado.", code: str = "UNAUTHORIZED"):
        super().__init__(message=message, code=code, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(DomainException):
    def __init__(self, message: str = "No ten?s permiso para esta acci?n.", code: str = "FORBIDDEN"):
        super().__init__(message=message, code=code, status_code=status.HTTP_403_FORBIDDEN)


class ConflictException(DomainException):
    def __init__(self, message: str = "Conflicto con recurso existente.", code: str = "CONFLICT"):
        super().__init__(message=message, code=code, status_code=status.HTTP_409_CONFLICT)


class ValidationException(DomainException):
    def __init__(self, message: str = "Datos inv?lidos.", code: str = "VALIDATION_ERROR", details: Any = None):
        super().__init__(message=message, code=code, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, details=details)
