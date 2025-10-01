using CSharpFunctionalExtensions;
using LogViewer.Application.DTOs;
using LogViewer.Application.Services;
using Microsoft.AspNetCore.Http;

namespace LogViewer.Application.Abstractions;

public interface ILogParseService
{
    Task<Result<string>> GetProcessed(CancellationToken cancelationToken = default);
    Task<Result<IEnumerable<DTOs.LogParseService.TerraformOperationBlockDto>>> Load(IFormFile file, CancellationToken cancellationToken = default);
}