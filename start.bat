@echo off
rem ============================================================
rem  个人记账本 · 一键启动脚本
rem  双击后依次完成：启动后端(127.0.0.1:8000) -> 启动静态服务(5500)
rem  -> 等后端就绪 -> 打开浏览器到记账首页
rem  路径全部以脚本自身所在目录为基准，在任意目录双击都能跑对。
rem ============================================================

rem 脚本本身按 GBK(936) 编码 + CRLF 换行保存，保证 cmd 能正确解析中文
chcp 936 >nul 2>nul
setlocal enableextensions

cd /d "%~dp0"
set "ROOT=%~dp0"
set "PY=%ROOT%.venv\Scripts\python.exe"
set "BACKEND_DIR=%ROOT%backend"
set "PAGE=http://localhost:5500/frontend/index.html"

echo.
echo === 个人记账本 · 一键启动 ===
echo.

rem ---------- 1. 环境检查 ----------
if not exist "%PY%" (
    echo [错误] 没有找到虚拟环境：%PY%
    echo        请先在项目根目录执行下面两条命令：
    echo            python -m venv .venv
    echo            .venv\Scripts\python.exe -m pip install -r backend\requirements.txt
    echo.
    pause
    exit /b 1
)

"%PY%" -c "import fastapi, uvicorn, openpyxl" >nul 2>nul
if errorlevel 1 (
    echo [错误] 虚拟环境缺少依赖：fastapi / uvicorn / openpyxl
    echo        请执行：.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
    echo.
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%\main.py" (
    echo [错误] 没有找到后端入口：%BACKEND_DIR%\main.py
    echo        请确认 start.bat 放在仓库根目录，并保持 backend 目录完整。
    echo.
    pause
    exit /b 1
)

rem ---------- 2. 启动后端 ----------
call :port_listening 8000
if "%LISTENING%"=="1" (
    echo [提示] 8000 端口已有服务在运行，直接复用，不再重复启动后端。
) else (
    echo [启动] 后端服务 http://127.0.0.1:8000
    start "记账本-后端-8000" /D "%BACKEND_DIR%" cmd /k "%PY% -m uvicorn main:app --host 127.0.0.1 --port 8000"
)

rem ---------- 3. 启动静态服务 ----------
rem 必须在仓库根目录起服务，否则 frontend 里 ../img 的图片会 404
call :port_listening 5500
if "%LISTENING%"=="1" (
    echo [提示] 5500 端口已有服务在运行，直接复用，不再重复启动静态服务。
) else (
    echo [启动] 前端静态服务 http://localhost:5500 ，根目录为仓库根目录
    start "记账本-前端-5500" /D "%ROOT%" cmd /k "%PY% -m http.server 5500"
)

rem ---------- 4. 等后端就绪后打开浏览器 ----------
echo [等待] 正在等待后端就绪……
powershell -NoProfile -Command "for($i=0;$i -lt 40;$i++){try{$c=New-Object Net.Sockets.TcpClient;$c.Connect('127.0.0.1',8000);$c.Close();exit 0}catch{Start-Sleep -Milliseconds 500}};exit 1"
if errorlevel 1 (
    echo [警告] 后端 20 秒内仍未就绪，请查看后端服务窗口里的报错。
) else (
    echo [就绪] 后端已启动。
)
echo [打开] %PAGE%
start "" "%PAGE%"

echo.
echo 启动完成：本窗口可以关闭，两个服务继续在各自的窗口运行。
pause
exit /b 0

rem ---------- 子过程：判断指定端口是否已被监听 ----------
:port_listening
set "LISTENING=0"
for /f "tokens=*" %%L in ('netstat -ano ^| findstr /C:":%1 " ^| findstr /C:"LISTENING"') do set "LISTENING=1"
exit /b 0
