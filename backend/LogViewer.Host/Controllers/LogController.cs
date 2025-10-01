using System.Text.Json;
using System.Text.Json.Serialization;
using LogViewer.Application.Abstractions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace LogViewer.Host.Controllers;

[ApiController]
[Route("api/logs/terraform")]
public sealed class LogController : BaseController
{
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly ILogParseService _logParseService;

    public LogController(ILogParseService logParseService)
    {
        _logParseService = logParseService;
    }


    [HttpPost("upload-log-json")]
    public async Task<IActionResult> UploadJson(IFormFile file, CancellationToken cancellationToken)
    {
        var processed = await _logParseService.Load(file, cancellationToken);
        if(processed.IsFailure)
            return FromResult(processed);
        
        return new JsonResult(processed.Value, _jsonOptions);
        
    }

    [HttpGet("get-processed-log-json")]
    public async Task<IActionResult> GetProcessedLogs(CancellationToken cancellationToken)
    {
        var processed = await _logParseService.GetProcessed(cancellationToken);
        var result = JsonSerializer.Serialize(processed.Value, _jsonOptions);
        return Ok(result);
    }
}