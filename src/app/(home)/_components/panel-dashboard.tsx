"use client";

import { useState, useEffect } from "react";
import { useLanguageTranslations } from "@/hooks/use-language-translations";
import { type Language } from "@/contexts/language-context";
import { getStoredOrganization } from "@/lib/auth-api";
import { getOrganization, type OrganizationDetails } from "@/lib/auth-api";

type PanelTranslations = {
    title: string;
    tokenConsumption: string;
    totalTokens: string;
    tokensUsed: string;
    tokensRemaining: string;
    byService: string;
    logs: string;
    time: string;
    user: string;
    service: string;
    tokens: string;
    status: string;
    success: string;
    error: string;
    viewAll: string;
    noLogs: string;
    // New KPI labels
    monthlyGrowth: string;
    projectedDepletion: string;
    vsPreviousMonth: string;
    transactionalVolume: string;
    costPerActiveUser: string;
    activeUsers: string;
    userRetention: string;
    retention30: string;
    retention90: string;
    totalCardsQuoted: string;
    activeCards: string;
    cardTransactionsPerformance: string;
    tpnPerCard: string;
    tpvPerCard: string;
    tpnTarget: string;
    tpvTarget: string;
    fraudRate: string;
    amlAlerts: string;
    alertsPerUser: string;
    kycPerformance: string;
    approvalRate: string;
    avgVerificationTime: string;
    platformHealth: string;
    uptime: string;
    apiErrorRate: string;
    avgResponseTime: string;
    zelifyHealthScore: string;
    healthy: string;
    warning: string;
    critical: string;
    trendUp: string;
    trendDown: string;
    estimatedCost: string;
    days: string;
    sectionSummary: string;
    sectionUsers: string;
    sectionCards: string;
    sectionRisk: string;
    cardsQuotedSubtitle: string;
    activeCardsSubtitle: string;
};

