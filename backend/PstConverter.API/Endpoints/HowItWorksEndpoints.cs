using Microsoft.AspNetCore.Mvc;

namespace PstConverter.Endpoints;

public static class HowItWorksEndpoints
{
    /// <summary>
    /// Extension method to map the 'How It Works' documentation endpoint.
    /// </summary>
    /// <param name="app">The IEndpointRouteBuilder instance.</param>
    public static void MapHowItWorksEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/howitswork", () =>
        {
            var steps = new[]
            {
                new
                {
                    StepNumber = 1,
                    Title = "Upload the OST File",
                    Description = "You can use drag and drop to upload your .ost file to online converter. We support files up to 50GB.",
                    IconName = "UploadCloud"
                },
                new
                {
                    StepNumber = 2,
                    Title = "Automatic Conversion",
                    Description = "Your file is instantly converted by our cloud engine. We keep your original folder structure, metadata, and data integrity safe the whole time.",
                    IconName = "Cpu"
                },
                new
                {
                    StepNumber = 3,
                    Title = "Get PST",
                    Description = "You can download your converted PST file right after. For your peace of mind, files are deleted automatically after 24 hours as we respect your privacy.",
                    IconName = "Download"
                }
            };

            return Results.Ok(steps);
        })
        .WithName("GetHowItWorks")
        .WithTags("General")
        .WithSummary("Get the steps for how the converter works");
    }
}
