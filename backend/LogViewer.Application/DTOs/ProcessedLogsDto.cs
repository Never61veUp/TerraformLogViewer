using System.Text.Json.Serialization;

namespace LogViewer.Application.DTOs;

public class ProcessedLogsDto
{
    // Основные системные поля
    [JsonPropertyName("@level")] public string Level { get; set; } = string.Empty;

    [JsonPropertyName("@message")] public string Message { get; set; } = string.Empty;

    [JsonPropertyName("@timestamp")] public DateTime Timestamp { get; set; }

    // Модули и компоненты
    [JsonPropertyName("@module")] public string? Module { get; set; }

    [JsonPropertyName("@caller")] public string? Caller { get; set; }

    // RPC и идентификаторы
    [JsonPropertyName("tf_rpc")]
    public string? TfRpc { get; set; }

    [JsonPropertyName("tf_req_id")] public string? TfReqId { get; set; }

    [JsonPropertyName("tf_proto_version")] public string? TfProtoVersion { get; set; }

    // Ресурсы и провайдеры
    [JsonPropertyName("tf_provider_addr")] public string? TfProviderAddr { get; set; }

    [JsonPropertyName("tf_resource_type")]
    public string? TfResourceType { get; set; }
    
    // Поля плагинов
    [JsonPropertyName("path")]
    public string? Path { get; set; }
    
    [JsonPropertyName("pid")]
    public int? Pid { get; set; }
    
    [JsonPropertyName("args")]
    public string[]? Args { get; set; }
    
    [JsonPropertyName("plugin")]
    public string? Plugin { get; set; }
    
    [JsonPropertyName("id")]
    public string? Id { get; set; }
    
    [JsonPropertyName("address")]
    public string? Address { get; set; }
    
    [JsonPropertyName("network")]
    public string? Network { get; set; }
    
    [JsonPropertyName("version")]
    public int? Version { get; set; }
    
    // Диагностика и ошибки
    [JsonPropertyName("diagnostic_error_count")]
    public int? DiagnosticErrorCount { get; set; }
    
    [JsonPropertyName("diagnostic_warning_count")]
    public int? DiagnosticWarningCount { get; set; }
    
    [JsonPropertyName("err")]
    public string? Error { get; set; }
    
    // Временные метки и производительность
    [JsonPropertyName("timestamp")]
    public string? TimestampString { get; set; }
    
    [JsonPropertyName("tf_req_duration_ms")]
    public int? TfReqDurationMs { get; set; }

    [JsonPropertyName("tf_data_source_type")]
    public string? TfDataSourceType { get; set; }
    
    // Capabilities
    [JsonPropertyName("tf_server_capability_get_provider_schema_optional")]
    public bool? TfServerCapabilityGetProviderSchemaOptional { get; set; }
    
    [JsonPropertyName("tf_server_capability_move_resource_state")]
    public bool? TfServerCapabilityMoveResourceState { get; set; }
    
    [JsonPropertyName("tf_server_capability_plan_destroy")]
    public bool? TfServerCapabilityPlanDestroy { get; set; }
    
    [JsonPropertyName("tf_client_capability_write_only_attributes_allowed")]
    public bool? TfClientCapabilityWriteOnlyAttributesAllowed { get; set; }
    
    // Различные дополнительные поля
    [JsonPropertyName("level")]
    public int? NumericLevel { get; set; }
    
    // Все остальные неизвестные поля
    [JsonExtensionData]
    public Dictionary<string, object>? AdditionalData { get; set; }
}