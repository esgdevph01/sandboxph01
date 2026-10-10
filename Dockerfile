# Multi-stage Dockerfile for Janison Assessment Backend (.NET 8 LTS)
# Linux-based for Render.com deployment

# Stage 1: Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY backend/JanisonAssessment.Backend.csproj backend/
RUN dotnet restore backend/JanisonAssessment.Backend.csproj

# Copy remaining source code and publish
COPY backend/ backend/
WORKDIR /src/backend
RUN dotnet publish JanisonAssessment.Backend.csproj -c Release -f net8.0 -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published application
COPY --from=build /app/publish .

# Default port (Render.com automatically injects $PORT at runtime)
ENV PORT=5000
EXPOSE 5000

# Entry point
ENTRYPOINT ["dotnet", "JanisonAssessment.Backend.dll"]
