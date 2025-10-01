using CSharpFunctionalExtensions;
using LogViewer.Application.DTOs;
using LogViewer.Core.Model;
using Microsoft.AspNetCore.Http;

namespace LogViewer.Application.Abstractions;

public interface ILogParseService
{
    Task<Result<string>> GetProcessed(CancellationToken cancelationToken = default);
    Task<Result<Dictionary<string, List<ProcessedLogsDto>>>> Load(IFormFile file, CancellationToken cancellationToken);
    Task<Result<List<LogEntry>>> ParseLogsAsync(string jsonContent, CancellationToken cancellationToken = default);
}