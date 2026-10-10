# Multi-stage Dockerfile for Janison Assessment Backend (.NET Framework 4.8)
# Using Windows Server Core for .NET Framework 4.8

# Stage 1: Build stage
FROM mcr.microsoft.com/dotnet/framework/sdk:4.8-windowsservercore-ltsc2022 as builder

WORKDIR /src

# Copy solution and project files
COPY backend/JanisonAssessment.Backend.csproj ./backend/
COPY backend/ ./backend/

# Restore NuGet dependencies
RUN cd backend && \
	nuget restore JanisonAssessment.Backend.csproj

# Build the application
RUN cd backend && \
	msbuild JanisonAssessment.Backend.csproj /p:Configuration=Release /p:Platform="Any CPU"

# Stage 2: Runtime stage
FROM mcr.microsoft.com/dotnet/framework/runtime:4.8-windowsservercore-ltsc2022

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /src/backend/bin/Release/ ./

# Expose default port (will be overridden by Render.com PORT env var)
EXPOSE 5000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
	CMD powershell -Command try { \
		$response = Invoke-WebRequest http://localhost:5000/api/health -UseBasicParsing; \
		if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } \
	} catch { exit 1 }

# Entry point - application accepts host prefix as argument
# For Render.com: PORT env var will be passed, app should bind to http://0.0.0.0:{PORT}/
ENTRYPOINT ["JanisonAssessment.Backend.exe", "http://0.0.0.0:5000/"]

# Alternative startup using PORT environment variable
CMD if defined PORT (set HOST_PREFIX=http://0.0.0.0:%PORT%/) else (set HOST_PREFIX=http://0.0.0.0:5000/)&&JanisonAssessment.Backend.exe %HOST_PREFIX%
