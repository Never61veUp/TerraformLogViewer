using CSharpFunctionalExtensions;
using LogViewer.Application.DTOs;
using MediatR;

namespace LogViewer.Application.Commands.Get;

public record GetProcessedLogsQuery : IRequest<Result<ProcessedLogsDto>>;