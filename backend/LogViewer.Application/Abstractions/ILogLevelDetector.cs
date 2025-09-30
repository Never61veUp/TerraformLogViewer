using LogViewer.Core.Model.Enum;
using Microsoft.Extensions.Logging;
using LogLevel = LogViewer.Core.Model.Enum.LogLevel;

namespace LogViewer.Application.Abstractions;

public interface ILogLevelDetector
{
    LogLevel DetectLogLevel(string line, LogLevel previousLevel);
}