using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PstConverter.Data.Migrations
{
    /// <inheritdoc />
    public partial class SyncWithMain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPaid",
                table: "ConversionSessions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "StoreGuid",
                table: "ConversionSessions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPaid",
                table: "ConversionSessions");

            migrationBuilder.DropColumn(
                name: "StoreGuid",
                table: "ConversionSessions");
        }
    }
}
