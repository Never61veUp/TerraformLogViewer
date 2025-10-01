using LogLevel = LogViewer.Core.Model.Enum.LogLevel;

namespace LogViewer.Application.Abstractions;

public interface ILogLevelDetector
{
    LogLevel DetectLogLevel(string line, LogLevel previousLevel);
}