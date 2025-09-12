# AI-Buyer Backend Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM python:3.11-slim as builder

# Set build arguments
ARG ENVIRONMENT=production

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    cmake \
    curl \
    wget \
    git \
    pkg-config \
    libhdf5-dev \
    libopenblas-dev \
    liblapack-dev \
    gfortran \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt pyproject.toml ./

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install build dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install additional ML dependencies based on environment
RUN if [ "$ENVIRONMENT" = "production" ]; then \
    pip install --no-cache-dir gunicorn uvloop; \
    fi

# Production stage
FROM python:3.11-slim as production

# Install runtime system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    libgomp1 \
    libhdf5-103 \
    libopenblas0 \
    liblapack3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r aibuyer && useradd -r -g aibuyer aibuyer

# Set work directory
WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs models data/temp && \
    chown -R aibuyer:aibuyer /app

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Switch to non-root user
USER aibuyer

# Expose port
EXPOSE 8000

# Default command for production
CMD ["gunicorn", "api.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "info"]

# Development stage
FROM production as development

# Switch back to root for development dependencies
USER root

# Install development dependencies
RUN pip install --no-cache-dir \
    pytest \
    pytest-asyncio \
    pytest-cov \
    black \
    isort \
    flake8 \
    mypy \
    pre-commit

# Install additional development tools
RUN apt-get update && apt-get install -y \
    vim \
    htop \
    net-tools \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set development environment
ENV ENVIRONMENT=development
ENV DEBUG=true

# Switch back to non-root user
USER aibuyer

# Development command with auto-reload
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--log-level", "debug"]