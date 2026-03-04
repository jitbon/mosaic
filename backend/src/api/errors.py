from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


class NotFoundException(AppException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=404, detail=detail)


class RateLimitException(AppException):
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(status_code=429, detail=detail)


class ExternalServiceException(AppException):
    def __init__(self, detail: str = "External service unavailable"):
        super().__init__(status_code=502, detail=detail)


async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )
