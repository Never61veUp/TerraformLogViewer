// using CSharpFunctionalExtensions;
// using LogViewer.Application.Abstractions;
// using LogViewer.Application.Commands;
// using LogViewer.Application.DTOs;
// using MediatR;
//
// namespace LogViewer.Application.Handlers;
//
// public class UploadJsonLogCommandHandler : IRequestHandler<UploadJsonLogCommand, Result>
// {
//     private readonly ILogParseService _logParseService;
//
//     public UploadJsonLogCommandHandler(ILogParseService logParseService)
//     {
//         _logParseService = logParseService;
//     }
//
//     public async Task<Result> Handle(UploadJsonLogCommand request, CancellationToken cancellationToken)
//     {
//         if (request.File.Length == 0)
//             return Result.Failure("File is empty");
//
//         if (!request.File.FileName.EndsWith(".json"))
//             return Result.Failure("File is not a json file");
//
//         try
//         {
//             await using var stream = request.File.OpenReadStream();
//             using var reader = new StreamReader(stream);
//             var content = await reader.ReadToEndAsync(cancellationToken);
//             
//             var parseResult = await _logParseService.Load(content, cancellationToken);
//             
//             if (parseResult.IsSuccess)
//                 return Result.Success(parseResult);
//             
//             return Result.Failure(parseResult.Error);
//         }
//         catch (Exception ex)
//         {
//             return Result.Failure($"Error processing file: {ex.Message}");
//         }
//     }
// }

