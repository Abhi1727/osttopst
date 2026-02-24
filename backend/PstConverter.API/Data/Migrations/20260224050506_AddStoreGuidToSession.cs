using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PstConverter.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddStoreGuidToSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.AddColumn<string>(
                name: "StoreGuid",
                table: "ConversionSessions",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.DropColumn(
                name: "StoreGuid",
                table: "ConversionSessions");
        }
    }
}
