using LogViewer.Application.DTOs;

namespace LogViewer.Application.DTOs;

public sealed partial class LogParseService
{
    public class TerraformOperationBlockDto
    {
        public string Type { get; set; } // "plan", "apply", "other"
        public List<ProcessedLogsDto> Logs { get; set; } = new List<ProcessedLogsDto>();
        public int LogCount { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Id { get; set; }
        public DateTime FirstTimeStamp { get; set; }
        public DateTime LastTimeStamp { get; set; }
    }
}