import { listPurchases } from "@/features/purchases/lib/purchases";
import { getReminderPrefs } from "@/features/warranty/lib/prefs";
import { listDatedWarranties } from "@/features/warranty/lib/warranties";
import { upcomingDeadlines, type Upcoming } from "./upcoming";

export async function listUpcoming(today: Date = new Date()): Promise<Upcoming[]> {
  const [purchases, warranties, prefs] = await Promise.all([listPurchases(), listDatedWarranties(), getReminderPrefs()]);
  return upcomingDeadlines(purchases, warranties, prefs, today);
}
