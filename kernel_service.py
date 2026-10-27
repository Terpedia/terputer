"""Single-user Jupyter kernel service for a Terputer Codespace."""
import asyncio
import re
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from jupyter_client import KernelManager

manager: KernelManager | None = None
client: Any = None
execution_lock = asyncio.Lock()
workspace_root = Path(__file__).resolve().parent

@asynccontextmanager
async def lifespan(_: FastAPI):
    global manager, client
    manager = KernelManager(kernel_name="python3")
    manager.start_kernel()
    client = manager.blocking_client()
    client.start_channels()
    client.wait_for_ready(timeout=30)
    yield
    if manager:
        manager.shutdown_kernel(now=True)

app = FastAPI(title="Terputer Codespace Kernel", lifespan=lifespan)

class Execution(BaseModel):
    code: str = Field(min_length=1, max_length=200_000)
    timeout_seconds: int = Field(default=20, ge=1, le=30)
    working_directory: str | None = None

@app.get("/api/kernel/status")
async def status():
    return {"connected": bool(manager and manager.is_alive()), "kernel": "python3"}

@app.post("/api/kernel/execute")
async def execute(request: Execution):
    if not client or not manager or not manager.is_alive():
        raise HTTPException(status_code=503, detail="Python kernel is unavailable")
    code = request.code
    if request.working_directory is not None:
        if request.working_directory != "." and not re.fullmatch(r"projects/[a-z0-9][a-z0-9-]*", request.working_directory):
            raise HTTPException(status_code=400, detail="Working directory must be the workspace or a research project submodule.")
        target = (workspace_root / request.working_directory).resolve()
        projects_root = (workspace_root / "projects").resolve()
        if target != workspace_root and not target.is_relative_to(projects_root):
            raise HTTPException(status_code=400, detail="Working directory is outside the workspace research projects.")
        if not target.is_dir():
            raise HTTPException(status_code=404, detail="Working directory is not initialized in this Codespace.")
        code = f"import os as _terputer_os\n_terputer_os.chdir({str(target)!r})\n" + code
    async with execution_lock:
        msg_id = client.execute(code, allow_stdin=False, stop_on_error=True)
        deadline = time.monotonic() + request.timeout_seconds
        output: list[dict[str, str]] = []
        while time.monotonic() < deadline:
            try:
                message = await asyncio.to_thread(client.get_iopub_msg, timeout=max(0.1, min(1.0, deadline - time.monotonic())))
            except Exception:
                continue
            if message.get("parent_header", {}).get("msg_id") != msg_id:
                continue
            content = message.get("content", {})
            kind = message.get("msg_type")
            if kind == "stream":
                output.append({"type": "stream", "text": content.get("text", "")})
            elif kind in ("execute_result", "display_data"):
                data = content.get("data", {})
                output.append({"type": "result", "text": data.get("text/plain", "[Rich output available in Jupyter]")})
            elif kind == "error":
                output.append({"type": "error", "text": "\n".join(content.get("traceback", []))})
            elif kind == "status" and content.get("execution_state") == "idle":
                return {"status": "error" if any(x["type"] == "error" for x in output) else "ok", "output": output}
        return {"status": "timeout", "output": output, "message": "Execution timed out; the kernel may still be busy."}
