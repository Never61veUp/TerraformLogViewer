using CSharpFunctionalExtensions;

namespace LogViewer.Application.Abstractions;

public interface ILogParseService
{
    Task<Result<string>> Parse(string log, CancellationToken cancelationToken = default);
}