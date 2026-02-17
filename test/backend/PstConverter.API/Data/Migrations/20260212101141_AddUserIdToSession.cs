using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PstConverter.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "ConversionSessions",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "ConversionSessions");
        }
    }
}
