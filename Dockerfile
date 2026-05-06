FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

# Pull a pinned uv binary from the official image — fast, deterministic, no pip install of pip.
COPY --from=ghcr.io/astral-sh/uv:0.10 /uv /usr/local/bin/

WORKDIR /app

# Project metadata + lockfile + readme (referenced by pyproject.toml's `readme = "README.md"`).
COPY pyproject.toml uv.lock README.md LICENSE ./
COPY radar/ ./radar/
COPY profiles/ ./profiles/
COPY scripts/ ./scripts/
COPY schema.sql ./

RUN uv sync --frozen --no-dev

RUN useradd --create-home --uid 1000 radar \
    && chown -R radar:radar /app
USER radar

# Healthcheck: import the package to confirm the interpreter is alive.
# The scraper is network-bound and has no HTTP endpoint to probe.
HEALTHCHECK --interval=5m --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import radar; print(radar.__version__)" || exit 1

ENTRYPOINT ["python", "-m", "radar"]
CMD ["run"]
