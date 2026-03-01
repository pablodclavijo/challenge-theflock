using System.ComponentModel.DataAnnotations;
using Xunit;

namespace AdminPanel.Tests.Validation
{
    /// <summary>
    /// Tests for product input validation
    /// Covers all border cases for data validation rules
    /// </summary>
    public class ProductValidationTests
    {
        #region Name Validation Tests

        [Fact]
        public void Validate_ProductName_WithNull_FailsValidation()
        {
            // Arrange - Border case: null name
            var input = new IndexModel.InputModel
            {
                Name = null!,
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Contains(results, v => v.MemberNames.Contains("Name"));
        }

        [Fact]
        public void Validate_ProductName_WithEmpty_FailsValidation()
        {
            // Arrange - Border case: empty name
            var input = new IndexModel.InputModel
            {
                Name = "",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Contains(results, v => v.MemberNames.Contains("Name"));
        }

        [Fact]
        public void Validate_ProductName_WithWhitespace_FailsValidation()
        {
            // Arrange - Border case: whitespace only
            var input = new IndexModel.InputModel
            {
                Name = "   ",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Contains(results, v => v.MemberNames.Contains("Name"));
        }

        [Fact]
        public void Validate_ProductName_WithSingleCharacter_PassesValidation()
        {
            // Arrange - Border case: minimum length
            var input = new IndexModel.InputModel
            {
                Name = "A",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Name"));
        }

        [Fact]
        public void Validate_ProductName_With200Characters_PassesValidation()
        {
            // Arrange - Border case: exactly at max length
            var input = new IndexModel.InputModel
            {
                Name = new string('A', 200),
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Name"));
        }

        [Fact]
        public void Validate_ProductName_With201Characters_FailsValidation()
        {
            // Arrange - Border case: exceeds max length
            var input = new IndexModel.InputModel
            {
                Name = new string('A', 201),
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Contains(results, v => v.MemberNames.Contains("Name"));
        }

        [Theory]
        [InlineData("Product @#$%")]
        [InlineData("Product & Co.")]
        [InlineData("Product (TM)")]
        [InlineData("Product <tag>")]
        [InlineData("Product's Name")]
        [InlineData("Product \"Quoted\"")]
        public void Validate_ProductName_WithSpecialCharacters_PassesValidation(string name)
        {
            // Arrange - Border case: special characters
            var input = new IndexModel.InputModel
            {
                Name = name,
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Name"));
        }

        [Theory]
        [InlineData("Ñoño")]
        [InlineData("Café")]
        [InlineData("??")]
        [InlineData("??????")]
        [InlineData("???????")]
        public void Validate_ProductName_WithUnicode_PassesValidation(string name)
        {
            // Arrange - Border case: unicode characters
            var input = new IndexModel.InputModel
            {
                Name = name,
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Name"));
        }

        #endregion

        #region Description Validation Tests

        [Fact]
        public void Validate_Description_WithNull_FailsValidation()
        {
            // Arrange - Border case: null description
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = null!,
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Contains(results, v => v.MemberNames.Contains("Description"));
        }

        [Fact]
        public void Validate_Description_WithEmpty_FailsValidation()
        {
            // Arrange - Border case: empty description ([Required] does not allow empty strings)
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert - [Required] on string does not allow empty string
            Assert.Contains(results, v => v.MemberNames.Contains("Description"));
        }

        [Fact]
        public void Validate_Description_WithVeryLongText_PassesValidation()
        {
            // Arrange - Border case: very long description
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = new string('D', 10000),
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert - No max length on Description
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Description"));
        }

        [Fact]
        public void Validate_Description_WithNewlines_PassesValidation()
        {
            // Arrange - Border case: multiline text
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Line 1\nLine 2\rLine 3\r\nLine 4",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Description"));
        }

        #endregion

        #region Price Validation Tests

        [Theory]
        [InlineData(0)]
        [InlineData(0.00)]
        [InlineData(-0.01)]
        [InlineData(-1)]
        [InlineData(-999999.99)]
        public void Validate_Price_WithZeroOrNegative_FailsValidation(decimal price)
        {
            // Arrange - Border case: invalid prices
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = price,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Contains(results, v => v.MemberNames.Contains("Price"));
        }

        [Fact]
        public void Validate_Price_WithMinimumValue_PassesValidation()
        {
            // Arrange - Border case: minimum valid price
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 0.01m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Price"));
        }

        [Fact]
        public void Validate_Price_WithMaximumValue_PassesValidation()
        {
            // Arrange - Border case: maximum valid price
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 999999.99m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Price"));
        }

        [Fact]
        public void Validate_Price_WithExceedingMaximum_FailsValidation()
        {
            // Arrange - Border case: exceeds maximum
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 1000000.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Contains(results, v => v.MemberNames.Contains("Price"));
        }

        [Theory]
        [InlineData(0.001)]
        [InlineData(0.009)]
        public void Validate_Price_WithHighPrecision_FailsValidation(decimal price)
        {
            // Arrange - Border case: high decimal precision below minimum
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = price,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert - Values below 0.01 fail [Range] validation
            Assert.Contains(results, v => v.MemberNames.Contains("Price"));
        }

        [Theory]
        [InlineData(10.001)]
        [InlineData(99.999)]
        [InlineData(123.456789)]
        public void Validate_Price_WithHighPrecisionAboveMinimum_PassesValidation(decimal price)
        {
            // Arrange - Border case: high decimal precision above minimum
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = price,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert - Validation passes, but DB may round
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Price"));
        }

        #endregion

        #region Stock Validation Tests

        [Fact]
        public void Validate_Stock_WithZero_PassesValidation()
        {
            // Arrange - Border case: zero stock
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 0,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Stock"));
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(-100)]
        [InlineData(int.MinValue)]
        public void Validate_Stock_WithNegative_FailsValidation(int stock)
        {
            // Arrange - Border case: negative stock
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = stock,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Contains(results, v => v.MemberNames.Contains("Stock"));
        }

        [Fact]
        public void Validate_Stock_WithMaxInt_PassesValidation()
        {
            // Arrange - Border case: maximum stock value
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = int.MaxValue,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Stock"));
        }

        [Theory]
        [InlineData(1)]
        [InlineData(10)]
        [InlineData(100)]
        [InlineData(1000)]
        [InlineData(10000)]
        public void Validate_Stock_WithVariousPositiveValues_PassesValidation(int stock)
        {
            // Arrange
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = stock,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Stock"));
        }

        #endregion

        #region CategoryId Validation Tests

        [Fact]
        public void Validate_CategoryId_WithZero_PassesValidation()
        {
            // Arrange - Note: [Required] on int doesn't validate the value, only presence
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 0
            };

            // Act
            var results = ValidateModel(input);

            // Assert - [Required] on int is always satisfied, so this passes validation
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("CategoryId"));
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(-100)]
        public void Validate_CategoryId_WithNegative_PassesValidation(int categoryId)
        {
            // Arrange - Note: [Required] on int doesn't validate the value
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = categoryId
            };

            // Act
            var results = ValidateModel(input);

            // Assert - [Required] on int is always satisfied
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("CategoryId"));
        }

        [Theory]
        [InlineData(1)]
        [InlineData(999)]
        [InlineData(int.MaxValue)]
        public void Validate_CategoryId_WithPositiveValue_PassesValidation(int categoryId)
        {
            // Arrange
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = categoryId
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("CategoryId"));
        }

        #endregion

        #region IsActive Validation Tests

        [Theory]
        [InlineData(true)]
        [InlineData(false)]
        public void Validate_IsActive_WithBooleanValue_PassesValidation(bool isActive)
        {
            // Arrange
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                IsActive = isActive
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Empty(results.Where(v => v.MemberNames.Contains("IsActive")));
        }

        #endregion

        #region Complete Model Validation Tests

        [Fact]
        public void Validate_CompleteValidModel_PassesValidation()
        {
            // Arrange - Happy path
            var input = new IndexModel.InputModel
            {
                Name = "Valid Product",
                Description = "Valid Description",
                Price = 99.99m,
                Stock = 10,
                CategoryId = 1,
                IsActive = true
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Empty(results);
        }

        [Fact]
        public void Validate_ModelWithAllRequiredFieldsMissing_FailsMultipleValidations()
        {
            // Arrange - Border case: all required fields missing
            var input = new IndexModel.InputModel
            {
                Name = null!,
                Description = null!,
                Price = 0,
                Stock = -1,
                CategoryId = 0
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.True(results.Count >= 4); // At least Name, Description, Price, CategoryId
        }

        [Fact]
        public void Validate_ModelWithMinimumValidValues_PassesValidation()
        {
            // Arrange - Border case: minimum valid values
            var input = new IndexModel.InputModel
            {
                Name = "A",
                Description = "D", // Must have at least one character
                Price = 0.01m,
                Stock = 0,
                CategoryId = 1,
                IsActive = false
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Empty(results);
        }

        [Fact]
        public void Validate_ModelWithMaximumValidValues_PassesValidation()
        {
            // Arrange - Border case: maximum valid values
            var input = new IndexModel.InputModel
            {
                Name = new string('A', 200),
                Description = new string('D', 50000),
                Price = 999999.99m,
                Stock = int.MaxValue,
                CategoryId = int.MaxValue,
                IsActive = true
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Empty(results);
        }

        #endregion

        #region Optional Fields Tests

        [Fact]
        public void Validate_ImageFile_WithNull_PassesValidation()
        {
            // Arrange - Border case: optional field
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                ImageFile = null
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("ImageFile"));
        }

        [Fact]
        public void Validate_RemoveImage_DefaultsFalse_PassesValidation()
        {
            // Arrange
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                RemoveImage = false
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Empty(results);
        }

        [Fact]
        public void Validate_RemoveImage_SetTrue_PassesValidation()
        {
            // Arrange
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1,
                RemoveImage = true
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Empty(results);
        }

        #endregion

        #region Update Scenario Tests

        [Fact]
        public void Validate_UpdateModel_WithId_PassesValidation()
        {
            // Arrange - Border case: update with ID
            var input = new IndexModel.InputModel
            {
                Id = 1,
                Name = "Updated Product",
                Description = "Updated",
                Price = 50.00m,
                Stock = 10,
                CategoryId = 1,
                IsActive = true
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Empty(results);
        }

        [Fact]
        public void Validate_UpdateModel_WithNullId_PassesValidation()
        {
            // Arrange - Border case: create with null ID
            var input = new IndexModel.InputModel
            {
                Id = null,
                Name = "New Product",
                Description = "New",
                Price = 50.00m,
                Stock = 10,
                CategoryId = 1,
                IsActive = true
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Empty(results);
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(-999)]
        public void Validate_UpdateModel_WithNegativeId_PassesValidation(int id)
        {
            // Arrange - Border case: negative ID (validation doesn't check this)
            var input = new IndexModel.InputModel
            {
                Id = id,
                Name = "Test",
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert - ID validation happens at service level, not model validation
            Assert.Empty(results);
        }

        #endregion

        #region Combined Invalid Fields Tests

        [Fact]
        public void Validate_MultipleFieldsInvalid_ReturnsAllErrors()
        {
            // Arrange - Border case: multiple validation errors
            var input = new IndexModel.InputModel
            {
                Name = new string('A', 201), // Too long
                Description = null!, // Required
                Price = 0, // Below minimum
                Stock = -1, // Negative
                CategoryId = 0 // Required/invalid
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.True(results.Count >= 4);
            Assert.Contains(results, v => v.MemberNames.Contains("Name"));
            Assert.Contains(results, v => v.MemberNames.Contains("Description"));
            Assert.Contains(results, v => v.MemberNames.Contains("Price"));
            Assert.Contains(results, v => v.MemberNames.Contains("Stock"));
        }

        #endregion

        #region Edge Cases for Decimal Values

        [Theory]
        [InlineData(0.0001)]
        [InlineData(0.009)]
        public void Validate_Price_BelowMinimum_FailsValidation(decimal price)
        {
            // Arrange - Border case: just below minimum
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = price,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Contains(results, v => v.MemberNames.Contains("Price"));
        }

        [Theory]
        [InlineData(999999.991)]
        [InlineData(999999.999)]
        [InlineData(1000000)]
        public void Validate_Price_AboveMaximum_FailsValidation(decimal price)
        {
            // Arrange - Border case: just above maximum
            var input = new IndexModel.InputModel
            {
                Name = "Test",
                Description = "Test",
                Price = price,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.Contains(results, v => v.MemberNames.Contains("Price"));
        }

        #endregion

        #region String Length Edge Cases

        [Theory]
        [InlineData(1)]
        [InlineData(50)]
        [InlineData(100)]
        [InlineData(199)]
        [InlineData(200)]
        public void Validate_Name_WithVariousLengths_PassesValidation(int length)
        {
            // Arrange - Border case: various valid lengths
            var input = new IndexModel.InputModel
            {
                Name = new string('A', length),
                Description = "Test",
                Price = 10.00m,
                Stock = 5,
                CategoryId = 1
            };

            // Act
            var results = ValidateModel(input);

            // Assert
            Assert.DoesNotContain(results, v => v.MemberNames.Contains("Name"));
        }

        #endregion

        #region Helper Methods

        private List<ValidationResult> ValidateModel(object model)
        {
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(model);
            Validator.TryValidateObject(model, validationContext, validationResults, true);
            return validationResults;
        }

        private Product CreateTestProduct(string name, int categoryId)
        {
            return new Product
            {
                Name = name,
                Description = $"Description for {name}",
                Price = 10.00m,
                Stock = 5,
                CategoryId = categoryId,
                IsActive = true
            };
        }

        #endregion
    }
}
