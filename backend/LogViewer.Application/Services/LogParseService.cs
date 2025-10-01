using System.Text.Json;
using System.Text.RegularExpressions;
using CSharpFunctionalExtensions;
using LogViewer.Application.Abstractions;
using LogViewer.Application.DTOs;
using LogViewer.Core.Model;
using LogViewer.Core.Model.Enum;
using Microsoft.AspNetCore.Http;

namespace LogViewer.Application.Services;

public sealed class LogParseService : ILogParseService
{
    private readonly ITimeStampService _timeStampService;
    private readonly ILogLevelDetector _logLevelDetector;
    private readonly IGroupDetector _groupDetector;

    public LogParseService(ITimeStampService timeStampService, ILogLevelDetector logLevelDetector, IGroupDetector groupDetector)
    {
        _timeStampService = timeStampService;
        _logLevelDetector = logLevelDetector;
        _groupDetector = groupDetector;
    }
    public Task<Result<string>> GetProcessed(CancellationToken cancelationToken = default)
    {
        throw new NotImplementedException();
    }
    
    public async Task<Result<Dictionary<string, List<ProcessedLogsDto>>>> Load(IFormFile file, CancellationToken cancellationToken)
    {
        var content = await FromFileToString(file, cancellationToken);
        if(content.IsFailure)
            return Result.Failure<Dictionary<string, List<ProcessedLogsDto>>>(content.Error);
        
        if (string.IsNullOrWhiteSpace(content.Value))
            return Result.Failure<Dictionary<string, List<ProcessedLogsDto>>>("Log content is empty or null");

        var logEntries = new List<ProcessedLogsDto>();
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        

        int lineNumber = 0;
        int errorCount = 0;
        
        var lastLevel = LogLevel.Unknown;
        var lines = content.Value.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
        var parsedLogs = new List<LogEntry>();
        
        var reader = new StringReader(content.Value);
        string? lineStr; 
        while ((lineStr = await reader.ReadLineAsync(cancellationToken)) != null)
        {
            lineNumber++;

            if (string.IsNullOrWhiteSpace(lineStr))
                continue;

            try
            {
                var logEntry = JsonSerializer.Deserialize<ProcessedLogsDto>(lineStr, options);
                if (logEntry != null)
                {
                    logEntries.Add(logEntry);
                    logEntry.LevelParsed = _logLevelDetector.DetectLogLevel(lineStr, lastLevel);
                    lastLevel = logEntry.LevelParsed;
                }
            }
            catch (JsonException jsonEx)
            {
                errorCount++;
                Console.WriteLine($"Ошибка парсинга строки {lineNumber}: {jsonEx.Message}");
            }
        }
        
        if (logEntries.Count == 0 && errorCount > 0)
        {
            return Result.Failure<Dictionary<string, List<ProcessedLogsDto>>>(
                $"No valid log entries found. {errorCount} lines had parsing errors.");
        }
        
        if (logEntries.Count == 0)
        {
            return Result.Failure<Dictionary<string, List<ProcessedLogsDto>>>(
                "No valid log entries found in the provided content.");
        }
        
        Console.WriteLine($"Успешно распарсено {logEntries.Count} записей лога");
        
        var groupedLogs = _groupDetector.GroupLogsByOperationType(logEntries);
        
        Console.WriteLine($"Plan операции: {groupedLogs["plan"].Count} записей");
        Console.WriteLine($"Apply операции: {groupedLogs["apply"].Count} записей");
        Console.WriteLine($"Другие записи: {groupedLogs["other"].Count} записей");
        
        return Result.Success(groupedLogs);
    }
    
    public async Task<Result<List<LogEntry>>> ParseLogsAsync(string jsonContent, CancellationToken cancellationToken = default)
    {
        var lastLevel = LogLevel.Unknown;
        var lines = jsonContent.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);
        var parsedLogs = new List<LogEntry>();
        
        
        foreach (var line in lines)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var ts = _timeStampService.ExtractTimestamp(line);
            var level = _logLevelDetector.DetectLogLevel(line, lastLevel);
            
            var logEntry = new LogEntry
            {
                Raw = line,
                Timestamp = ts,
                Level = level
            };

            parsedLogs.Add(logEntry);
            lastLevel = level;
        }

        return parsedLogs;
    }

    private async Task<Result<string>> FromFileToString(IFormFile file,
        CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        using var reader = new StreamReader(stream);
        var content = await reader.ReadToEndAsync(cancellationToken);
        
        try
        {
            using var stringReader = new StringReader(content);
            string? line;
            while ((line = stringReader.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;
                JsonSerializer.Deserialize<ProcessedLogsDto>(line);
            }
            return Result.Success(content);
        }
        catch (JsonException ex)
        {
            return Result.Failure<string>($"Invalid JSON: {ex.Message}");
        }
    }
}