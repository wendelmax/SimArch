FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish src/SimArch.Api/SimArch.Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s CMD curl -f http://localhost:5000/health || exit 1
ENTRYPOINT ["dotnet", "SimArch.Api.dll"]
