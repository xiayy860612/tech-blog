---
title: FastAPI 实践
date: 2025-12-23 20:00:00
categories:
- backend
tags:
- backend
- web
- FastAPI
---

快速了解 FastAPI 进行 http web 开发的常用特性。

<!--more-->

## 配置管理

FastAPI 深度集成了 Pydantic。通过 `pydantic-settings` 库，你可以定义一个配置类，它会自动读取环境变量和 .env 文件。

```bash
pip install pydantic-settings
```

创建 `.env` 文件来配置变量：

```env
ADMIN_EMAIL="deadpool@example.com"
APP_NAME="ChimichangApp"
```

### 创建 Settings 对象

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Awesome API"
    admin_email: str
    items_per_user: int = 50

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
```

### 在依赖中使用 Settings

```python
from functools import lru_cache
from typing import Annotated
from fastapi import Depends, FastAPI

@lru_cache
def get_settings():
    return Settings()

@app.get("/info")
async def info(settings: Annotated[Settings, Depends(get_settings)]):
    return {
        "app_name": settings.app_name,
        "admin_email": settings.admin_email,
        "items_per_user": settings.items_per_user,
    }
```

使用 `@lru_cache` 装饰器可以避免每次请求都重新读取 `.env` 文件，同时保持测试时可以轻松覆盖依赖。

## 服务的启动和关闭

推荐使用 `lifespan` 上下文管理器来管理**服务启动后的初始化操作和关闭前的清理操作**：

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import httpx

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行相关的初始化操作
    ...
    yield
    # 关闭时执行相关的清理操作

app = FastAPI(lifespan=lifespan)
```

## 路由

FastAPI 一般使用使用 `APIRouter` 将路由分组到不同的模块中。

**APIRouter 支持的参数**：

- `prefix`：路径前缀
- `tags`：用于文档分组
- `dependencies`：应用于所有路由的依赖
- `responses`：额外的响应定义
- `deprecated`：标记所有路由为已废弃

```python
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_token_header)],
    responses={418: {"description": "I'm a teapot"}},
)
```

### 创建路由模块

```python
# app/routers/items.py
from fastapi import APIRouter

router = APIRouter(
    prefix="/items",
    tags=["items"],
)

@router.get("/")
async def read_items():
    return [{"item_id": "Foo"}, {"item_id": "Bar"}]

@router.get("/{item_id}")
async def read_item(item_id: str):
    return {"item_id": item_id}
```

### 在主应用中注册路由

```python
# app/main.py
from fastapi import FastAPI
from .routers import items

app = FastAPI()

app.include_router(items.router)
```

## 拦截器

FastAPI 主要提供两种方式对请求进行拦截，中间件和依赖注入。

| 特性 | 中间件 | 依赖注入 |
|------|--------|------|
| 执行时机 | 所有请求 | 指定路由 |
| 返回值 | 不能直接返回响应 | 可以返回值给路径操作 |
| 使用场景 | 日志、CORS、请求时间等 | 认证、数据库连接、权限验证等 |

### 中间件

FastAPI 主要使用中间件（Middleware）在**请求处理的前后**做一些额外的工作。

```python
import time
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

**中间件执行顺序**：后添加的中间件先执行（洋葱模型）：

```python
app.add_middleware(MiddlewareA)  # 最内层
app.add_middleware(MiddlewareB)  # 最外层

# 请求路径：MiddlewareB -> MiddlewareA -> 路由处理函数
# 响应路径：路由处理函数 -> MiddlewareA -> MiddlewareB
```

### 依赖注入 (Dependencies)

依赖注入系统允许你声明**请求处理函数**需要依赖的组件，FastAPI 会自动注入这些依赖。

```python
from typing import Annotated
from fastapi import Depends, FastAPI

async def common_parameters(q: str | None = None, skip: int = 0, limit: int = 100):
    return {"q": q, "skip": skip, "limit": limit}

@app.get("/items/")
async def read_items(commons: Annotated[dict, Depends(common_parameters)]):
    return commons

@app.get("/users/")
async def read_users(commons: Annotated[dict, Depends(common_parameters)]):
    return commons
```

#### 类作为依赖

```python
from typing import Annotated
from fastapi import Depends, FastAPI

class CommonParams:
    def __init__(self, q: str | None = None, skip: int = 0, limit: int = 100):
        self.q = q
        self.skip = skip
        self.limit = limit

