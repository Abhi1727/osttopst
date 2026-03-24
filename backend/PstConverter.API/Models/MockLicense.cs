using System;
using System.ComponentModel.DataAnnotations;

namespace PstConverter.Models
{
    public class MockLicense
    {
        [Key]
        public string LicenseId { get; set; } = string.Empty; // email address
        public LicenseTier Tier { get; set; } = LicenseTier.Demo;
        
        public int TotalItemsAllotted { get; set; }
        public int TotalItemsUsed { get; set; }
        
        public long TotalStorageAllotted { get; set; }
        public long TotalStorageUsed { get; set; }
        
        public int TotalDaysAllotted { get; set; }
        public DateTime ExpiryDate { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
