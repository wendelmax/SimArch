using SimArch.Domain;

namespace SimArch.DSL;

public interface IArchitectureModelLoader
{
    ArchitectureModel Load(string source);
    bool TryLoad(string source, out ArchitectureModel? model, out string? error);
}