@app.get("/items/")
async def read_items(commons: Annotated[CommonParams, Depends(CommonParams)]):
    response = {}
    if commons.q:
        response.update({"q": commons.q})
    items = fake_items_db[commons.skip : commons.skip + commons.limit]
    response.update({"items": items})
    return response
```

#### 子依赖

依赖可以有自己的依赖，形成依赖层次结构：

```python
def query_extractor(q: str | None = None):
    return q

def query_or_cookie_extractor(
    q: Annotated[str, Depends(query_extractor)],
    last_query: str | None = None,
):
    if not q:
        return last_query
    return q

@app.get("/items/")
async def read_query(
    query_ref: Annotated[str, Depends(query_or_cookie_extractor)]
):
    return {"query_ref": query_ref}
```

#### 带有 yield 的依赖

使用 `yield` 可以在**依赖完成后执行清理操作**：

```python
from fastapi import Depends

async def get_db():
    db = DBSession()
    try:
        yield db
    finally:
        db.close()
```

#### 全局依赖

可以为整个应用添加全局依赖：

```python
app = FastAPI(dependencies=[Depends(verify_token), Depends(verify_key)])
```

## 请求处理

FastAPI 提供了多种方式处理请求体、请求头、Cookie 等请求数据。

### 参数解析

#### 路径参数

路径参数是 URL 路径的一部分，使用花括号 `{}` 语法定义：

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id}
```

**类型转换与验证**：FastAPI 会自动将路径参数转换为声明的类型并进行验证。

```python
# 访问 /items/foo 会返回 422 错误，因为 foo 不是 int
# 访问 /items/3 会返回 {"item_id": 3}
```

**路径参数顺序很重要**：固定路径必须在动态路径之前：

```python
@app.get("/users/me")
async def read_user_me():
    return {"user_id": "the current user"}

@app.get("/users/{user_id}")
async def read_user(user_id: str):
    return {"user_id": user_id}
```

#### 查询参数

查询参数 query-string 是 URL 中 `?` 后面的键值对，用 `&` 分隔：

```python
@app.get("/items/")
async def read_item(skip: int = 0, limit: int = 10):
    return {"skip": skip, "limit": limit}
```

**可选参数**：设置默认值为 `None` 使参数可选：

```python
@app.get("/items/{item_id}")
async def read_item(item_id: str, q: str | None = None):
    if q:
        return {"item_id": item_id, "q": q}
    return {"item_id": item_id}
```

**必需参数**：不设置默认值即可：

```python
@app.get("/items/{item_id}")
async def read_user_item(item_id: str, needy: str):
    return {"item_id": item_id, "needy": needy}
```

#### 请求体 (Request Body)

继承 Pydantic 的 `BaseModel` 来创建请求体：

```python
from pydantic import BaseModel
from fastapi import FastAPI

app = FastAPI()

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None

@app.post("/items/")
async def create_item(item: Item):
    return item
```

##### 嵌套模型

Pydantic 模型可以嵌套：

```python
class Image(BaseModel):
    url: str
    name: str

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None
    tags: list[str] = []
    image: Image | None = None

@app.post("/items/")
async def create_item(item: Item):
    return item
```

#### 表单数据 (Form Data)

处理表单数据需要安装 `python-multipart`：

```bash
pip install python-multipart
```

```python
from fastapi import Form

@app.post("/login/")
async def login(username: str = Form(), password: str = Form()):
    return {"username": username}
```

#### 文件上传 (Upload File)

```python
from fastapi import UploadFile, File

@app.post("/files/")
async def create_file(file: UploadFile = File(...)):
    return {"filename": file.filename}

@app.post("/uploadfiles/")
async def create_upload_files(files: list[UploadFile] = File(...)):
    return {"filenames": [file.filename for file in files]}
```

#### 使用 Request 对象

当需要访问原始请求数据时，可以直接使用 `Request` 对象：

```python
from fastapi import Request

@app.get("/items/{item_id}")
async def read_item_root(item_id: str, request: Request):
    client_host = request.client.host
    return {"item_id": item_id, "client_host": client_host}
```

### 参数校验

FastAPI 允许你为参数声明额外的校验信息。

#### 请求体字段校验

使用 `Field` 为请求体字段添加验证：

