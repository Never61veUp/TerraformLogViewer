using CSharpFunctionalExtensions;
using LogViewer.Application.DTOs;

namespace LogViewer.Application.Abstractions;

public interface ILogParseService
{
    Task<Result<string>> GetProcessed(CancellationToken cancelationToken = default);
    Task<Result> Load(string log, CancellationToken cancelationToken = default);
}