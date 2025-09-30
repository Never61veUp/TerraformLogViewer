namespace LogViewer.Application.Abstractions;

public interface ITimeStampService
{
    DateTimeOffset? ExtractTimestamp(string line);
}