```python
from pydantic import BaseModel, Field

class Item(BaseModel):
    name: str
    description: str | None = Field(
        default=None, title="The description", max_length=300
    )
    price: float = Field(gt=0, description="The price must be greater than zero")
    tax: float | None = None
```

#### 查询参数校验

使用 `Query` 为查询参数添加校验：

```python
from typing import Annotated
from fastapi import FastAPI, Query

app = FastAPI()

@app.get("/items/")
async def read_items(
    q: Annotated[str | None, Query(min_length=3, max_length=50)] = None
):
    results = {"items": [{"item_id": "Foo"}, {"item_id": "Bar"}]}
    if q:
        results.update({"q": q})
    return results
```

**常用字符串验证参数**：

| 参数 | 说明 |
|------|------|
| `min_length` | 最小长度 |
| `max_length` | 最大长度 |
| `pattern` | 正则表达式模式 |
| `alias` | 参数别名 |
| `title` | 参数标题（用于文档） |
| `description` | 参数描述（用于文档） |
| `deprecated` | 标记为已废弃 |

```python
from typing import Annotated
from fastapi import Query

@app.get("/items/")
async def read_items(
    q: Annotated[
        str | None,
        Query(
            title="Query string",
            description="Query string for the items to search",
            min_length=3,
            max_length=50,
            pattern="^fixedquery$",
            deprecated=True,
        ),
    ] = None,
):
    return {"q": q}
```

#### 路径参数校验

使用 `Path` 为路径参数添加数值校验：

```python
from typing import Annotated
from fastapi import Path

@app.get("/items/{item_id}")
async def read_items(
    item_id: Annotated[int, Path(title="The ID of the item", ge=1)]
):
    results = {"item_id": item_id}
    return results
```

**常用数值验证参数**：

| 参数 | 说明 |
|------|------|
| `gt` | 大于 (greater than) |
| `ge` | 大于等于 (greater than or equal) |
| `lt` | 小于 (less than) |
| `le` | 小于等于 (less than or equal) |

```python
@app.get("/items/{item_id}")
async def read_items(
    item_id: Annotated[int, Path(ge=0, le=1000)],
    size: Annotated[float, Query(gt=0, lt=10.5)],
):
    return {"item_id": item_id, "size": size}
```

#### 自定义校验

使用 Pydantic 的 `AfterValidator` 进行自定义验证：

```python
from typing import Annotated
from pydantic import AfterValidator

def check_valid_id(id: str):
    if not id.startswith(("isbn-", "imdb-")):
        raise ValueError('Invalid ID format, must start with "isbn-" or "imdb-"')
    return id

@app.get("/items/")
async def read_items(
    id: Annotated[str | None, AfterValidator(check_valid_id)] = None
):
    return {"id": id}
```

## Exception处理

FastAPI 中默认异常处理器在 `fastapi.exception_handlers` 包中，可以通过自定义异常处理器覆盖以及扩展异常处理。

### 自定义异常处理器

使用 `@app.exception_handler()` 装饰器创建自定义异常处理器：

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

class UnicornException(Exception):
    def __init__(self, name: str):
        self.name = name

app = FastAPI()

@app.exception_handler(UnicornException)
async def unicorn_exception_handler(request: Request, exc: UnicornException):
    return JSONResponse(
        status_code=418,
        content={"message": f"Oops! {exc.name} did something."},
    )

@app.get("/unicorns/{name}")
async def read_unicorn(name: str):
    if name == "yolo":
        raise UnicornException(name=name)
    return {"unicorn_name": name}
```

### 覆盖 HTTPException 处理器

```python
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    message = "Validation errors:\n"
    for error in exc.errors():
        message += f"Field: {error['loc']}, Error: {error['msg']}\n"
    return PlainTextResponse(message, status_code=400)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return PlainTextResponse(str(exc.detail), status_code=exc.status_code)
```

## 统一 Response

FastAPI 通过响应模型来定义 Response data，
为了安全起见，应该为输入和输出使用不同的模型。

### 响应模型

使用 `response_model` 参数声明返回的数据模型：

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None

@app.post("/items/", response_model=Item)
async def create_item(item: Item):
    return item
```

响应模型参数：

