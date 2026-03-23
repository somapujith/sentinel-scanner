# Use a lightweight Python base image
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory for the app
WORKDIR /app

# Install basic networking and build tools (helpful for security scan logic)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend source code
COPY . .

# Expose port (FastAPI default, but Railway will detect $PORT)
EXPOSE 8080

# Start command with production-ready uvicorn settings
#
# Railway (and many PaaS) provide the listening port via $PORT.
# Use it when present, otherwise fall back to 8080 for local/docker usage.
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
