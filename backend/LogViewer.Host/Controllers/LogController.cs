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
    
    [HttpGet("processing-log-json")]
    public async Task<IActionResult> UploadJson(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
            return FromResult(Result.Failure("File is empty"));

        if (!file.FileName.EndsWith(".json"))
            return FromResult(Result.Failure("File is not a json file"));

        await using var stream = file.OpenReadStream();
        using var reader = new StreamReader(stream);
        var content = await reader.ReadToEndAsync(cancellationToken);

        await _logParseService.Parse(content, cancellationToken);
        
        throw new NotImplementedException();
        return FromResult(Result.Success());
    }
}