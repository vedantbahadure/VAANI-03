"""Application error hierarchy + FastAPI handlers -> consistent JSON."""
from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    code = "app_error"
    status = 400

    def __init__(self, detail: str = ""):
        self.detail = detail
        super().__init__(detail)


class NotFoundError(AppError):
    code = "not_found"
    status = 404


class ValidationError(AppError):
    code = "validation_error"
    status = 422


class UpstreamError(AppError):
    code = "upstream_error"
    status = 502


class UnavailableError(AppError):
    code = "unavailable"
    status = 503


def register_error_handlers(app):
    @app.exception_handler(AppError)
    async def _handle(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status,
            content={"error": exc.code, "code": exc.code, "detail": exc.detail},
        )