const translations: Record<Language, PanelTranslations> = {
    en: {
        title: "Panel",
        tokenConsumption: "Zcoin Consumption",
        totalTokens: "Total Zcoins",
        tokensUsed: "Zcoins Used",
        tokensRemaining: "Zcoins Remaining",
        byService: "By Service",
        logs: "Logs",
        time: "Time",
        user: "User",
        service: "Service",
        tokens: "Zcoins",
        status: "Status",
        success: "Success",
        error: "Error",
        viewAll: "View All",
        noLogs: "No logs available",
        monthlyGrowth: "Monthly growth",
        projectedDepletion: "Projected depletion",
        vsPreviousMonth: "vs previous month",
        transactionalVolume: "Transactional Volume",
        costPerActiveUser: "Cost per Active User",
        activeUsers: "Active Users",
        userRetention: "User Retention",
        retention30: "30 days",
        retention90: "90 days",
        totalCardsQuoted: "Total cards (quoted)",
        activeCards: "Active cards",
        cardTransactionsPerformance: "Card Transactions Performance",
        tpnPerCard: "TPN per card",
        tpvPerCard: "TPV per card",
        tpnTarget: "Target: 8 TPN",
        tpvTarget: "Target: 300 USD",
        fraudRate: "Fraud Rate",
        amlAlerts: "AML Alerts",
        alertsPerUser: "alerts per user",
        kycPerformance: "KYC Performance",
        approvalRate: "Approval rate",
        avgVerificationTime: "Avg. verification time",
        platformHealth: "Platform Health",
        uptime: "Uptime",
        apiErrorRate: "API error rate (24h)",
        avgResponseTime: "Avg. response time",
        zelifyHealthScore: "Zelify Health Score",
        healthy: "Healthy",
        warning: "Warning",
        critical: "Critical",
        trendUp: "up",
        trendDown: "down",
        estimatedCost: "Est. cost",
        days: "days",
        sectionSummary: "Executive summary",
        sectionUsers: "Users & business",
        sectionCards: "Cards & transactions",
        sectionRisk: "Risk & compliance",
        cardsQuotedSubtitle: "Cards quoted by the company",
        activeCardsSubtitle: "Activated by clients",
    },
    es: {
        title: "Panel",
        tokenConsumption: "Consumo de Zcoins",
        totalTokens: "Total de Zcoins",
        tokensUsed: "Zcoins usados",
        tokensRemaining: "Zcoins restantes",
        byService: "Por Servicio",
        logs: "Registros",
        time: "Hora",
        user: "Usuario",
        service: "Servicio",
        tokens: "Zcoins",
        status: "Estado",
        success: "Éxito",
        error: "Error",
        viewAll: "Ver Todos",
        noLogs: "No hay registros disponibles",
        monthlyGrowth: "Crecimiento mensual",
        projectedDepletion: "Días hasta agotar",
        vsPreviousMonth: "vs mes anterior",
        transactionalVolume: "Volumen Transaccional",
        costPerActiveUser: "Costo por Usuario Activo",
        activeUsers: "Usuarios Activos",
        userRetention: "Retención de Usuarios",
        retention30: "30 días",
        retention90: "90 días",
        totalCardsQuoted: "Total de tarjetas",
        activeCards: "Tarjetas activas",
        cardTransactionsPerformance: "Rendimiento Transacciones por Tarjeta",
        tpnPerCard: "TPN por tarjeta",
        tpvPerCard: "TPV por tarjeta",
        tpnTarget: "Meta: 8 TPN",
        tpvTarget: "Meta: 300 USD",
        fraudRate: "Tasa de Fraude",
        amlAlerts: "Alertas AML",
        alertsPerUser: "alertas por usuario",
        kycPerformance: "Rendimiento KYC",
        approvalRate: "Tasa de aprobación",
        avgVerificationTime: "Tiempo promedio verificación",
        platformHealth: "Salud de la Plataforma",
        uptime: "Disponibilidad",
        apiErrorRate: "Tasa error API (24h)",
        avgResponseTime: "Tiempo respuesta promedio",
        zelifyHealthScore: "Zelify Health Score",
        healthy: "Saludable",
        warning: "Advertencia",
        critical: "Crítico",
        trendUp: "sube",
        trendDown: "baja",
        estimatedCost: "Costo est.",
        days: "días",
        sectionSummary: "Resumen ejecutivo",
        sectionUsers: "Usuarios y negocio",
        sectionCards: "Tarjetas y transacciones",
        sectionRisk: "Riesgo y cumplimiento",
        cardsQuotedSubtitle: "Tarjetas cotizadas por la empresa",
        activeCardsSubtitle: "Activadas por clientes",
    },
};

// ─── Datos iniciales (ceros); en producción vendrían de API ─────────────────
const initialTokenData = {
    total: 0,
    used: 0,
    remaining: 0,
    zcoins_used_current_month: 0,
    zcoins_used_previous_month: 0,
    projected_daily_usage: 0,
    byService: [] as { service: string; tokens: number; percentage: number; previousMonthPct: number; costEstimation: number }[],
};

const initialKpis = {
    transactionalVolume: {
        total_volume_current_month: 0,
        total_volume_previous_month: 0,
        currency_code: "USD",
    },
    costPerActiveUser: {
        total_operational_cost: 0,
        monthly_active_users: 0,
        previous_month_cost_per_user: 0,
    },
    activeUsers: {
        monthly_active_users: 0,
        total_registered_users: 0,
    },
    retention: {
        retention_30_days: 0,
        retention_90_days: 0,
    },
    cardsIssued: {
        cards_issued_total: 0,
        cards_active_total: 0,
        new_cards_current_month: 0,
        new_cards_previous_month: 0,
    },
    cardTransactions: {
        average_tpn_per_card: 0,
        average_tpv_per_card: 0,
    },
    fraud: {
        fraud_volume: 0,
        total_transaction_volume: 0,
    },
    aml: {
        aml_alerts_total: 0,
        total_users: 0,
    },
    kyc: {
        kyc_approved: 0,
        kyc_total_requests: 0,
        average_kyc_time_hours: 0,
    },
    platformHealth: {
        platform_uptime_percentage: 0,
        api_error_rate_last_24h: 0,
        average_api_response_time: 0,
    },
};

