using CSharpFunctionalExtensions;
using LogViewer.Application.DTOs;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace LogViewer.Application.Commands;

public record UploadJsonLogCommand : IRequest<Result>
{
    public IFormFile File { get; init; }
}