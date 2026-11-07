"""个人记账本 FastAPI 启动入口。

模块负责人：成员 A（项目集成）。

启动方式（在 backend/ 目录）：
    uvicorn main:app --reload
接口文档：
    http://127.0.0.1:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.records import router as records_router
from api.statistics import router as statistics_router
from database.init_db import init_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用启动时初始化数据库。"""
    init_database()
    yield


app = FastAPI(
    title="个人记账本 API",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """将 Service 层的 ValueError 统一转换为 400。"""
    return JSONResponse(status_code=400, content={"detail": str(exc)})


app.include_router(records_router)
app.include_router(statistics_router)


@app.get("/api/health", tags=["系统"])
def health_check():
    """健康检查接口。"""
    return {"status": "ok"}
