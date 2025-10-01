using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using CSharpFunctionalExtensions;
using LogViewer.Application.Abstractions;
using LogViewer.Application.DTOs;
using LogViewer.Core.Model.Enum;
using Microsoft.AspNetCore.Http;

namespace LogViewer.Application.Services;

public sealed partial class LogParseService : ILogParseService
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

    public async Task<Result<IEnumerable<DTOs.LogParseService.TerraformOperationBlockDto>>> Load(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
            return Result.Failure<IEnumerable<DTOs.LogParseService.TerraformOperationBlockDto>>("File is empty");

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
            return Result.Failure<IEnumerable<DTOs.LogParseService.TerraformOperationBlockDto>>(errorMessage);
        }
        
        Console.WriteLine($"Успешно распарсено {logEntries.Count} записей лога");
        
        var groupedLogs = GroupLogsByOperationType(logEntries);

        var planBlocks = groupedLogs.Where(b => b.Type == "plan").ToList();
        var applyBlocks = groupedLogs.Where(b => b.Type == "apply").ToList();
        var otherBlocks = groupedLogs.Where(b => b.Type == "other").ToList();

        foreach (var block in groupedLogs)
        {
            Console.WriteLine($"=== {block.Type.ToUpper()} Block ===");
            Console.WriteLine($"ID: {block.Id}");
            Console.WriteLine($"Log Count: {block.LogCount}");
            Console.WriteLine($"Start: {block.StartTime}");
            Console.WriteLine($"End: {block.EndTime}");
            Console.WriteLine($"Duration: {block.EndTime - block.StartTime}");
    
            // Первый элемент
            if (block.Logs.Count > 0)
            {
                var firstLog = block.Logs.First();
                Console.WriteLine($"First log: [{firstLog.Timestamp:HH:mm:ss}] {firstLog.Message}");
            }
    
            // Последний элемент  
            if (block.Logs.Count > 1)
            {
                var lastLog = block.Logs.Last();
                Console.WriteLine($"Last log: [{lastLog.Timestamp:HH:mm:ss}] {lastLog.Message}");
            }
    
            Console.WriteLine();
        }
        
        Console.WriteLine("=== SUMMARY ===");
        Console.WriteLine($"Plan blocks: {planBlocks.Count}");
        Console.WriteLine($"Apply blocks: {applyBlocks.Count}");
        Console.WriteLine($"Other blocks: {otherBlocks.Count}");
        Console.WriteLine($"Total logs: {groupedLogs.Sum(b => b.LogCount)}");
        
        // Возвращаем сгруппированные данные
        return Result.Success(groupedLogs);
    }
    
    private IEnumerable<DTOs.LogParseService.TerraformOperationBlockDto> GroupLogsByOperationType(List<ProcessedLogsDto> logEntries)
    {
        // Более гибкие регулярные выражения
        var planStartPatterns = new[]
        {
            @"terraform\s+plan",
            @"starting\s+Plan\s+operation",
            @"CLI\s+args:[^]]*plan[^]]*\]",
            @"CLI\s+command\s+args:[^]]*plan[^]]*\]",
            @"""plan""",
            @"\[\s*[^]]*""plan""[^]]*\]",
            @"Running\s+plan\s+in",
            @"Terraform\s+will\s+perform\s+the\s+following\s+actions",
            @"Initializing\s+the\s+backend\.\.\.",
            @"Initializing\s+provider\s+plugins\.\.\.",
        };

        var applyStartPatterns = new[]
        {
            @"terraform\s+apply",
            @"starting\s+Apply\s+operation", 
            @"CLI\s+args:[^]]*apply[^]]*\]",
            @"CLI\s+command\s+args:[^]]*apply[^]]*\]",
            @"""apply""",
            @"\[\s*[^]]*""apply""[^]]*\]",
            @"Running\s+apply\s+in",
            @"Do\s+you\s+want\s+to\s+perform\s+these\s+actions\?",
            @"Terraform\s+will\s+perform\s+the\s+following\s+actions",
        };
        
        var planCompletePatterns = new[]
        {
            // Успешное завершение
            @"Plan:\s+\d+\s+to\s+add,\s+\d+\s+to\s+change,\s+\d+\s+to\s+destroy",
            @"Plan:\s+\d+\s+added,\s+\d+\s+changed,\s+\d+\s+destroyed",
            @"No\s+changes.\s+Your\s+infrastructure\s+matches\s+the\s+configuration",
            @"This\s+plan\s+was\s+saved\s+to:",
            @"Saved\s+the\s+plan\s+to:",
    
            // С предупреждениями
            @"Warning:\s+.*\n.*Plan\s+finished",
    
            // Завершение операции
            @"finished\s+plan\s+operation",
            @"time\s+elapsed\s+[^\s]+\s*s",
    
            // Ошибки
            @"Error:\s+",
            @"Planning\s+failed",
            @"failed\s+to\s+create\s+plan",
    
            // Отменено пользователем
            @"Plan\s+cancelled",
        };
        
        var applyCompletePatterns = new[]
        {
            // Успешное завершение
            @"Apply\s+complete!\s+Resources:\s+\d+\s+added,\s+\d+\s+changed,\s+\d+\s+destroyed",
            @"Apply\s+complete!\s+Resources:\s+\d+\s+imported,\s+\d+\s+added,\s+\d+\s+changed,\s+\d+\s+destroyed", 
            @"Apply\s+complete!\s+Resources:\s+0\s+added,\s+0\s+changed,\s+0\s+destroyed",
            @"Destroy\s+complete!\s+Resources:\s+\d+\s+destroyed",
    
            // Завершение операции
            @"finished\s+apply\s+operation",
            @"time\s+elapsed\s+[^\s]+\s*s",
            @"Apply\s+complete!\s+Time\s+elapsed:",
    
            // Ошибки
            @"Error:\s+",
            @"Apply\s+failed",
            @"failed\s+to\s+apply\s+changes",
    
            // Отменено
            @"Apply\s+cancelled",
        };

        var result = new List<DTOs.LogParseService.TerraformOperationBlockDto>();
        var currentBlock = new List<ProcessedLogsDto>();
        string currentType = "other";
        
        foreach (var entry in logEntries)
        {
            var message = entry.Message ?? "";
            
            // Проверяем начало новой операции
            if (planStartPatterns.Any(pattern => Regex.IsMatch(message, pattern, RegexOptions.IgnoreCase)))
            {
                // Сохраняем текущий блок если он не пустой
                if (currentBlock.Any())
                {
                    result.Add(CreateOperationBlock(currentType, currentBlock));
                    currentBlock = new List<ProcessedLogsDto>();
                }
                currentType = "plan";
                currentBlock.Add(entry);
            }
            else if (applyStartPatterns.Any(pattern => Regex.IsMatch(message, pattern, RegexOptions.IgnoreCase)))
            {
                // Сохраняем текущий блок если он не пустой
                if (currentBlock.Any())
                {
                    result.Add(CreateOperationBlock(currentType, currentBlock));
                    currentBlock = new List<ProcessedLogsDto>();
                }
                currentType = "apply";
                currentBlock.Add(entry);
            }
            else if (currentType != "other")
            {
                // Проверяем завершение текущей операции
                bool isComplete = false;
                
                if (currentType == "plan")
                {
                    isComplete = planCompletePatterns.Any(pattern => Regex.IsMatch(message, pattern, RegexOptions.IgnoreCase));
                }
                else if (currentType == "apply")
                {
                    isComplete = applyCompletePatterns.Any(pattern => Regex.IsMatch(message, pattern, RegexOptions.IgnoreCase));
                }
                
                currentBlock.Add(entry);
                
                // Если операция завершена, возвращаемся к other
                if (isComplete)
                {
                    result.Add(CreateOperationBlock(currentType, currentBlock));
                    currentBlock = new List<ProcessedLogsDto>();
                    currentType = "other";
                }
            }
            else
            {
                // Просто добавляем в блок other
                currentBlock.Add(entry);
            }
        }
        
        // Добавляем последний блок если он не пустой
        if (currentBlock.Any())
        {
            result.Add(CreateOperationBlock(currentType, currentBlock));
        }
        
        return result;
    }

    private DTOs.LogParseService.TerraformOperationBlockDto CreateOperationBlock(string type, List<ProcessedLogsDto> entries)
    {
        return new DTOs.LogParseService.TerraformOperationBlockDto
        {
            Type = type,
            Logs = entries,
            LogCount = entries.Count,
            StartTime = entries.First().Timestamp,
            EndTime = entries.Last().Timestamp,
            Id = Guid.NewGuid().ToString(),
            FirstTimeStamp = entries.First().Timestamp,
            LastTimeStamp = entries.Last().Timestamp
        };
    }
}