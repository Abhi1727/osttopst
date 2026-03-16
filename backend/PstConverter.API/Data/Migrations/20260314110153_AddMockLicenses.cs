using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PstConverter.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMockLicenses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MockLicenses",
                columns: table => new
                {
                    LicenseId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TotalItemsAllotted = table.Column<int>(type: "int", nullable: false),
                    TotalItemsUsed = table.Column<int>(type: "int", nullable: false),
                    TotalStorageAllotted = table.Column<long>(type: "bigint", nullable: false),
                    TotalStorageUsed = table.Column<long>(type: "bigint", nullable: false),
                    TotalDaysAllotted = table.Column<int>(type: "int", nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MockLicenses", x => x.LicenseId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MockLicenses");
        }
    }
}
