-- F9: MarketForecast is only created and read by the app. Remove edit/delete access.
DROP POLICY IF EXISTS "anon_update_forecast" ON "MarketForecast";
DROP POLICY IF EXISTS "anon_delete_forecast" ON "MarketForecast";

REVOKE UPDATE, DELETE ON "MarketForecast" FROM anon, authenticated;
