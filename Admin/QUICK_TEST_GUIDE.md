# Quick Test Guide

## Run All Tests
```bash
dotnet test AdminPanel.Tests/AdminPanel.Tests.csproj
```

**Expected Output:** ? 662 tests passed

---

## Run Specific Test Suites

### Category Service Tests (40 tests)
```bash
dotnet test --filter "FullyQualifiedName~CategoryServiceTests"
```

### User Service Tests (34 tests)
```bash
dotnet test --filter "FullyQualifiedName~UserServiceTests"
```

### Order Service Tests
```bash
dotnet test --filter "FullyQualifiedName~OrderServiceTests"
```

### Product Service Tests
```bash
dotnet test --filter "FullyQualifiedName~ProductServiceTests"
```

---

## Run Tests by Category

### CRUD Operations
```bash
dotnet test --filter "FullyQualifiedName~Create|FullyQualifiedName~Update|FullyQualifiedName~Delete"
```

### Admin Protection Tests
```bash
dotnet test --filter "FullyQualifiedName~ToggleUserStatusAsync"
```

### Filtering and Sorting Tests
```bash
dotnet test --filter "FullyQualifiedName~Filter|FullyQualifiedName~Sort"
```

---

## Test Options

### Verbose Output
```bash
dotnet test --verbosity normal
```

### Minimal Output
```bash
dotnet test --verbosity minimal
```

### Detailed Output
```bash
dotnet test --verbosity detailed
```

### List All Tests (without running)
```bash
dotnet test --list-tests
```

---

## Watch Mode (Auto-rerun on changes)
```bash
dotnet watch test
```

---

## Test with Coverage
```bash
dotnet test --collect:"XPlat Code Coverage"
```

Coverage report will be in: `AdminPanel.Tests/TestResults/*/coverage.cobertura.xml`

---

## Debug a Specific Test

In Visual Studio:
1. Open test file
2. Click on test method
3. Right-click ? **Debug Test(s)**

Or use Test Explorer:
- View ? Test Explorer
- Filter by name
- Right-click test ? Debug

---

## Current Test Status

? **CategoryServiceTests:** 40 tests - All passing
- CRUD operations
- Filtering & sorting
- FK constraint validation
- Edge cases

? **UserServiceTests:** 34 tests - All passing
- User CRUD
- **Admin protection logic** ?? CRITICAL
- Role management
- Password updates

? **Total Suite:** 662 tests - All passing
- Duration: ~8 seconds
- 100% success rate

---

## Common Test Patterns

### Arrange-Act-Assert
```csharp
[Fact]
public async Task MethodName_Scenario_ExpectedResult()
{
    // Arrange - Set up test data
    var testData = CreateTestData();
    
    // Act - Execute the method
    var result = await _service.MethodAsync(testData);
    
    // Assert - Verify outcomes
    Assert.Equal(expected, result);
}
```

### Exception Testing
```csharp
[Fact]
public async Task Method_WithInvalidInput_ThrowsException()
{
    // Act & Assert
    var exception = await Assert.ThrowsAsync<InvalidOperationException>(
        async () => await _service.MethodAsync(invalidInput));
    
    Assert.Contains("expected message", exception.Message);
}
```

---

## Troubleshooting

### Test Not Found
- Ensure test class is public
- Ensure test method has `[Fact]` or `[Theory]` attribute
- Rebuild solution

### Test Failing Unexpectedly
- Check test isolation (in-memory DB should use unique name)
- Verify seed data consistency
- Check for shared state between tests

### Slow Tests
- Current suite runs in ~8 seconds (acceptable)
- If slower, consider:
  - Reducing seed data
  - Parallelization settings
  - Database setup optimization

---

## Best Practices Applied

? **Test Isolation:** Each test uses fresh in-memory database
? **Descriptive Names:** Clear intent from test name
? **Single Responsibility:** One assertion per test (when possible)
? **Edge Cases:** Border conditions tested
? **Business Rules:** Critical logic validated
? **Cleanup:** IDisposable pattern for resource management

---

**Note:** The 2 warnings about duplicate test IDs are from existing tests and don't affect test execution.
