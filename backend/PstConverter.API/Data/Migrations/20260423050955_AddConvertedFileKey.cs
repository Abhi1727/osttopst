using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PstConverter.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConvertedFileKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConvertedFileKey",
                table: "ConversionSessions",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConvertedFileKey",
                table: "ConversionSessions");
        }
    }
}
