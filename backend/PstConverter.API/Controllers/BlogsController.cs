using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;
using PstConverter.Services;


namespace PstConverter.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BlogsController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IImageKitService _imageKitService;
        private readonly string _frontendPublicPath;
        private readonly string _blogsDirectory;
        private readonly string _blogsJsonPath;
        private static readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };

        public BlogsController(IWebHostEnvironment env, IConfiguration configuration, IImageKitService imageKitService)
        {
            _configuration = configuration;
            _imageKitService = imageKitService;
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

        private bool IsAdmin()
        {
            string[] adminEmails = _configuration.GetSection("Clerk:AdminEmails").Get<string[]>() ?? [];
            string[] adminUserIds = _configuration.GetSection("Clerk:AdminUserIds").Get<string[]>() ?? [];

            // Clerk might put the email in various claims depending on JWT template.
            // We check 'email', 'emails', or the 'sub-as-name' fallback (User ID).
            var userInfo = User.FindFirstValue(ClaimTypes.Email)
                          ?? User.FindFirstValue("email")
                          ?? User.Identity?.Name; // Fallback to 'sub' if mapped to Name

            Console.WriteLine($"[BlogsController] Checking Admin Status for Info: '{userInfo}'");
            Console.WriteLine($"[BlogsController] Admin Emails count: {adminEmails.Length}");
            Console.WriteLine($"[BlogsController] Admin User IDs count: {adminUserIds.Length}");
            
            bool isAdmin = !string.IsNullOrEmpty(userInfo) && 
                          (adminEmails.Contains(userInfo, StringComparer.OrdinalIgnoreCase) || 
                           adminUserIds.Contains(userInfo, StringComparer.OrdinalIgnoreCase));
                           
            Console.WriteLine($"[BlogsController] Final IsAdmin Result: {isAdmin}");
            return isAdmin;
        }

        [HttpGet]
        [AllowAnonymous]
        //this  is for get all blogs
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
        [Authorize]
        //this  is for create blog
        public async Task<IActionResult> CreateBlog([FromForm] IFormCollection formData)
        {
            if (!IsAdmin())
            {
                return StatusCode(403, new { message = "You do not have permission to perform this action." });
            }
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
                    else slug = $"{slug}-{id}"; // Make auto-generated slugs unique
                }

                // 2. Handle Image Processing (ImageKit.io)
                var thumbnailFile = formData.Files.FirstOrDefault(f => f.Name == "thumbnail");
                string thumbnailRelativePath = "";

                if (thumbnailFile != null && thumbnailFile.Length > 0)
                {
                    Console.WriteLine($"[BlogsController] Found file upload: {thumbnailFile.FileName}. Uploading to ImageKit...");
                    var fileName = $"thumb_{id}{Path.GetExtension(thumbnailFile.FileName)}";
                    thumbnailRelativePath = await _imageKitService.UploadImageAsync(thumbnailFile, fileName) ?? "";
                }
                else
                {
                    var defaultImage = formData["defaultImage"].ToString();
                    if (!string.IsNullOrEmpty(defaultImage) && defaultImage.StartsWith("data:image/"))
                    {
                        try
                        {
                            var commaIndex = defaultImage.IndexOf(',');
                            if (commaIndex >= 0)
                            {
                                var base64Data = defaultImage[(commaIndex + 1)..];
                                var contentType = defaultImage[5..commaIndex].Split(';')[0];
                                var extension = contentType switch
                                {
                                    "image/jpeg" => ".jpg",
                                    "image/png" => ".png",
                                    "image/gif" => ".gif",
                                    "image/webp" => ".webp",
                                    _ => ".png"
                                };

                                var bytes = Convert.FromBase64String(base64Data);
                                var fileName = $"thumb_{id}{extension}";
                                thumbnailRelativePath = await _imageKitService.UploadImageAsync(bytes, fileName) ?? "";
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[BlogsController] ImageKit Base64 upload failed: {ex.Message}");
                        }
                    }
                }

                if (string.IsNullOrEmpty(thumbnailRelativePath))
                {
                    var defaultImage = formData["defaultImage"].ToString();
                    thumbnailRelativePath = (string.IsNullOrEmpty(defaultImage) || defaultImage == "null")
                        ? "/blogs/media/default.png"
                        : defaultImage;
                }

                // 3. Update JSON Database
                List<object> blogs = [];

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
        [Authorize]
        //this  is for delete blog
        public async Task<IActionResult> DeleteBlog(long id)
        {
            if (!IsAdmin())
            {
                return StatusCode(403, new { message = "You do not have permission to perform this action." });
            }
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
                        // Handle both number and string ID types gracefully.
                        
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
