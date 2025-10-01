using LogViewer.Application.Abstractions;
using LogViewer.Core.Model.Enum;

namespace LogViewer.Application.Services;

public sealed class LogLevelDetector : ILogLevelDetector
{
    public LogLevel DetectLogLevel(string line, LogLevel previousLevel)
    {
        var lower = line.ToLower();
        var scores = new Dictionary<LogLevel, double>
        {
            { LogLevel.Error, 0 },
            { LogLevel.Warn, 0 },
            { LogLevel.Info, 0 },
            { LogLevel.Debug, 0 },
            { LogLevel.Trace, 0 }
        };

        if (lower.Contains("panic:") || lower.Contains("[error]") || lower.Contains("error"))
            scores[LogLevel.Error] += 0.8;
        if (lower.Contains("[warn]") || lower.Contains("warning"))
            scores[LogLevel.Warn] += 0.2;
        if (lower.Contains("[info]") || lower.Contains("info"))
            scores[LogLevel.Info] += 0.15;
        if (lower.Contains("[debug]") || lower.Contains("debug"))
            scores[LogLevel.Debug] += 0.1;
        if (lower.Contains("[trace]") || lower.Contains("trace"))
            scores[LogLevel.Trace] += 0.05;

        var maxScore = scores.MaxBy(kv => kv.Value);

        if (maxScore.Value == 0)
            return previousLevel;

        return maxScore.Key;
    }
}