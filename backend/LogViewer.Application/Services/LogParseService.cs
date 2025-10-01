using System.Text.Json;
using System.Text.RegularExpressions;
using CSharpFunctionalExtensions;
using LogViewer.Application.Abstractions;
using LogViewer.Application.DTOs;

namespace LogViewer.Application.Services;

public sealed class LogParseService : ILogParseService
{
    private readonly ITimeStampService _timeStampService;

    public LogParseService(ITimeStampService timeStampService)
    {
        _timeStampService = timeStampService;
    }
    public Task<Result<string>> GetProcessed(CancellationToken cancelationToken = default)
    {
        throw new NotImplementedException();
    }
    
    public async Task<Result<Dictionary<string, List<ProcessedLogsDto>>>> Load(string log, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(log))
            return Result.Failure<Dictionary<string, List<ProcessedLogsDto>>>("Log content is empty or null");

        var logEntries = new List<ProcessedLogsDto>();
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        
        using var reader = new StringReader(log);
        string? line;
        int lineNumber = 0;
        int errorCount = 0;

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
        
        var groupedLogs = GroupLogsByOperationType(logEntries);
        
        Console.WriteLine($"Plan операции: {groupedLogs["plan"].Count} записей");
        Console.WriteLine($"Apply операции: {groupedLogs["apply"].Count} записей");
        Console.WriteLine($"Другие записи: {groupedLogs["other"].Count} записей");
        
        return Result.Success(groupedLogs);
    }

    private Dictionary<string, List<ProcessedLogsDto>> GroupLogsByOperationType(List<ProcessedLogsDto> logEntries)
    {
        var groups = new Dictionary<string, List<ProcessedLogsDto>>
        {
            ["plan"] = new List<ProcessedLogsDto>(),
            ["apply"] = new List<ProcessedLogsDto>(),
            ["other"] = new List<ProcessedLogsDto>()
        };

        // Упрощенные регулярные выражения - ищем просто наличие операций в аргументах
        var planPatterns = new[]
        {
            @"terraform\s+plan",  // terraform plan
            @"starting\s+Plan\s+operation",  // starting Plan operation
            @"CLI\s+args:[^]]*plan[^]]*\]",  // CLI args: [anything containing plan]
            @"CLI\s+command\s+args:[^]]*plan[^]]*\]",  // CLI command args: [anything containing plan]
            @"""plan""",  // "plan" в любом контексте CLI args
            @"\[\s*[^]]*""plan""[^]]*\]"  // [anything containing "plan"]
        };

        var applyPatterns = new[]
        {
            @"terraform\s+apply",  // terraform apply
            @"starting\s+Apply\s+operation",  // starting Apply operation
            @"CLI\s+args:[^]]*apply[^]]*\]",  // CLI args: [anything containing apply]
            @"CLI\s+command\s+args:[^]]*apply[^]]*\]",  // CLI command args: [anything containing apply]
            @"""apply""",  // "apply" в любом контексте CLI args
            @"\[\s*[^]]*""apply""[^]]*\]"  // [anything containing "apply"]
        };

        foreach (var entry in logEntries)
        {
            var message = entry.Message ?? "";
            string operationType = "other";

            if (planPatterns.Any(pattern => Regex.IsMatch(message, pattern, RegexOptions.IgnoreCase)))
            {
                operationType = "plan";
                Console.WriteLine($"PLAN DETECTED: {message}");
            }
            else if (applyPatterns.Any(pattern => Regex.IsMatch(message, pattern, RegexOptions.IgnoreCase)))
            {
                operationType = "apply";
                Console.WriteLine($"APPLY DETECTED: {message}");
            }

            groups[operationType].Add(entry);
        }

        return groups;
    }
}