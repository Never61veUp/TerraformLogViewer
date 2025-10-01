using LogViewer.Core.Model.Enum;

namespace LogViewer.Core.Model;

public enum TerraformSection
{
    Unknown,
    Plan,
    Apply,
    Destroy,
    Error
}

public sealed class LogEntry
{
    public string Raw { get; set; } = string.Empty;
    public TerraformSection Section { get; set; } = TerraformSection.Unknown;
    public DateTimeOffset? Timestamp { get; set; }
    public LogLevel Level { get; set; } = LogLevel.Unknown;
    public string? Message { get; set; }
}