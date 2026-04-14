import { useState, useEffect } from "react";
import { getStoredUser, getStoredRoles } from "@/lib/auth-api";
import { resolveMyMerchant } from "@/lib/discounts-api";
import { DASHBOARD_ROLE } from "@/lib/dashboard-routing";

export function useMerchantId() {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const user = getStoredUser();
      const sessionMid = user?.merchant_id;
      const roles = getStoredRoles();
      const isAdmin = roles.includes(DASHBOARD_ROLE.OWNER) || roles.includes(DASHBOARD_ROLE.ZELIFY_TEAM);

      if (sessionMid) {
        setMerchantId(sessionMid);
        setLoading(false);
        return;
      }

      // Si es Admin pero no tiene merchant en sesión, no intentamos resolverlo
      // (ya que un Admin no tiene "un solo merchant" asociado por defecto)
      if (isAdmin) {
        setMerchantId(null);
        setLoading(false);
        return;
      }

      // Si es Merchant pero no hay ID en sesión, resolvemos
      try {
        const resolved = await resolveMyMerchant();
        if (resolved.merchant_id) {
          setMerchantId(resolved.merchant_id);
        } else {
          setError("No tienes un comercio asignado. Contacta a soporte.");
        }
      } catch (err) {
        setError("Error al resolver la identidad del merchant.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  return { merchantId, loading, error };
}
