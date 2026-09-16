using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FrankieTattoo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddConsentForms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ConsentFormId",
                table: "Appointments",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ConsentForms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClientName = table.Column<string>(type: "text", nullable: false),
                    IdentificationNumber = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    Age = table.Column<int>(type: "integer", nullable: false),
                    ProcedureType = table.Column<string>(type: "text", nullable: false),
                    BodyArea = table.Column<string>(type: "text", nullable: false),
                    IsAdultConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    NoAlcoholOrDrugs = table.Column<bool>(type: "boolean", nullable: false),
                    NoSevereConditions = table.Column<bool>(type: "boolean", nullable: false),
                    NotPregnantOrNursing = table.Column<bool>(type: "boolean", nullable: false),
                    AcceptsCareProtocol = table.Column<bool>(type: "boolean", nullable: false),
                    SignatureData = table.Column<string>(type: "text", nullable: false),
                    SignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerId = table.Column<int>(type: "integer", nullable: true),
                    AppointmentId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsentForms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConsentForms_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ConsentForms_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConsentForms_AppointmentId",
                table: "ConsentForms",
                column: "AppointmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ConsentForms_CustomerId",
                table: "ConsentForms",
                column: "CustomerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConsentForms");

            migrationBuilder.DropColumn(
                name: "ConsentFormId",
                table: "Appointments");
        }
    }
}
