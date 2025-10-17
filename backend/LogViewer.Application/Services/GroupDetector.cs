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

        var planPatterns = new[] { @"terraform\s+plan", @"starting\s+Plan\s+operation", @"CLI\s+args:[^]]*plan[^]]*\]", @"CLI\s+command\s+args:[^]]*plan[^]]*\]", @"""plan""", @"\[\s*[^]]*""plan""[^]]*\]" };
        var applyPatterns = new[] { @"terraform\s+apply", @"starting\s+Apply\s+operation", @"CLI\s+args:[^]]*apply[^]]*\]", @"CLI\s+command\s+args:[^]]*apply[^]]*\]", @"""apply""", @"\[\s*[^]]*""apply""[^]]*\]" };

        foreach (var entry in logEntries)
        {
            var message = entry.Message ?? "";
            var operationType = planPatterns.Any(pattern => Regex.IsMatch(message, pattern, RegexOptions.IgnoreCase)) ? "plan" :
                applyPatterns.Any(pattern => Regex.IsMatch(message, pattern, RegexOptions.IgnoreCase)) ? "apply" : "other";

            groups[operationType].Add(entry);
        }

        return groups;
    }
}