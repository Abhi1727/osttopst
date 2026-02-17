using System;
using System.IO;

namespace PstConverter.Data;

public static class StorageConstants
{
    private static readonly string _baseDir = AppDomain.CurrentDomain.BaseDirectory;

    // We aim for a consistent path in App_Data/PstConverter_Uploads relative to the app base
    public static readonly string UploadDir = Path.Combine(_baseDir, "App_Data", "PstConverter_Uploads");

    static StorageConstants()
    {
        if (!Directory.Exists(UploadDir))
        {
            Directory.CreateDirectory(UploadDir);
        }
    }
}
