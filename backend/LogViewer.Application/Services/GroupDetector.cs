using System.Text.RegularExpressions;
using LogViewer.Application.Abstractions;
using LogViewer.Application.DTOs;

namespace LogViewer.Application.Services;

public sealed class GroupDetector : IGroupDetector
{
    public Dictionary<string, List<ProcessedLogsDto>> GroupLogsByOperationType(List<ProcessedLogsDto> logEntries)
    {
        var groups = new Dictionary<string, List<ProcessedLogsDto>>
        {
            ["plan"] = new(),
            ["apply"] = new(),
            ["other"] = new()
        };

        // Упрощенные регулярные выражения - ищем просто наличие операций в аргументах
        var planPatterns = new[]
        {
            @"terraform\s+plan", // terraform plan
            @"starting\s+Plan\s+operation", // starting Plan operation
            @"CLI\s+args:[^]]*plan[^]]*\]", // CLI args: [anything containing plan]
            @"CLI\s+command\s+args:[^]]*plan[^]]*\]", // CLI command args: [anything containing plan]
            @"""plan""", // "plan" в любом контексте CLI args
            @"\[\s*[^]]*""plan""[^]]*\]" // [anything containing "plan"]
        };

        var applyPatterns = new[]
        {
            @"terraform\s+apply", // terraform apply
            @"starting\s+Apply\s+operation", // starting Apply operation
            @"CLI\s+args:[^]]*apply[^]]*\]", // CLI args: [anything containing apply]
            @"CLI\s+command\s+args:[^]]*apply[^]]*\]", // CLI command args: [anything containing apply]
            @"""apply""", // "apply" в любом контексте CLI args
            @"\[\s*[^]]*""apply""[^]]*\]" // [anything containing "apply"]
        };

        foreach (var entry in logEntries)
        {
            var message = entry.Message ?? "";
            var operationType = "other";

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