const initialLogs: { id: number; time: string; user: string; service: string; tokens: number; status: string }[] = [];

function formatCurrency(value: number, code: string) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code, minimumFractionDigits: 0 }).format(value);
}

function getStatusColor(ok: boolean) {
    return ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
}

function getStatusBg(ok: boolean) {
    return ok ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
}

/** Verde si el cambio es bueno (subir es bueno y subió, o bajar es bueno y bajó); rojo si es malo. */
function trendColorClass(positiveIsGood: boolean, value: number): string {
    if (value === 0) return "text-gray-500 dark:text-gray-400";
    const isPositive = value > 0;
    const isGood = positiveIsGood ? isPositive : !isPositive;
    return isGood ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
}

export function PanelDashboard() {
    const t = useLanguageTranslations(translations);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [orgDetails, setOrgDetails] = useState<OrganizationDetails | null>(null);

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    // Cargar detalles de la organización (zcoins, etc.) para el dashboard actual
    useEffect(() => {
        const org = getStoredOrganization();
        if (!org?.id) return;
        getOrganization(org.id)
            .then(setOrgDetails)
            .catch(() => setOrgDetails(null));
    }, []);

    const zcoinsBalance = orgDetails?.zcoins ?? "0";

    const monthlyGrowthZcoins =
        initialTokenData.zcoins_used_previous_month > 0
            ? ((initialTokenData.zcoins_used_current_month - initialTokenData.zcoins_used_previous_month) / initialTokenData.zcoins_used_previous_month) * 100
            : 0;
    const usagePercentage = initialTokenData.total > 0 ? (initialTokenData.used / initialTokenData.total) * 100 : 0;
    const projectedDepletionDays =
        initialTokenData.projected_daily_usage > 0 ? Math.floor(initialTokenData.remaining / initialTokenData.projected_daily_usage) : 0;

    const txVol = initialKpis.transactionalVolume;
    const txGrowth =
        txVol.total_volume_previous_month > 0
            ? ((txVol.total_volume_current_month - txVol.total_volume_previous_month) / txVol.total_volume_previous_month) * 100
            : 0;

    const costUser = initialKpis.costPerActiveUser;
    const costPerUser = costUser.monthly_active_users > 0 ? costUser.total_operational_cost / costUser.monthly_active_users : 0;
    const costTrend = costPerUser >= costUser.previous_month_cost_per_user ? "up" : "down";

    const mau = initialKpis.activeUsers;
    const activePercentage = mau.total_registered_users > 0 ? (mau.monthly_active_users / mau.total_registered_users) * 100 : 0;
    const mauHealthy = activePercentage >= 50;

    const ret = initialKpis.retention;
    const ret30Ok = ret.retention_30_days >= 60;
    const ret90Ok = ret.retention_90_days >= 60;

    const cards = initialKpis.cardsIssued;

    const fraud = initialKpis.fraud;
    const fraudRate = fraud.total_transaction_volume > 0 ? (fraud.fraud_volume / fraud.total_transaction_volume) * 100 : 0;
    const fraudOk = fraudRate < 0.1;

    const aml = initialKpis.aml;
    const alertsPerUserRatio = aml.total_users > 0 ? (aml.aml_alerts_total / aml.total_users) * 100 : 0;
    const amlOk = alertsPerUserRatio < 3;

    const kyc = initialKpis.kyc;
    const approvalRate = kyc.kyc_total_requests > 0 ? (kyc.kyc_approved / kyc.kyc_total_requests) * 100 : 0;
    const kycTimeOk = kyc.average_kyc_time_hours >= 24 && kyc.average_kyc_time_hours <= 48;
    const kycApprovalOk = approvalRate >= 80;
    const kycHealthy = kycApprovalOk && kycTimeOk;

    const platform = initialKpis.platformHealth;
    const platformOk = platform.platform_uptime_percentage >= 99.9;

    const cardClass = "rounded-lg border border-stroke bg-white p-5 shadow-sm dark:border-stroke-dark dark:bg-gray-dark";
    const labelClass = "text-xs font-medium text-gray-500 dark:text-gray-400";
    const valueClass = "text-xl font-bold text-gray-900 dark:text-white";
    const subClass = "text-xs text-gray-500 dark:text-gray-400 mt-1";

    return (
        <div className="space-y-8">
            {/* ─── 4 KPIs principales ─── */}
            <section>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className={cardClass}>
                        <div className={labelClass}>{t.totalTokens}</div>
                        <div className={valueClass}>{zcoinsBalance}</div>
                        <div className={`${subClass} ${trendColorClass(false, monthlyGrowthZcoins)}`}>
                            {t.vsPreviousMonth}: {monthlyGrowthZcoins >= 0 ? "+" : ""}{monthlyGrowthZcoins.toFixed(1)}%
                        </div>
                    </div>
                    <div className={cardClass}>
                        <div className={labelClass}>{t.tokensUsed}</div>
                        <div className={valueClass}>0</div>
                        <div className={subClass}>
                            {usagePercentage.toFixed(1)}% used · <span className={trendColorClass(false, monthlyGrowthZcoins)}>{t.vsPreviousMonth}: {monthlyGrowthZcoins >= 0 ? "+" : ""}{monthlyGrowthZcoins.toFixed(1)}%</span>
                        </div>
                    </div>
                    <div className={cardClass}>
                        <div className={labelClass}>{t.tokensRemaining}</div>
                        <div className={valueClass}>{zcoinsBalance}</div>
                        <div className={subClass}>
                            {t.projectedDepletion}: {projectedDepletionDays} {t.days}
                        </div>
                    </div>
                    <div className={cardClass}>
                        <div className={labelClass}>{t.transactionalVolume}</div>
                        <div className={valueClass}>{formatCurrency(txVol.total_volume_current_month, txVol.currency_code)}</div>
                        <div className={`${subClass} ${trendColorClass(true, txGrowth)}`}>
                            {t.vsPreviousMonth}: {txGrowth >= 0 ? "+" : ""}{txGrowth.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Consumo de Zcoins por Servicio — ancho completo ─── */}
            <section className="w-full">
                <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-stroke-dark dark:bg-gray-dark md:p-8">
                    <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white md:mb-8">
                        {t.tokenConsumption} — {t.byService}
                    </h2>
                    <div className="space-y-5 md:space-y-6">
                        {initialTokenData.byService.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.noLogs}</p>
                        ) : (
                        initialTokenData.byService.map((item, index) => {
                            const trend = item.percentage - item.previousMonthPct;
                            return (
                                <div key={index} className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white md:text-base">{item.service}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {item.percentage}%
                                                {trend !== 0 && (
                                                    <span className={trendColorClass(false, trend)}>
                                                        {" "}{trend > 0 ? "↑" : "↓"} vs mes anterior
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 md:h-4">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${Math.min(100, item.percentage)}%`, backgroundColor: "#10B981" }}
                                            />
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300 md:w-32 md:text-right">
                                        {t.estimatedCost}: {formatCurrency(item.costEstimation, "USD")}
                                    </div>
                                </div>
                            );
                        })
                        )}
                    </div>
                </div>
            </section>

            {/* ─── Sección: Usuarios y negocio ─── */}
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t.sectionUsers}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className={cardClass}>
                        <div className={labelClass}>{t.costPerActiveUser}</div>
                        <div className={valueClass}>{formatCurrency(costPerUser, "USD")}</div>
                        <div className={`${subClass} ${costTrend === "up" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {t.vsPreviousMonth}: {costTrend === "up" ? t.trendUp : t.trendDown}
                        </div>
                    </div>
                    <div className={cardClass}>
                        <div className={labelClass}>{t.activeUsers}</div>
                        <div className={valueClass}>{mau.monthly_active_users.toLocaleString()}</div>
                        <div className={`text-xs mt-1 font-medium ${mauHealthy ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {activePercentage.toFixed(1)}% of registered
                        </div>
                    </div>
                    <div className={cardClass}>
                        <div className={labelClass}>{t.userRetention}</div>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <div>
                                <div className={`text-lg font-bold ${ret30Ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                    {ret.retention_30_days}%
                                </div>
                                <div className={labelClass}>{t.retention30}</div>
                            </div>
                            <div>
                                <div className={`text-lg font-bold ${ret90Ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                    {ret.retention_90_days}%
                                </div>
                                <div className={labelClass}>{t.retention90}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Sección: Tarjetas y transacciones ─── */}
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t.sectionCards}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className={cardClass}>
                        <div className={labelClass}>{t.totalCardsQuoted}</div>
                        <div className={valueClass}>{cards.cards_issued_total.toLocaleString()}</div>
                        <div className={subClass}>{t.cardsQuotedSubtitle}</div>
                    </div>
                    <div className={cardClass}>
                        <div className={labelClass}>{t.activeCards}</div>
                        <div className={valueClass}>{cards.cards_active_total.toLocaleString()}</div>
                        <div className={subClass}>{t.activeCardsSubtitle}</div>
                    </div>
                </div>
            </section>

            {/* ─── Sección: Riesgo y cumplimiento ─── */}
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t.sectionRisk}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className={cardClass}>
                        <div className={labelClass}>{t.fraudRate}</div>
                        <div className={`text-xl font-bold ${getStatusColor(fraudOk)}`}>{fraudRate.toFixed(3)}%</div>
                        <div className={subClass}>{fraudOk ? t.healthy : t.critical}</div>
                    </div>
                    <div className={cardClass}>
                        <div className={labelClass}>{t.amlAlerts}</div>
                        <div className={valueClass}>{aml.aml_alerts_total}</div>
                        <div className={`text-xs mt-1 ${getStatusColor(amlOk)}`}>
                            {alertsPerUserRatio.toFixed(2)}% {t.alertsPerUser}
                        </div>
                    </div>
                    <div className={cardClass}>
                        <div className={labelClass}>{t.kycPerformance}</div>
                        <div className={`text-xl font-bold ${getStatusColor(kycHealthy)}`}>{approvalRate.toFixed(1)}%</div>
                        <div className={subClass}>{t.approvalRate}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t.avgVerificationTime}: {kyc.average_kyc_time_hours}h
                        </div>
                    </div>
                    <div className={cardClass}>
                        <div className={labelClass}>{t.platformHealth}</div>
                        <div className={`text-xl font-bold ${getStatusColor(platformOk)}`}>{platform.platform_uptime_percentage}%</div>
                        <div className={subClass}>{t.uptime}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t.apiErrorRate}: {platform.api_error_rate_last_24h}% · {t.avgResponseTime}: {platform.average_api_response_time}ms
                        </div>
                    </div>
                </div>
            </section>

            {/* Logs */}
            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t.logs}</h2>
                <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-stroke-dark dark:bg-gray-dark">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t.logs}</h3>
                    <button className="text-sm font-medium" style={{ color: "#004492" }}>
                        {t.viewAll}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {initialLogs.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-stroke dark:border-stroke-dark">
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">{t.time}</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">{t.user}</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">{t.service}</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">{t.tokens}</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400">{t.status}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {initialLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-stroke dark:border-stroke-dark">
                                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">{log.time}</td>
                                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">{log.user}</td>
                                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">{log.service}</td>
                                        <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">{log.tokens.toLocaleString()}</td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    log.status === "success"
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                }`}
                                            >
                                                {log.status === "success" ? t.success : t.error}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{t.noLogs}</p>
                    )}
                </div>
                </div>
            </section>
        </div>
    );
}
