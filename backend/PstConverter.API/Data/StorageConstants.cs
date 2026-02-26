using System;
using System.IO;

namespace PstConverter.Data;

public static class StorageConstants
{
    private static readonly string _baseDir = AppDomain.CurrentDomain.BaseDirectory;//C:\app\backend\PstConverter.API\bin\Debug\net8.0

    // Use environment variable if set (Docker), otherwise default to "uploads" relative to app base
    public static readonly string UploadDir = Environment.GetEnvironmentVariable("UPLOAD_DIR")
                                              ?? Path.Combine(_baseDir, "uploads");

    static StorageConstants()
    {
        if (!Directory.Exists(UploadDir))
        {
            Directory.CreateDirectory(UploadDir);
        }
        Console.WriteLine($"[Storage] Upload directory: {UploadDir}");
    }
}
