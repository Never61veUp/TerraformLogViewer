using CSharpFunctionalExtensions;
using LogViewer.Host.Utils;
using Microsoft.AspNetCore.Mvc;

namespace LogViewer.Host.Controllers;

public class BaseController  : ControllerBase
{
    protected IActionResult FromResult<T>(Result<T> result)
    {
        return result.IsSuccess ? Ok(result.Value) : Error(result.Error);
    }
    protected IActionResult FromResult(Result result)
    {
        return result.IsSuccess ? Ok(result.ToString()) : Error(result.Error);
    }
    protected bool TryGetUserId(out Guid id)
    {
        id = Guid.Empty;
        var userId = User.FindFirst("userId")?.Value;
        if (userId is null || !Guid.TryParse(userId, out id))
            return false;
        return true;
    }
    protected new IActionResult Ok()
    {
        return base.Ok(Envelope.Ok());
    }

    protected IActionResult Ok<T>(T result)
    {
        return base.Ok(Envelope.Ok(result));
    }

    protected IActionResult Error(string errorMessage)
    {
        return BadRequest(Envelope.Error(errorMessage));
    }
}