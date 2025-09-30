using System.Reflection;
using LogViewer.Application.Abstractions;
using LogViewer.Application.Commands;
using LogViewer.Application.Services;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
var services = builder.Services;

// Add services to the container.
builder.Services.AddMediatR(cfg => 
    cfg.RegisterServicesFromAssembly(typeof(UploadJsonLogCommand).Assembly));

builder.Services.AddScoped<ILogParseService, LogParseService>();
builder.Services.AddScoped<ILogLevelDetector, LogLevelDetector>();
builder.Services.AddScoped<ITimeStampService, TimeStampService>();

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
// builder.Services.AddOpenApi();
services.AddEndpointsApiExplorer();
services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // app.MapOpenApi();
}


app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();