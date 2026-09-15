using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FrankieTattoo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerInternalNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InternalNotes",
                table: "Customers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InternalNotes",
                table: "Customers");
        }
    }
}
