using System.Collections.Generic;
using SimArch.Domain;
using SimArch.Domain.Entities;
using SimArch.Domain.ValueObjects;

namespace SimArch.Simulation;

public sealed class DiscreteEventSimulationEngine : ISimulationEngine
{
    public SimulationResult Run(ArchitectureModel model, SimulationOptions options)
    {
        var rnd = new Random(options.Seed);
        var simTime = 0.0;
        var endTime = options.Duration.TotalSeconds;
        var events = new List<SimulationEvent>();
        var metrics = new Dictionary<string, ServiceState>();

        foreach (var svc in model.Services)
            metrics[svc.Id] = new ServiceState(svc);

        var flow = model.Flows.Count > 0 ? model.Flows[0] : null;
        var requestCount = 0;
        var targetRate = Math.Max(1, options.RequestRatePerSecond);
        var interval = 1.0 / targetRate;
        var rampUpSeconds = Math.Max(0, options.RampUpSeconds);

        while (simTime < endTime)
        {
            simTime += interval;
            if (simTime >= endTime) break;

            foreach (var state in metrics.Values)
                state.AdvanceCircuitBreaker(simTime);

            var shouldIssueRequest = rampUpSeconds <= 0 || simTime >= rampUpSeconds
                ? true
                : rnd.NextDouble() < (simTime / rampUpSeconds);
            if (shouldIssueRequest)
            {
                requestCount++;
                ProcessRequest(model, flow, metrics, simTime, options.FailureInjectionRate, rnd, events);
            }
        }

        var elapsed = TimeSpan.FromSeconds(endTime);
        var resultMetrics = metrics.ToDictionary(
            x => x.Key,
            x => x.Value.ToServiceMetrics());

        return new SimulationResult(true, elapsed, resultMetrics, events);
    }

    private static void ProcessRequest(
        ArchitectureModel model,
        FlowDefinition? flow,
        Dictionary<string, ServiceState> metrics,
        double simTime,
        double failureRate,
        Random rnd,
        List<SimulationEvent> events)
    {
        if (flow == null || flow.Steps.Count == 0) return;

        var ts = DateTimeOffset.UtcNow.AddSeconds(simTime);
        string? currentNode = "User";

        foreach (var step in flow.Steps)
        {
            var targetId = step.ToNodeId;
            if (!metrics.TryGetValue(targetId, out var state)) continue;

            if (state.Service.CircuitBreaker != null && state.CircuitState == CircuitBreakerState.Open)
            {
                if (state.Service.FallbackServiceId != null && metrics.TryGetValue(state.Service.FallbackServiceId, out var fallbackState))
                {
                    state.RecordRejected();
                    events.Add(new SimulationEvent(ts, targetId, "CircuitBreakerOpen", "Using fallback"));
                    currentNode = state.Service.FallbackServiceId;
                    RecordCompletion(fallbackState, rnd, failureRate, ts, events);
                }
                continue;
            }

            var queueCapacity = state.Service.Queue?.Capacity ?? int.MaxValue;
            if (state.QueueDepth >= queueCapacity)
            {
                state.RecordRejected();
                events.Add(new SimulationEvent(ts, targetId, "QueueFull", "Backpressure"));
                if (state.Service.FallbackServiceId != null && metrics.TryGetValue(state.Service.FallbackServiceId, out var fallbackState))
                    RecordCompletion(fallbackState, rnd, failureRate, ts, events);
                continue;
            }

            var maxConcurrency = state.Service.Bulkhead?.MaxConcurrency ?? int.MaxValue;
            if (state.InFlight >= maxConcurrency)
            {
                state.QueueDepth++;
                continue;
            }

            state.InFlight++;
            var latencyMs = 10 + rnd.NextDouble() * 90;
            var timeoutMs = state.Service.Timeout?.Duration.TotalMilliseconds ?? double.MaxValue;
            var failed = rnd.NextDouble() < failureRate || latencyMs > timeoutMs;
            if (latencyMs > timeoutMs)
                events.Add(new SimulationEvent(ts, targetId, "Timeout", $"Latency {latencyMs:F0}ms > {timeoutMs:F0}ms"));

            state.InFlight--;
            if (state.QueueDepth > 0) state.QueueDepth--;

            if (failed)
            {
                state.RecordFailure(simTime);
                if (state.Service.CircuitBreaker != null)
                    state.SetCircuitOpenUntil(simTime);
                if (step.OnFailureTargetId != null && metrics.TryGetValue(step.OnFailureTargetId, out var fallbackState))
                    RecordCompletion(fallbackState, rnd, failureRate, ts, events);
                else if (state.Service.FallbackServiceId != null && metrics.TryGetValue(state.Service.FallbackServiceId, out var fallbackState2))
                    RecordCompletion(fallbackState2, rnd, failureRate, ts, events);
            }
            else
            {
                state.RecordSuccess(latencyMs);
                if (state.Service.CircuitBreaker != null)
                    state.RecordCircuitSuccess();
            }

            currentNode = targetId;
        }
    }

