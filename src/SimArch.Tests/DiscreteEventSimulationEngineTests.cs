using SimArch.Domain;
using SimArch.DSL;
using SimArch.Simulation;
using Xunit;

namespace SimArch.Tests;

public sealed class DiscreteEventSimulationEngineTests
{
    private readonly YamlModelLoader _loader = new();
    private readonly DiscreteEventSimulationEngine _engine = new();

    private ArchitectureModel LoadModel(string yaml)
    {
        if (!_loader.TryLoad(yaml, out var model, out var error))
            throw new InvalidOperationException(error);
        return model!;
    }

    [Fact]
    public void Run_SimpleModel_ReturnsSuccess()
    {
        var yaml = """
            name: Test
            services:
              - id: gateway
                name: Gateway
              - id: svc
                name: Service
            flows:
              - id: main
                steps:
                  - from: User
                    to: gateway
                  - from: gateway
                    to: svc
            """;
        var model = LoadModel(yaml);
        var opts = new SimulationOptions(TimeSpan.FromSeconds(1), 10, 0, 42);
        var result = _engine.Run(model, opts);
        Assert.True(result.Success);
        Assert.True(result.Elapsed.TotalSeconds >= 1);
        Assert.True(result.ServiceMetrics.Count > 0);
    }

    [Fact]
    public void Run_WithRampUp_RespectsRampUp()
    {
        var yaml = """
            name: Test
            services:
              - id: svc
                name: Service
            flows:
              - id: main
                steps:
                  - from: User
                    to: svc
            """;
        var model = LoadModel(yaml);
        var opts = new SimulationOptions(TimeSpan.FromSeconds(2), 50, 0, 42, 1);
        var result = _engine.Run(model, opts);
        Assert.True(result.Success);
        Assert.True(result.ServiceMetrics.Values.Sum(m => m.RequestCount) > 0);
    }

    [Fact]
    public void Run_EmptyFlow_CompletesWithoutError()
    {
        var yaml = """
            name: Test
            services:
              - id: svc
                name: Service
            flows: []
            """;
        var model = LoadModel(yaml);
        var opts = new SimulationOptions(TimeSpan.FromSeconds(1), 10, 0, 42);
        var result = _engine.Run(model, opts);
        Assert.True(result.Success);
    }

    [Fact]
    public void Run_SameSeed_Deterministic()
    {
        var yaml = """
            name: Test
            services:
              - id: svc
                name: Service
            flows:
              - id: main
                steps:
                  - from: User
                    to: svc
            """;
        var model = LoadModel(yaml);
        var opts = new SimulationOptions(TimeSpan.FromSeconds(1), 20, 0.1, 12345);
        var r1 = _engine.Run(model, opts);
        var r2 = _engine.Run(model, opts);
        Assert.Equal(
            r1.ServiceMetrics.Values.Sum(m => m.RequestCount + m.FailureCount),
            r2.ServiceMetrics.Values.Sum(m => m.RequestCount + m.FailureCount));
    }
}
