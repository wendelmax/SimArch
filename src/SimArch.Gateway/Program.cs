using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("ocelot.json", false, true);
builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/health"))
    {
        context.Response.StatusCode = 200;
        await context.Response.WriteAsJsonAsync(new { status = "healthy" });
        return;
    }
    await next();
});
await app.UseOcelot();

app.Run();
