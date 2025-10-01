using LogViewer.Application.DTOs;

namespace LogViewer.Application.Services;

public interface IGroupDetector
{
    Dictionary<string, List<ProcessedLogsDto>> GroupLogsByOperationType(List<ProcessedLogsDto> logEntries);
}