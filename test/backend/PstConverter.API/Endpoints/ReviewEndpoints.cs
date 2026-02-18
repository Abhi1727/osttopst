using PstConverter.Data;
using PstConverter.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace PstConverter.Endpoints;

public static class ReviewEndpoints
{
    public static void MapReviewEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/reviews").WithTags("Reviews");

        group.MapGet("/", async (AppDbContext db) =>
        {
            return await db.Reviews.OrderByDescending(r => r.CreatedAt).ToListAsync();
        })
        .WithName("GetReviews");

        group.MapPost("/", async (AppDbContext db, [FromBody] Review review) =>
        {
            review.CreatedAt = DateTime.Now;
            db.Reviews.Add(review);
            await db.SaveChangesAsync();
            return Results.Created($"/api/reviews/{review.Id}", review);
        })
        .WithName("CreateReview");
    }
}
