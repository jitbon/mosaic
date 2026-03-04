import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("mosaic.api")


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Unhandled error for %s %s", request.method, request.url.path)
            raise

        duration_ms = (time.time() - start_time) * 1000

        if duration_ms > 2000:
            logger.warning(
                "Slow request: %s %s took %.0fms",
                request.method,
                request.url.path,
                duration_ms,
            )

        logger.info(
            "%s %s %d (%.0fms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )

        return response
