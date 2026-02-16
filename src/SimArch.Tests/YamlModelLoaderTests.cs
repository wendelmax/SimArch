using SimArch.DSL;
using Xunit;

namespace SimArch.Tests;

public sealed class YamlModelLoaderTests
{
    private readonly YamlModelLoader _loader = new();

    [Fact]
    public void TryLoad_ValidYaml_ReturnsTrue()
    {
        var yaml = """
            name: Test
            services:
              - id: svc1
                name: Service 1
              - id: svc2
                name: Service 2
            flows:
              - id: main
                steps:
                  - from: User
                    to: svc1
                  - from: svc1
                    to: svc2
            """;
        var ok = _loader.TryLoad(yaml, out var model, out var error);
        Assert.True(ok);
        Assert.Null(error);
        Assert.NotNull(model);
        Assert.Equal(2, model!.Services.Count);
        Assert.Single(model.Flows);
        Assert.Equal(2, model.Flows[0].Steps.Count);
    }

    [Fact]
    public void TryLoad_EmptyYaml_ReturnsFalse()
    {
        var ok = _loader.TryLoad("", out var model, out var error);
        Assert.False(ok);
        Assert.Null(model);
        Assert.NotNull(error);
    }

    [Fact]
    public void TryLoad_MissingServices_ReturnsFalse()
    {
        var yaml = "name: Test\n";
        var ok = _loader.TryLoad(yaml, out var model, out var error);
        Assert.False(ok);
        Assert.Null(model);
        Assert.NotNull(error);
        Assert.Contains("services", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void TryLoad_InvalidYaml_ReturnsFalse()
    {
        var yaml = "invalid: yaml: structure: [";
        var ok = _loader.TryLoad(yaml, out var model, out var error);
        Assert.False(ok);
        Assert.Null(model);
        Assert.NotNull(error);
    }

    [Fact]
    public void TryLoad_WithFallback_ParsesCorrectly()
    {
        var yaml = """
            name: Test
            services:
              - id: primary
                name: Primary
                fallback: backup
              - id: backup
                name: Backup
            flows:
              - id: main
                steps:
                  - from: primary
                    to: backup
            """;
        var ok = _loader.TryLoad(yaml, out var model, out var error);
        Assert.True(ok);
        Assert.NotNull(model);
        var primary = model!.Services.First(s => s.Id == "primary");
        Assert.Equal("backup", primary.FallbackServiceId);
    }
}
