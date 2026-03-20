using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace PstConverter.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BlogsController : ControllerBase
    {
        // Path relative to the backend executing directory pointing to the frontend's public folder
        private readonly string _frontendPublicPath;
        private readonly string _blogsDirectory;
        private readonly string _blogsJsonPath;
        private static readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };

        public BlogsController(IWebHostEnvironment env)
        {
            // Calculate path to frontend/public from backend/PstConverter.API
            // Need to go: PstConverter.API -> backend -> repo root -> frontend/public
            var backendDir = Directory.GetParent(env.ContentRootPath)?.FullName ?? ""; // -> backend folder
            var repoRoot = Directory.GetParent(backendDir)?.FullName ?? "";             // -> repo root
            _frontendPublicPath = Path.Combine(repoRoot, "frontend", "public");
            _blogsDirectory = Path.Combine(_frontendPublicPath, "blogs");
            _blogsJsonPath = Path.Combine(_blogsDirectory, "blogs.json");

            // Ensure directories exist
            if (!Directory.Exists(_blogsDirectory))
            {
                Directory.CreateDirectory(_blogsDirectory);
            }
            if (!Directory.Exists(Path.Combine(_blogsDirectory, "media")))
            {
                Directory.CreateDirectory(Path.Combine(_blogsDirectory, "media"));
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetBlogs()
        {
            try
            {
                if (!System.IO.File.Exists(_blogsJsonPath))
                {
                    return Ok(new List<object>()); // Return empty list if no blogs yet
                }

                var json = await System.IO.File.ReadAllTextAsync(_blogsJsonPath);
                // Return raw json string to avoid parsing overhead, set content type
                return Content(json, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error reading blogs data", details = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateBlog([FromForm] IFormCollection formData)
        {
            try
            {
                // 1. Read Metadata from FormData
                var title = formData["title"].ToString();
                var summary = formData["summary"].ToString();
                var category = formData["category"].ToString();
                var content = formData["content"].ToString();
                var author = formData["author"].ToString();
                var date = formData["date"].ToString();
                var readTime = formData["readTime"].ToString();
                
                // SEO Fields
                var altText = formData["altText"].ToString();
                var metaTitle = formData["metaTitle"].ToString();
                var metaDescription = formData["metaDescription"].ToString();
                var canonicalTag = formData["canonicalTag"].ToString();
                var slug = formData["slug"].ToString();
                var focusKeywords = formData["focusKeywords"].ToString();

                // Ensure ID is a long for timestamp parsing
                long id = string.IsNullOrEmpty(formData["id"]) ? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() : long.Parse(formData["id"]!);

                // Generate slug if empty
                if (string.IsNullOrWhiteSpace(slug))
                {
                    slug = title.ToLowerInvariant()
                        .Replace(" ", "-")
                        .Replace("?", "")
                        .Replace("!", "")
                        .Replace(".", "")
                        .Replace(",", "")
                        .Replace(":", "")
                        .Replace(";", "")
                        .Trim('-');
                    
                    // Add partial timestamp to ensure uniqueness if needed, but for now just title-based
                    if (string.IsNullOrWhiteSpace(slug)) slug = id.ToString();
                }

                // 2. Handle Thumbnail Processing
                var thumbnailFile = formData.Files.FirstOrDefault(f => f.Name == "thumbnail");
                string thumbnailRelativePath = "";

                if (thumbnailFile != null && thumbnailFile.Length > 0)
                {
                    var fileExtension = Path.GetExtension(thumbnailFile.FileName);
                    var newFileName = $"thumb_{id}{fileExtension}";
                    var savePath = Path.Combine(_blogsDirectory, "media", newFileName);

                    using (var stream = new FileStream(savePath, FileMode.Create))
                    {
                        await thumbnailFile.CopyToAsync(stream);
                    }
                    thumbnailRelativePath = $"/blogs/media/{newFileName}";
                }
                else
                {
                    var defaultImage = formData["defaultImage"].ToString();
                    if (!string.IsNullOrEmpty(defaultImage) && defaultImage.StartsWith("data:image/"))
                    {
                        // Handle base64 image (auto-extracted or manually pasted if supported)
                        try
                        {
                            var commaIndex = defaultImage.IndexOf(',');
                            if (commaIndex >= 0)
                            {
                                var base64Data = defaultImage.Substring(commaIndex + 1);
                                var contentType = defaultImage.Substring(5, commaIndex - 5).Split(';')[0];
                                var extension = contentType switch
                                {
                                    "image/jpeg" => ".jpg",
                                    "image/png" => ".png",
                                    "image/gif" => ".gif",
                                    "image/webp" => ".webp",
                                    _ => ".png"
                                };

                                var bytes = Convert.FromBase64String(base64Data);
                                var newFileName = $"thumb_{id}{extension}";
                                var savePath = Path.Combine(_blogsDirectory, "media", newFileName);

                                await System.IO.File.WriteAllBytesAsync(savePath, bytes);
                                thumbnailRelativePath = $"/blogs/media/{newFileName}";
                            }
                        }
                        catch (Exception)
                        {
                            // Fallback if base64 parsing fails
                            thumbnailRelativePath = "/assets/blog/blog_email_migration_1772432378369.png";
                        }
                    }
                    else
                    {
                        // Fallback to a default string if provided, else use the migration image
                        thumbnailRelativePath = string.IsNullOrEmpty(defaultImage)
                            ? "/assets/blog/blog_email_migration_1772432378369.png"
                            : defaultImage;
                    }
                }

                // 3. Construct new Blog Object
                var newBlog = new
                {
                    id,
                    title,
                    summary,
                    category,
                    content,
                    author,
                    date,
                    readTime,
                    image = thumbnailRelativePath,
                    altText,
                    metaTitle,
                    metaDescription,
                    canonicalTag,
                    slug,
                    focusKeywords
                };

                // 4. Update JSON File
                List<object>? existingBlogs = [];
                if (System.IO.File.Exists(_blogsJsonPath))
                {
                    var existingJson = await System.IO.File.ReadAllTextAsync(_blogsJsonPath);
                    if (!string.IsNullOrWhiteSpace(existingJson))
                    {
                        existingBlogs = JsonSerializer.Deserialize<List<object>>(existingJson) ?? [];
                    }
                }

                existingBlogs.Insert(0, newBlog); // Add to beginning (latest first)

                var newJson = JsonSerializer.Serialize(existingBlogs, _jsonOptions);
                await System.IO.File.WriteAllTextAsync(_blogsJsonPath, newJson);

                return Ok(new { message = "Blog published successfully!", blog = newBlog });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to publish blog", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBlog(long id)
        {
            try
            {
                if (!System.IO.File.Exists(_blogsJsonPath))
                {
                    return NotFound(new { message = "No blogs found." });
                }

                var json = await System.IO.File.ReadAllTextAsync(_blogsJsonPath);

                // Using JsonDocument to parse dynamically since structure is somewhat loose
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (root.ValueKind != JsonValueKind.Array) return BadRequest("Invalid JSON structure");

                var updatedList = new List<JsonElement>();
                bool found = false;
                string imagePathToDelete = "";

                foreach (var item in root.EnumerateArray())
                {
                    if (item.TryGetProperty("id", out var idProp))
                    {
                        // Handle both number and string ID types gracefully
                        long currentId = 0;
                        if (idProp.ValueKind == JsonValueKind.Number) currentId = idProp.GetInt64();
                        else if (idProp.ValueKind == JsonValueKind.String && long.TryParse(idProp.GetString(), out var parsedId)) currentId = parsedId;

                        if (currentId == id)
                        {
                            found = true;
                            if (item.TryGetProperty("image", out var imageProp))
                            {
                                imagePathToDelete = imageProp.GetString() ?? "";
                            }
                            continue; // Skip adding this item to keep it deleted
                        }
                    }
                    updatedList.Add(item.Clone());
                }

                if (!found)
                {
                    return NotFound(new { message = "Blog with specified ID not found." });
                }

                // Delete associated media file if it's in the media folder
                if (!string.IsNullOrEmpty(imagePathToDelete) && imagePathToDelete.StartsWith("/blogs/media/"))
                {
                    // Convert relative web path back to local filesystem path
                    var fileName = Path.GetFileName(imagePathToDelete);
                    var absoluteMediaPath = Path.Combine(_blogsDirectory, "media", fileName);
                    if (System.IO.File.Exists(absoluteMediaPath))
                    {
                        System.IO.File.Delete(absoluteMediaPath);
                    }
                }

                var newJson = JsonSerializer.Serialize(updatedList, _jsonOptions);
                await System.IO.File.WriteAllTextAsync(_blogsJsonPath, newJson);

                return Ok(new { message = "Blog deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to delete blog", details = ex.Message });
            }
        }
    }
}
