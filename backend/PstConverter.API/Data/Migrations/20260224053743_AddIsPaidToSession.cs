using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PstConverter.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPaidToSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPaid",
                table: "ConversionSessions",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPaid",
                table: "ConversionSessions");
        }
    }
}
