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
    
    public async Task<IActionResult> UploadFile()
    {
        throw new NotImplementedException();
    }
}