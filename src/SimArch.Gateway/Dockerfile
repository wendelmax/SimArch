FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
COPY src/SimArch.Gateway/ocelot.Docker.json src/SimArch.Gateway/ocelot.json
RUN dotnet publish src/SimArch.Gateway/SimArch.Gateway.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s CMD curl -f http://localhost/health || exit 1
ENTRYPOINT ["dotnet", "SimArch.Gateway.dll"]
