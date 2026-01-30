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
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "SimArch.Web.dll"]
