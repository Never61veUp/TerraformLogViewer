using CSharpFunctionalExtensions;
using LogViewer.Application.Abstractions;

namespace LogViewer.Application.Services;

public sealed class LogParseService : ILogParseService
{
    public Task<Result<string>> Parse(string log, CancellationToken cancelationToken = default)
    {
        throw new NotImplementedException();
    }
}