| 参数 | 说明 |
| --- | --- |
| `response_model` | 响应模型 |
| `response_model_exclude_unset` | 排除未设置的字段 |
| `response_model_exclude_defaults` | 排除默认值字段 |
| `response_model_exclude_none` | 排除 None 值 |
| `response_model_include` | 仅包含指定字段 |
| `response_model_exclude` | 排除指定字段 |

```python
@app.get(
    "/items/{item_id}/public",
    response_model=Item,
    response_model_exclude={"tax"},  # 排除 tax 字段
)
async def read_item_public_data(item_id: str):
    return items[item_id]
```

### 统一响应格式

创建统一的 API 响应格式：

```python
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None

@app.get("/items/{item_id}", response_model=ApiResponse[Item])
async def read_item(item_id: str):
    item = items_db.get(item_id)
    if item:
        return ApiResponse(data=item)
    return ApiResponse(code=404, message="Item not found")
```

## 异步任务处理

### BackgroundTasks

`BackgroundTasks` 用来处理本地执行的异步任务。

- 任务函数可以是**普通函数或异步函数**。
- 可以添加多个后台任务，它们将按**添加顺序执行**。
- 进程重启后任务丢失。

```python
from fastapi import BackgroundTasks, FastAPI

app = FastAPI()

def write_notification(email: str, message=""):
    """普通函数"""
    with open("log.txt", mode="w") as email_file:
        content = f"notification for {email}: {message}"
        email_file.write(content)

# async def write_notification_async(email: str, message=""):
#     """异步函数"""
#     with open("log.txt", mode="w") as email_file:
#         content = f"notification for {email}: {message}"
#         email_file.write(content)

@app.post("/send-notification/{email}")
async def send_notification(email: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(write_log, f"Notification for {email}")
    background_tasks.add_task(write_notification, email, message="some notification")
    return {"message": "Notification sent in the background"}
```

### Celery

对于需要更强大后台任务处理的场景，可以考虑使用 Celery。

```python
# 需要安装 celery
# pip install celery

from celery import Celery

celery_app = Celery("tasks", broker="redis://localhost:6379/0")

@celery_app.task
def process_heavy_task(data_id: str):
    # 耗时操作
    time.sleep(10)
    return f"Processed {data_id}"

@app.post("/process/{data_id}")
async def process_data(data_id: str):
    process_heavy_task.delay(data_id)  # 异步执行
    return {"message": "Task started"}
```

## RPC 调用

### 使用 httpx 进行 HTTP 调用

httpx 是一个现代化的 HTTP 客户端，支持同步和异步请求：

```python
import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.get("/users/{user_id}")
async def get_user(user_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"http://user-service/users/{user_id}")
        if response.status_code == 200:
            return response.json()
        raise HTTPException(status_code=response.status_code)
```

### 使用 Lifespan 管理客户端

推荐使用 `lifespan` 上下文管理器来管理客户端生命周期：

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import httpx

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时创建
    app.state.http_client = httpx.AsyncClient(
        base_url="http://user-service",
        timeout=30.0,
    )
    yield
    # 关闭时清理
    await app.state.http_client.aclose()

app = FastAPI(lifespan=lifespan)

@app.get("/users/{user_id}")
async def get_user(user_id: str):
    client = app.state.http_client
    response = await client.get(f"/users/{user_id}")
    return response.json()
```

### gRPC 调用

对于高性能 RPC 场景，可以使用 gRPC：

```python
# 需要安装: pip install grpclib protobuf
import grpc
from grpc.experimental import aio as aio_grpc
import your_pb2
import your_pb2_grpc

@app.get("/grpc-user/{user_id}")
async def get_grpc_user(user_id: str):
    async with aio_grpc.insecure_channel("localhost:50051") as channel:
        stub = your_pb2_grpc.UserServiceStub(channel)
        request = your_pb2.UserRequest(user_id=user_id)
        response = await stub.GetUser(request)
        return {
            "user_id": response.user_id,
            "name": response.name,
            "email": response.email,
        }
```

### 总结

| 方式 | 适用场景 | 优点 | 缺点 |
| --- | --- | --- | --- |
| httpx | REST API 调用 | 简单易用，异步支持好 | HTTP 协议开销 |
| gRPC | 内部微服务 | 高性能，类型安全 | 需要定义 proto 文件 |
| 消息队列 | 异步通信 | 解耦，削峰填谷 | 延迟较高，需要中间件 |

## Reference

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
