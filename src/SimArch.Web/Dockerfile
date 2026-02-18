FROM node:20-alpine AS client-build
WORKDIR /client
COPY src/SimArch.Web/client/package*.json ./
RUN npm ci
COPY src/SimArch.Web/client .
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
COPY --from=client-build /wwwroot src/SimArch.Web/wwwroot
RUN dotnet publish src/SimArch.Web/SimArch.Web.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:5001
ENV HTTP_PORTS=5001
EXPOSE 5001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s CMD curl -f http://localhost:5001/health || exit 1
ENTRYPOINT ["dotnet", "SimArch.Web.dll"]
