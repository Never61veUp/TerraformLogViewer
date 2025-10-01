using System.Text.Json;
using CSharpFunctionalExtensions;
using LogViewer.Application.Abstractions;
using LogViewer.Application.Commands;
using LogViewer.Application.Services;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace LogViewer.Host.Controllers;

[ApiController]
[Route("api/logs/terraform")]
public sealed class LogController : BaseController
{
    private readonly ILogParseService _logParseService;
    private readonly IMediator _mediator;

    public LogController(ILogParseService logParseService, IMediator mediator)
    {
        _logParseService = logParseService;
        _mediator = mediator;
    }
    
    [HttpPost("upload-log-json")]
    public async Task<IActionResult> UploadJson(IFormFile file, CancellationToken cancellationToken)
    {
        var logs = await _logParseService.Load(file, cancellationToken);
        return FromResult(logs);
    }
    
    [HttpGet("get-processed-log-json")]
    public async Task<IActionResult> GetProcessedLogs(CancellationToken cancellationToken)
    {
        var result = await _logParseService.GetProcessed(cancellationToken);
        
        return FromResult(result);
    }
    [HttpPost("get-processed-log-json-test")]
    public async Task<IActionResult> GetProcessedLogsTest(IFormFile file, CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        using var reader = new StreamReader(stream);
        var content = await reader.ReadToEndAsync(cancellationToken);
        var result = await _logParseService.ParseLogsAsync(content, cancellationToken);
        
        
        return FromResult(result);
    }
}