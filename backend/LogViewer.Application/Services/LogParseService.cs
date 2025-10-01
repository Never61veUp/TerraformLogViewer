using System.Text.Json;
using System.Text.Json.Serialization;
using CSharpFunctionalExtensions;
using LogViewer.Application.Abstractions;
using LogViewer.Application.DTOs;
using LogViewer.Core.Model.Enum;
using Microsoft.AspNetCore.Http;

namespace LogViewer.Application.Services;

public sealed class LogParseService : ILogParseService
{
    private readonly IGroupDetector _groupDetector;

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly ILogLevelDetector _logLevelDetector;
    private readonly ITimeStampService _timeStampService;

    public LogParseService(ITimeStampService timeStampService, ILogLevelDetector logLevelDetector,
        IGroupDetector groupDetector)
    {
        _timeStampService = timeStampService;
        _logLevelDetector = logLevelDetector;
        _groupDetector = groupDetector;
    }

    public Task<Result<string>> GetProcessed(CancellationToken cancelationToken = default)
    {
        throw new NotImplementedException();
    }

    public async Task<Result<Dictionary<string, List<ProcessedLogsDto>>>> Load(IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file.Length == 0)
            return Result.Failure<Dictionary<string, List<ProcessedLogsDto>>>("File is empty");

        var logEntries = new List<ProcessedLogsDto>();
        var errorCount = 0;

        await using var stream = file.OpenReadStream();
        using var reader = new StreamReader(stream);

        var lineNumber = 0;
        string? line;
        while ((line = await reader.ReadLineAsync(cancellationToken)) != null)
        {
            lineNumber++;
            if (string.IsNullOrWhiteSpace(line))
                continue;

            try
            {
                var logEntry = JsonSerializer.Deserialize<ProcessedLogsDto>(line, _jsonOptions);
                if (logEntry == null)
                    continue;

                logEntry.LevelParsed = _logLevelDetector.DetectLogLevel(line);
                logEntry.TimestampParsed = _timeStampService.ExtractTimestamp(line);

                logEntries.Add(logEntry);
            }
            catch (JsonException ex)
            {
                errorCount++;
                Console.WriteLine($"Ошибка парсинга строки {lineNumber}: {ex.Message}");
            }
        }

        if (!logEntries.Any())
        {
            var errorMessage = errorCount > 0
                ? $"No valid log entries found. {errorCount} lines had parsing errors."
                : "No valid log entries found in the provided content.";
            return Result.Failure<Dictionary<string, List<ProcessedLogsDto>>>(errorMessage);
        }

        Console.WriteLine($"Успешно распарсено {logEntries.Count} записей лога");

        var groupedLogs = _groupDetector.GroupLogsByOperationType(logEntries);

        Console.WriteLine($"Plan операции: {groupedLogs["plan"].Count} записей");
        Console.WriteLine($"Apply операции: {groupedLogs["apply"].Count} записей");
        Console.WriteLine($"Другие записи: {groupedLogs["other"].Count} записей");

        return Result.Success(groupedLogs);
    }
}