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
            // Robust path calculation: Find repo root by looking for 'frontend' directory upwards 
            // starting from the content root path.
            var root = env.ContentRootPath;
            Console.WriteLine($"[BlogsController] ContentRootPath: {root}");
            
            // Go up until we find the directory containing 'frontend' folder
            while (!string.IsNullOrEmpty(root) && !Directory.Exists(Path.Combine(root, "frontend")))
            {
                var parent = Directory.GetParent(root);
                if (parent == null) break;
                root = parent.FullName;
            }

            Console.WriteLine($"[BlogsController] Resolved Repo Root: {root}");

            _frontendPublicPath = Path.Combine(root, "frontend", "public");
            _blogsDirectory = Path.Combine(_frontendPublicPath, "blogs");
            _blogsJsonPath = Path.Combine(_blogsDirectory, "blogs.json");

            Console.WriteLine($"[BlogsController] Static Assets Path: {_frontendPublicPath}");
            Console.WriteLine($"[BlogsController] Blogs JSON Path: {_blogsJsonPath}");

            // Ensure directories exist
            if (!Directory.Exists(_blogsDirectory))
            {
                Console.WriteLine($"[BlogsController] Creating directory: {_blogsDirectory}");
                Directory.CreateDirectory(_blogsDirectory);
            }
            
            var mediaDir = Path.Combine(_blogsDirectory, "media");
            if (!Directory.Exists(mediaDir))
            {
                Console.WriteLine($"[BlogsController] Creating media directory: {mediaDir}");
                Directory.CreateDirectory(mediaDir);
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
                Console.WriteLine("\n[BlogsController] CREATE BLOG REQUEST RECEIVED");
                
                // 1. Read Metadata from FormData
                var title = formData["title"].ToString();
                var summary = formData["summary"].ToString();
                var category = formData["category"].ToString();
                var content = formData["content"].ToString();
                var author = formData["author"].ToString();
                var date = formData["date"].ToString();
                var readTime = formData["readTime"].ToString();
                
                Console.WriteLine($"[BlogsController] Title: {title}");

                // SEO Fields
                var altText = formData["altText"].ToString();
                var metaTitle = formData["metaTitle"].ToString();
                var metaDescription = formData["metaDescription"].ToString();
                var canonicalTag = formData["canonicalTag"].ToString();
                var slug = formData["slug"].ToString();
                var focusKeywords = formData["focusKeywords"].ToString();

                // Ensure ID is a long for timestamp parsing
                long id = string.IsNullOrEmpty(formData["id"]) ? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() : long.Parse(formData["id"]!);
                Console.WriteLine($"[BlogsController] ID: {id}");

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
                    
                    if (string.IsNullOrWhiteSpace(slug)) slug = id.ToString();
                }

                // 2. Handle Thumbnail Processing
                var thumbnailFile = formData.Files.FirstOrDefault(f => f.Name == "thumbnail");
                string thumbnailRelativePath = "";

                if (thumbnailFile != null && thumbnailFile.Length > 0)
                {
                    Console.WriteLine($"[BlogsController] Found file upload: {thumbnailFile.FileName} ({thumbnailFile.Length} bytes)");
                    var fileExtension = Path.GetExtension(thumbnailFile.FileName);
                    var newFileName = $"thumb_{id}{fileExtension ?? ".png"}";
                    var savePath = Path.Combine(_blogsDirectory, "media", newFileName);

                    using (var stream = new FileStream(savePath, FileMode.Create))
                    {
                        await thumbnailFile.CopyToAsync(stream);
                    }
                    thumbnailRelativePath = $"/blogs/media/{newFileName}";
                    Console.WriteLine($"[BlogsController] Saved file to: {savePath}");
                }
                else
                {
                    var defaultImage = formData["defaultImage"].ToString();
                    Console.WriteLine($"[BlogsController] No file upload. DefaultImage length: {defaultImage?.Length ?? 0}");
                    
                    if (!string.IsNullOrEmpty(defaultImage) && defaultImage.StartsWith("data:image/"))
                    {
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
                                Console.WriteLine($"[BlogsController] Saved base64 image to: {savePath}");
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[BlogsController] Base64 decoding failed: {ex.Message}");
                            thumbnailRelativePath = "/blogs/media/default.png";
                        }
                    }
                    else
                    {
                        thumbnailRelativePath = (string.IsNullOrEmpty(defaultImage) || defaultImage == "null" || defaultImage.Trim().ToLower() == "null")
                            ? "/blogs/media/default.png"
                            : defaultImage;
                        Console.WriteLine($"[BlogsController] Using fallback path: {thumbnailRelativePath}");
                    }
                }

                // 3. Update JSON Database
                List<object> blogs = new();
                if (System.IO.File.Exists(_blogsJsonPath))
                {
                    var existingJson = await System.IO.File.ReadAllTextAsync(_blogsJsonPath);
                    if (!string.IsNullOrWhiteSpace(existingJson))
                    {
                        blogs = JsonSerializer.Deserialize<List<object>>(existingJson) ?? new List<object>();
                    }
                }

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

                blogs.Insert(0, newBlog);
                var updatedJson = JsonSerializer.Serialize(blogs, _jsonOptions);
                await System.IO.File.WriteAllTextAsync(_blogsJsonPath, updatedJson);

                Console.WriteLine($"[BlogsController] SUCCESS: Blog '{title}' saved to {_blogsJsonPath}");
                return Ok(new { message = "Blog published successfully!", blog = newBlog });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[BlogsController] ERROR in CreateBlog: {ex.Message}");
                return StatusCode(500, new { message = "Error saving blog", details = ex.Message });
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
