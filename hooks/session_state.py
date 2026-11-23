#!/usr/bin/env python3
"""外置临时会话状态机与轻量遥测（不污染业务 Git 工作区）。"""
from __future__ import annotations

import hashlib
import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any


def state_file_path(session_id: str) -> Path:
    safe_id = hashlib.sha256(session_id.encode("utf-8")).hexdigest()[:16]
    return Path(tempfile.gettempdir()) / f"ai-spec-hook-state-{safe_id}.json"


def default_state() -> dict[str, Any]:
    return {
        "mode": "WRITE",
        "detail_requested": False,
        "dirty_files": [],
        "tests_verified": True,
        "checked_hashes": {},
        "retry_counts": {},
        "telemetry": [],
    }


def load_state(session_id: str) -> dict[str, Any]:
    p = state_file_path(session_id)
    if not p.is_file():
        return default_state()
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        base = default_state()
        base.update(data)
        return base
    except (OSError, ValueError):
        return default_state()


def save_state(session_id: str, state: dict[str, Any]) -> None:
    p = state_file_path(session_id)
    tmp = p.with_suffix(f".{os.getpid()}.tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, p)


def file_sha256(path: str) -> str:
    try:
        return hashlib.sha256(Path(path).read_bytes()).hexdigest()[:16]
    except OSError:
        return ""


def record_block(state: dict[str, Any], rule_id: str, file_path: str) -> int:
    key = f"{rule_id}:{file_path}"
    count = int(state["retry_counts"].get(key, 0)) + 1
    state["retry_counts"][key] = count
    state["telemetry"].append({
        "ts": int(time.time()),
        "event": "block",
        "ruleId": rule_id,
        "file": os.path.basename(file_path),
        "attempt": count,
    })
    # 仅保留最近 50 条遥测防止状态文件膨胀
    state["telemetry"] = state["telemetry"][-50:]
    return count


def clear_retries_for_file(state: dict[str, Any], file_path: str) -> None:
    suffix = f":{file_path}"
    state["retry_counts"] = {k: v for k, v in state["retry_counts"].items() if not k.endswith(suffix)}
