using System.Text.RegularExpressions;
using LogViewer.Application.Abstractions;

namespace LogViewer.Application.Services;

public sealed class TimeStampService : ITimeStampService
{
    private DateTimeOffset? _lastKnownDate;

    private readonly List<(Regex regex, Func<string, DateTimeOffset?> parser, double weight)> _patterns;

    public TimeStampService()
    {
        _patterns = new List<(Regex, Func<string, DateTimeOffset?>, double)>
        {
            // ISO8601
            (new Regex(@"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?",
                RegexOptions.Compiled),
             s => DateTimeOffset.TryParse(s, out var ts) ? ts : null, 1.0),

            // "2025-09-09 10:55:44 UTC"
            (new Regex(@"\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}(?:\sUTC)?",
                RegexOptions.Compiled),
             s => DateTimeOffset.TryParse(s, out var ts) ? ts : null, 0.9),

            // "10:55:44"
            (new Regex(@"\b\d{2}:\d{2}:\d{2}\b", RegexOptions.Compiled),
             s =>
             {
                 if (TimeSpan.TryParse(s, out var t))
                 {
                     var date = _lastKnownDate?.Date ?? DateTimeOffset.UtcNow.Date;
                     return new DateTimeOffset(date + t, TimeSpan.Zero);
                 }
                 return null;
             }, 0.7),

            // Unix Epoch
            (new Regex(@"\b\d{10}\b", RegexOptions.Compiled),
             s => long.TryParse(s, out var unix) 
                    ? DateTimeOffset.FromUnixTimeSeconds(unix) 
                    : null, 0.8),
        };
    }

    public DateTimeOffset? ExtractTimestamp(string line)
    {
        var candidates = new List<(DateTimeOffset ts, double weight)>();

        foreach (var (regex, parser, weight) in _patterns)
        {
            var match = regex.Match(line);
            if (match.Success)
            {
                var ts = parser(match.Value);
                if (ts != null)
                    candidates.Add((ts.Value, weight));
            }
        }

        if (candidates.Count == 0)
            return _lastKnownDate;
        
        var best = candidates.OrderByDescending(c => c.weight).First().ts;

        _lastKnownDate = best;
        return best;
    }
}