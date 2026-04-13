import * as Icons from "../icons";
import type { UiTranslations } from "@/hooks/use-ui-translations";
import { ZENDESK_SUPPORT_MENU_HREF } from "@/lib/zendesk-widget";
import { getDashboardActorFromRoles } from "@/lib/dashboard-routing";

/** Verifica si al menos un scope de la org coincide con el prefijo (o con alguno de los prefijos). */
function hasScope(scopePrefix: string | string[], scopeStrings: string[]): boolean {
  const prefixes = Array.isArray(scopePrefix) ? scopePrefix : [scopePrefix];
  return prefixes.some((p) => scopeStrings.some((s) => s.startsWith(p)));
}

export function getNavData(
  translations: UiTranslations,
  options?: { isOwner?: boolean; canSeeBranding?: boolean; organizationScopes?: string[] | null; roles?: string[] }
) {
  const isOwner = options?.isOwner ?? false;
  const canSeeBranding = options?.canSeeBranding ?? false;
  const organizationScopes = options?.organizationScopes;
  const actor = getDashboardActorFromRoles(options?.roles);

  if (typeof window !== "undefined") {
    console.log("[getNavData] organizationScopes recibido:", organizationScopes == null ? "null" : `array(${organizationScopes?.length})`, organizationScopes ?? "(no aplica filtro, se muestran todos)");
  }

  const productItems: Array<{
    scopePrefix: string | string[];
    title: string;
    icon: unknown;
    items: unknown[];
  }> = [
    {
      scopePrefix: "auth.",
      title: translations.sidebar.menuItems.auth,
      icon: Icons.Authentication,
      items: [
            {
              title: translations.sidebar.menuItems.subItems.authentication,
              url: "/pages/products/auth/authentication",
            },
            {
              title: translations.sidebar.menuItems.subItems.deviceInformation,
              url: "/pages/products/auth/device-information",
            },
            {
              title: translations.sidebar.menuItems.subItems.registeredUsers,
              url: "/pages/products/auth/registered-users",
            },
          ],
    },
    {
      scopePrefix: "aml.",
      title: translations.sidebar.menuItems.aml,
      icon: Icons.AMLIcon,
          items: [
            {
              title:
                translations.sidebar.menuItems.subItems.validationGlobalList,
              url: "/pages/products/aml/validation-global-list",
            },
          ],
    },
    {
      scopePrefix: "identity.",
      title: translations.sidebar.menuItems.identity,
      icon: Icons.IdentityIcon,
          items: [
            {
              title: translations.sidebar.menuItems.subItems.workflow,
              url: "/pages/products/identity/workflow",
            },
          ],
    },
    {
      scopePrefix: "connect.",
      title: translations.sidebar.menuItems.connect,
      icon: Icons.ConnectIcon,
          items: [
            {
              title: translations.sidebar.menuItems.subItems.bankAccountLinking,
              url: "/pages/products/connect/bank-account-linking",
            },
          ],
    },
    {
      scopePrefix: "cards.",
      title: translations.sidebar.menuItems.cards,
      icon: Icons.CardsIcon,
          items: [
            {
              title: translations.sidebar.menuItems.subItems.cardUsers,
              url: "/pages/products/cards/users",
            },
            {
              title: translations.sidebar.menuItems.subItems.design,
              url: "/pages/products/cards",
            },
            {
              title: translations.sidebar.menuItems.subItems.issuedCards,
              url: "/pages/products/cards/issued-cards",
            },
            {
              title: translations.sidebar.menuItems.subItems.transactions,
              url: "/pages/products/cards/transactions",
            },
            {
              title: translations.sidebar.menuItems.subItems.diligence,
              url: "/pages/products/cards/diligence",
            },
          ],
    },
    {
      scopePrefix: ["payments.", "transfers."],
      title: translations.sidebar.menuItems.payments,
      icon: Icons.TransfersIcon,
      items: [
        {
          title: translations.sidebar.menuItems.subItems.basicService,
          url: "/pages/products/payments/servicios-basicos",
        },
        {
          title: translations.sidebar.menuItems.subItems.transfers,
          url: "/pages/products/payments/transfers",
        },
        {
          title: translations.sidebar.menuItems.subItems.paymentsWorkflow,
          url: "/pages/products/payments/workflow",
        },
        {
          title: translations.sidebar.menuItems.subItems.customKeys,
          url: "/pages/products/payments/custom-keys",
        },
        {
          title: translations.sidebar.menuItems.subItems.qr,
          url: "/pages/products/payments/qr",
        },
      ],
    },
    {
      scopePrefix: "tx.",
      title: translations.sidebar.menuItems.tx,
      icon: Icons.TxIcon,
      items: [
        {
          title:
            translations.sidebar.menuItems.subItems.internationalTransfers,
          url: "/pages/products/tx/transferencias-internacionales",
        },
        {
          title:
            translations.sidebar.menuItems.subItems
              .internationalTransfersWorkflow,
          url: "/pages/products/tx/transferencias-internacionales/workflow",
        },
      ],
    },
    {
      scopePrefix: "alaiza_ai.",
      title: translations.sidebar.menuItems.ai,
      icon: Icons.AIIcon,
          items: [
            {
              title: translations.sidebar.menuItems.subItems.alaiza,
              url: "/pages/products/ai/alaiza",
            },
            {
              title: translations.sidebar.menuItems.subItems.behaviorAnalysis,
              url: "/pages/products/ai/behavior-analysis",
            },
            {
              title: translations.sidebar.menuItems.subItems.financialEducation,
              url: "/pages/products/ai/financial-education",
            },
          ],
    },
    {
      scopePrefix: "discounts_coupons.",
      title: translations.sidebar.menuItems.discountsCoupons,
      icon: Icons.DiscountsIcon,
      items:
        actor === "organization"
          ? [
              {
                title: translations.sidebar.menuItems.subItems.programSummary,
                url: "/organization",
              },
              {
                title: translations.sidebar.menuItems.subItems.merchants,
                url: "/organization/merchants",
              },
              {
                title: translations.sidebar.menuItems.subItems.discounts,
                url: "/organization/discounts",
              },
              {
                title: translations.sidebar.menuItems.subItems.claims,
                url: "/organization/claims",
              },
              {
                title: translations.sidebar.menuItems.subItems.reports,
                url: "/organization/reports",
              },
            ]
          : [
              {
                title: translations.sidebar.menuItems.subItems.discounts,
                url: "/pages/products/discounts-coupons/discounts",
              },
              {
                title: translations.sidebar.menuItems.subItems.coupons,
                url: "/pages/products/discounts-coupons",
              },
              {
                title: translations.sidebar.menuItems.subItems.createCoupon,
                url: "/pages/products/discounts-coupons/create",
              },
              {
                title: translations.sidebar.menuItems.subItems.analyticsUsage,
                url: "/pages/products/discounts-coupons/analytics",
              },
            ],
    },
  ];

  const shouldShowProductsSection =
    actor === "owner" || actor === "unknown" || actor === "organization";
  const filteredProductItems =
    shouldShowProductsSection && organizationScopes != null && Array.isArray(organizationScopes)
      ? productItems.filter((item) => hasScope(item.scopePrefix, organizationScopes))
      : shouldShowProductsSection
        ? productItems
        : [];
  const productsSectionItems = filteredProductItems.map(({ scopePrefix: _p, ...item }) => item);
  const hasAnyScopes = Array.isArray(organizationScopes) && organizationScopes.length > 0;
  const shouldPinOnboardingToTop = actor === "organization" && Array.isArray(organizationScopes) && !hasAnyScopes;

  const actorDashboardItems =
    actor === "owner"
      ? [
          {
            title: translations.sidebar.menuItems.subItems.generalPanel,
            url: "/",
          },
          { title: "Overview", url: "/owner" },
          { title: "Merchants", url: "/owner/merchants" },
          { title: "Visibility", url: "/owner/visibility" },
        ]
      : actor === "merchant"
        ? [
            {
              title: translations.sidebar.menuItems.subItems.generalPanel,
              url: "/",
            },
            { title: "Overview", url: "/merchant" },
            { title: "Profile", url: "/merchant/profile" },
            { title: "Branches", url: "/merchant/branches" },
            { title: "Categories", url: "/merchant/categories" },
            { title: "Products", url: "/merchant/products" },
            { title: "Discounts", url: "/merchant/discounts" },
            { title: "Coupons", url: "/merchant/coupons" },
            { title: "Create Coupon", url: "/merchant/coupons/create" },
          ]
        : actor === "organization"
          ? [
              {
                title: translations.sidebar.menuItems.subItems.generalPanel,
                url: "/",
              },
            ]
          : [
              {
                title: translations.sidebar.menuItems.subItems.generalPanel,
                url: "/",
              },
            ];

  if (typeof window !== "undefined") {
    console.log(
      "[getNavData] PRODUCTS filtrados:",
      filteredProductItems.length,
      "de",
      productItems.length,
      "— títulos:",
      productsSectionItems.map((i) => (i as { title: string }).title)
    );
  }

  const mainSection = {
      label: translations.sidebar.mainMenu,
      items: [
        {
          title: translations.sidebar.menuItems.dashboard,
          icon: Icons.HomeIcon,
          items: actorDashboardItems,
        },
        // {
        //   title: translations.sidebar.menuItems.calendar,
        //   url: "/calendar",
        //   icon: Icons.Calendar,
        //   items: [],
        // },
        {
          title: translations.sidebar.menuItems.organization,
          icon: Icons.Organization,
          items: [
            {
              title: translations.sidebar.menuItems.subItems.profile,
              url: "/profile",
            },
            {
              title: translations.sidebar.menuItems.subItems.teams,
              url: "/organization/teams",
            },
            ...(canSeeBranding
              ? [
                  {
                    title: translations.sidebar.menuItems.subItems.branding,
                    url: "/organization/branding",
                  },
                ]
              : []),
            ...(isOwner
              ? [
                  {
                    title: translations.sidebar.menuItems.subItems.organizationAdmin,
                    url: "/organization/admin",
                  },
                ]
              : []),
          ],
        },
        {
          title: translations.sidebar.menuItems.zelifyKeys,
          url: "/pages/zelifykeys",
          icon: Icons.Key,
          items: [],
        },
        // {
        //   title: translations.sidebar.menuItems.allProducts,
        //   url: "/pages/products",
        //   icon: Icons.ProductsIcon,
        //   items: [],
        // },
        {
          title: translations.sidebar.menuItems.logs,
          url: "/pages/infologs",
          icon: Icons.LogsIcon,
          items: [],
        },
        {
          title: translations.sidebar.menuItems.webhooks,
          url: "/pages/webhooks",
          icon: Icons.WebhooksIcon,
          items: [],
        },
        {
          title: translations.sidebar.menuItems.notifications,
          icon: Icons.NotificationsIcon,
          items: [
            {
              title: translations.sidebar.menuItems.subItems.templates,
              url: "/pages/products/notifications",
            },
            {
              title: translations.sidebar.menuItems.subItems.domains,
              url: "/pages/products/notifications/domains",
            },
          ],
        },
      ],
    };

  const onboardingSection = {
      label: translations.sidebar.onboarding,
      items: [
        {
          title: translations.sidebar.menuItems.kyb,
          icon: Icons.DocumentTextIcon,
          url: "/pages/onboarding/kyb",
          items: [],
        },
        {
          title: translations.sidebar.menuItems.amlDocumentation,
          icon: Icons.AMLIcon,
          url: "/pages/onboarding/aml-documentation",
          items: [],
        },
        {
          title: translations.sidebar.menuItems.technicalDocumentation,
          icon: Icons.CodeIcon,
          url: "/pages/onboarding/technical-documentation",
          items: [],
        },
        {
          title: translations.sidebar.menuItems.integrationSupport,
          icon: Icons.ChatSupportIcon,
          url: ZENDESK_SUPPORT_MENU_HREF,
          items: [],
        },
      ],
    };

  const sections = [
    ...(productsSectionItems.length > 0
      ? [{ label: translations.sidebar.products, items: productsSectionItems }]
      : []),
    mainSection,
  ];

  if (shouldPinOnboardingToTop) {
    return [onboardingSection, ...sections];
  }

  return [...sections, onboardingSection];
}
