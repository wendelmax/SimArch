FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
COPY src/SimArch.Gateway/ocelot.Docker.json src/SimArch.Gateway/ocelot.json
RUN dotnet publish src/SimArch.Gateway/SimArch.Gateway.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "SimArch.Gateway.dll"]
