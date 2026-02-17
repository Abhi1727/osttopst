using Microsoft.AspNetCore.Mvc;

namespace PstConverter.Endpoints;

public static class HowItWorksEndpoints
{
    public static void MapHowItWorksEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/howitswork", () =>
        {
            var steps = new[]
            {
                new
                {
                    StepNumber = 1,
                    Title = "Upload OST File",
                    Description = "Drag and drop your .ost file into our secure online converter. We support massive files up to 50GB, ensuring no data is left behind.",
                    IconName = "UploadCloud"
                },
                new
                {
                    StepNumber = 2,
                    Title = "Automatic Conversion",
                    Description = "Our cloud-based engine processes your file instantly. We maintain your original folder structure, metadata, and data integrity throughout the entire process.",
                    IconName = "Cpu"
                },
                new
                {
                    StepNumber = 3,
                    Title = "Download PST",
                    Description = "Once finished, download your converted PST file instantly. For your peace of mind, files are automatically deleted after 24 hours to ensure your privacy.",
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
