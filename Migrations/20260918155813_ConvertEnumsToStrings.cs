using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FrankieTattoo.Api.Migrations
{
    /// <inheritdoc />
    public partial class ConvertEnumsToStrings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Products"" ALTER COLUMN ""Type"" TYPE text USING 
                    CASE ""Type""
                        WHEN 0 THEN 'Tattoo'
                        WHEN 1 THEN 'Piercing'
                        WHEN 2 THEN 'SmokeShop'
                        WHEN 3 THEN 'Artesania'
                        ELSE 'Piercing'
                    END;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE ""PortfolioItems"" ALTER COLUMN ""Category"" TYPE text USING 
                    CASE ""Category""
                        WHEN 0 THEN 'Tattoo'
                        WHEN 1 THEN 'Piercing'
                        WHEN 2 THEN 'SmokeShop'
                        WHEN 3 THEN 'Artesania'
                        ELSE 'Tattoo'
                    END;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE ""Appointments"" ALTER COLUMN ""Type"" TYPE text USING 
                    CASE ""Type""
                        WHEN 0 THEN 'Tattoo'
                        WHEN 1 THEN 'Piercing'
                        WHEN 2 THEN 'SmokeShop'
                        WHEN 3 THEN 'Artesania'
                        ELSE 'Tattoo'
                    END;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE ""Appointments"" ALTER COLUMN ""Status"" TYPE text USING 
                    CASE ""Status""
                        WHEN 0 THEN 'Pending'
                        WHEN 1 THEN 'Confirmed'
                        WHEN 2 THEN 'Completed'
                        WHEN 3 THEN 'Cancelled'
                        ELSE 'Pending'
                    END;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Products"" ALTER COLUMN ""Type"" TYPE integer USING 
                    CASE ""Type""
                        WHEN 'Tattoo' THEN 0
                        WHEN 'Piercing' THEN 1
                        WHEN 'SmokeShop' THEN 2
                        WHEN 'Artesania' THEN 3
                        ELSE 1
                    END;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE ""PortfolioItems"" ALTER COLUMN ""Category"" TYPE integer USING 
                    CASE ""Category""
                        WHEN 'Tattoo' THEN 0
                        WHEN 'Piercing' THEN 1
                        WHEN 'SmokeShop' THEN 2
                        WHEN 'Artesania' THEN 3
                        ELSE 0
                    END;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE ""Appointments"" ALTER COLUMN ""Type"" TYPE integer USING 
                    CASE ""Type""
                        WHEN 'Tattoo' THEN 0
                        WHEN 'Piercing' THEN 1
                        WHEN 'SmokeShop' THEN 2
                        WHEN 'Artesania' THEN 3
                        ELSE 0
                    END;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE ""Appointments"" ALTER COLUMN ""Status"" TYPE integer USING 
                    CASE ""Status""
                        WHEN 'Pending' THEN 0
                        WHEN 'Confirmed' THEN 1
                        WHEN 'Completed' THEN 2
                        WHEN 'Cancelled' THEN 3
                        ELSE 0
                    END;
            ");
        }
    }
}
