using System.Text.Json;
using CSharpFunctionalExtensions;
using LogViewer.Application.Abstractions;
using LogViewer.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace LogViewer.Host.Controllers;

[ApiController]
[Route("api/logs/terraform")]
public sealed class LogController : BaseController
{
    private readonly ILogParseService _logParseService;

    public LogController(ILogParseService logParseService)
    {
        _logParseService = logParseService;
    }
    
    [HttpPost("upload-log-json")]
    public async Task<IActionResult> UploadJson(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
            return FromResult(Result.Failure("File is empty"));

        if (!file.FileName.EndsWith(".json"))
            return FromResult(Result.Failure("File is not a json file"));

        await using var stream = file.OpenReadStream();
        using var reader = new StreamReader(stream);
        var content = await reader.ReadToEndAsync(cancellationToken);

        var result = await _logParseService.Load(content, cancellationToken);
        
        return FromResult(result);
    }
    
    [HttpGet("get-processed-log-json")]
    public async Task<IActionResult> GetProcessedLogs(CancellationToken cancellationToken)
    {
        var result = await _logParseService.GetProcessed(cancellationToken);
        
        return FromResult(result);
    }
}