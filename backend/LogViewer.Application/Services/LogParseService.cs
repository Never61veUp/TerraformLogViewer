using System.Text.Json;
using CSharpFunctionalExtensions;
using LogViewer.Application.Abstractions;
using LogViewer.Application.DTOs;

namespace LogViewer.Application.Services;

public sealed class LogParseService : ILogParseService
{
    public Task<Result<string>> GetProcessed(CancellationToken cancelationToken = default)
    {
        throw new NotImplementedException();
    }

    public async Task<Result> Load(string log, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(log))
            return Result.Success(new List<ProcessedLogsDto>());

        var logEntries = new List<ProcessedLogsDto>();
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        
        using var reader = new StringReader(log);
        string? line;
        int lineNumber = 0;

        while ((line = await reader.ReadLineAsync(cancellationToken)) != null)
        {
            lineNumber++;

            if (string.IsNullOrWhiteSpace(line))
                continue;

            try
            {
                var logEntry = JsonSerializer.Deserialize<ProcessedLogsDto>(line, options);
                if (logEntry != null)
                {
                    logEntries.Add(logEntry);
                }
            }
            catch (JsonException jsonEx)
            {
                return Result.Failure($"Ошибка парсинга строки {lineNumber}: {jsonEx.Message}");
            }
        }
        
        Console.WriteLine($"Успешно распарсено {logEntries.Count} записей лога");
        return Result.Success(logEntries);
    }
}