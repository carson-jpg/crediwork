import { getAccessToken, initiateSTKPush } from "./services/mpesaService.js";

(async () => {
  try {
    console.log("🔑 Testing token retrieval...");
    const token = await getAccessToken();
    console.log("✅ Token obtained:", token ? "YES" : "NO");
    console.log("Token length:", token?.length);

    console.log("\n📲 Testing STK Push...");
    const result = await initiateSTKPush(
      "254716608367", // phone
      1000,           // amount
      "Test-123",     // account reference
      "Test payment"  // description
    );
    console.log("✅ STK Push result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Test error:", error.message);
    console.error("Error details:", error.response?.data);
  }
})();
