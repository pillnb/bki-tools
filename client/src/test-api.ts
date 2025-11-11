// Test tRPC API connection
console.log("🔍 Testing tRPC API Connection...\n");

async function testAPI() {
  try {
    // Test tools.list API
    console.log("📝 Testing: GET /api/trpc/tools.list...");
    
    const response = await fetch(
      `http://localhost:3000/api/trpc/tools.list?input=%7B%7D`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Response:", data);

    if (response.ok) {
      console.log("\n✅ API connection successful!");
    } else {
      console.log("\n❌ API returned error");
    }
  } catch (error) {
    console.error("❌ API test failed:", error);
  }
}

testAPI();