    private static void RecordCompletion(ServiceState state, Random rnd, double failureRate, DateTimeOffset ts, List<SimulationEvent> events)
    {
        var latencyMs = 10 + rnd.NextDouble() * 90;
        var failed = rnd.NextDouble() < failureRate;
        if (failed)
            state.RecordFailure(null);
        else
            state.RecordSuccess(latencyMs);
    }

    private sealed class ServiceState
    {
        private readonly List<double> _latencies = new();
        public ServiceDefinition Service { get; }
        public long Requests { get; private set; }
        public long Failures { get; private set; }
        public long Rejected { get; private set; }
        public int QueueDepth { get; set; }
        public int InFlight { get; set; }
        public CircuitBreakerState CircuitState { get; private set; } = CircuitBreakerState.Closed;
        private int _circuitFailures;
        private double _circuitOpenUntil;
        private int _halfOpenSuccesses;

        public ServiceState(ServiceDefinition service) => Service = service;

        public void RecordSuccess(double latencyMs)
        {
            Requests++;
            _latencies.Add(latencyMs);
            if (Service.CircuitBreaker != null && CircuitState == CircuitBreakerState.HalfOpen)
            {
                _halfOpenSuccesses++;
                if (_halfOpenSuccesses >= Service.CircuitBreaker.SuccessThresholdInHalfOpen)
                {
                    CircuitState = CircuitBreakerState.Closed;
                    _circuitFailures = 0;
                    _halfOpenSuccesses = 0;
                }
            }
        }

        public void RecordFailure(double? simTime = null)
        {
            Requests++;
            Failures++;
            if (Service.CircuitBreaker == null) return;
            _circuitFailures++;
            if (CircuitState == CircuitBreakerState.HalfOpen)
            {
                CircuitState = CircuitBreakerState.Open;
                _circuitOpenUntil = simTime.HasValue ? simTime.Value + Service.CircuitBreaker.OpenDuration.TotalSeconds : double.MaxValue;
            }
            else if (CircuitState == CircuitBreakerState.Closed && _circuitFailures >= Service.CircuitBreaker.FailureThreshold)
            {
                CircuitState = CircuitBreakerState.Open;
                _circuitOpenUntil = simTime.HasValue ? simTime.Value + Service.CircuitBreaker.OpenDuration.TotalSeconds : double.MaxValue;
            }
        }

        public void SetCircuitOpenUntil(double simTime)
        {
            if (Service.CircuitBreaker != null && CircuitState == CircuitBreakerState.Open && _circuitOpenUntil == double.MaxValue)
                _circuitOpenUntil = simTime + Service.CircuitBreaker.OpenDuration.TotalSeconds;
        }

        public void RecordCircuitSuccess()
        {
            if (CircuitState == CircuitBreakerState.HalfOpen)
                _halfOpenSuccesses++;
        }

        public void RecordRejected() => Rejected++;

        public void AdvanceCircuitBreaker(double simTime)
        {
            if (Service.CircuitBreaker == null || CircuitState != CircuitBreakerState.Open) return;
            if (_circuitOpenUntil != double.MaxValue && simTime >= _circuitOpenUntil)
            {
                CircuitState = CircuitBreakerState.HalfOpen;
                _halfOpenSuccesses = 0;
            }
        }

        public ServiceMetrics ToServiceMetrics()
        {
            var sorted = _latencies.OrderBy(x => x).ToList();
            var p95 = sorted.Count > 0 ? sorted[(int)((sorted.Count - 1) * 0.95)] : 0;
            return new ServiceMetrics(
                Service.Id,
                Requests,
                Failures,
                _latencies.Count > 0 ? _latencies.Average() : 0,
                p95);
        }
    }
}
