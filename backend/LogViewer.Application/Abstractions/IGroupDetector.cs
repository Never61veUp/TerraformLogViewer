using LogViewer.Application.DTOs;

namespace LogViewer.Application.Abstractions;

public interface IGroupDetector
{
    Dictionary<string, List<ProcessedLogsDto>> GroupLogsByOperationType(List<ProcessedLogsDto> logEntries);
}