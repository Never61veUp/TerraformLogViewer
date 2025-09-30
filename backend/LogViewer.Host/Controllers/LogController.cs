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
        var command = new UploadJsonLogCommand { File = file };
        var result = await _mediator.Send(command, cancellationToken);
        
        if (result.IsSuccess)
            return Ok();
        else
            return BadRequest(new { error = result.Error });
    }
    
    [HttpGet("get-processed-log-json")]
    public async Task<IActionResult> GetProcessedLogs(CancellationToken cancellationToken)
    {
        var result = await _logParseService.GetProcessed(cancellationToken);
        
        return FromResult(result);
    }
}