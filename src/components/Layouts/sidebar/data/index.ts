import * as Icons from "../icons";
import type { UiTranslations } from "@/hooks/use-ui-translations";
import { ZENDESK_SUPPORT_MENU_HREF } from "@/lib/zendesk-widget";
import { getDashboardActorFromRoles } from "@/lib/dashboard-routing";
import { DEFAULT_ONBOARDING_VISIBILITY, type OnboardingVisibility } from "@/lib/onboarding-api";

type ProductSubItem = {
  title: string;
  url: string;
  scopePrefix?: string | string[];
};

type ProductItem = {
  scopePrefix: string | string[];
  title: string;
  icon: unknown;
  items: ProductSubItem[];
};

function matchesScopePrefix(scopePrefix: string, grantedScope: string): boolean {
  if (grantedScope.startsWith(scopePrefix)) return true;
  if (!grantedScope.endsWith("*")) return false;
  const wildcardBase = grantedScope.slice(0, -1);
  return scopePrefix.startsWith(wildcardBase);
}

/** Verifica si al menos un scope de la org coincide con el prefijo (o con alguno de los prefijos). */
function hasScope(scopePrefix: string | string[], scopeStrings: string[]): boolean {
  const prefixes = Array.isArray(scopePrefix) ? scopePrefix : [scopePrefix];
  return prefixes.some((p) => scopeStrings.some((s) => matchesScopePrefix(p, s)));
}

function hasBroadScope(scopePrefix: string | string[], scopeStrings: string[]): boolean {
  const prefixes = Array.isArray(scopePrefix) ? scopePrefix : [scopePrefix];
  return prefixes.some((p) =>
    scopeStrings.some((s) => s === p || s === `${p}*`)
  );
}

export function getNavData(
  translations: UiTranslations,
  options?: {
    isOwner?: boolean;
    canSeeBranding?: boolean;
    organizationScopes?: string[] | null;
    onboardingVisibility?: OnboardingVisibility;
    roles?: string[];
  }
) {
  const isOwner = options?.isOwner ?? false;
  const canSeeBranding = options?.canSeeBranding ?? false;
  const organizationScopes = options?.organizationScopes;
  const onboardingVisibility = options?.onboardingVisibility ?? DEFAULT_ONBOARDING_VISIBILITY;
  const actor = getDashboardActorFromRoles(options?.roles);

  const productItems: ProductItem[] = [
    {
      scopePrefix: "auth.",
      title: translations.sidebar.menuItems.auth,
      icon: Icons.Authentication,
      items: [
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
          scopePrefix: "payments.basic_services.",
        },
        {
          title: translations.sidebar.menuItems.subItems.transfers,
          url: "/pages/products/payments/transfers",
          scopePrefix: ["payments.transfers.", "transfers."],
        },
        {
          title: translations.sidebar.menuItems.subItems.paymentsWorkflow,
          url: "/pages/products/payments/workflow",
          scopePrefix: "payments.workflow.",
        },
        {
          title: translations.sidebar.menuItems.subItems.customKeys,
          url: "/pages/products/payments/custom-keys",
          scopePrefix: "payments.custom_keys.",
        },
        {
          title: translations.sidebar.menuItems.subItems.qr,
          url: "/pages/products/payments/qr",
          scopePrefix: "payments.qr.",
        },
      ],
    },
    {
      scopePrefix: ["payments.disbursements.", "payments.", "transfers."],
      title: translations.sidebar.menuItems.paymentDisbursement,
      icon: Icons.PaymentDisbursementIcon,
      items: [
        {
          title: translations.sidebar.menuItems.subItems.generalPanel,
          url: "/pages/products/payments/disbursement",
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
      ? productItems
          .map((item) => {
            const hasParentScope = hasScope(item.scopePrefix, organizationScopes);
            const hasBroadParentScope = hasBroadScope(item.scopePrefix, organizationScopes);
            const scopedItems = item.items.filter((subItem) =>
              subItem.scopePrefix
                ? hasScope(subItem.scopePrefix, organizationScopes) || hasBroadParentScope
                : hasParentScope
            );
            return { ...item, items: scopedItems };
          })
          .filter((item) => item.items.length > 0)
      : shouldShowProductsSection
        ? productItems
        : [];
  const productsSectionItems = filteredProductItems.map(({ scopePrefix: _p, items, ...item }) => ({
    ...item,
    items: items.map(({ scopePrefix: _subScope, ...subItem }) => subItem),
  }));
  const hasAnyScopes = Array.isArray(organizationScopes) && organizationScopes.length > 0;
  const shouldPinOnboardingToTop = actor === "organization" && Array.isArray(organizationScopes) && !hasAnyScopes;

  const actorDashboardItems =
    actor === "owner"
      ? [
          {
            title: translations.sidebar.menuItems.subItems.generalPanel,
            url: "/",
          },
          { title: "Resumen", url: "/owner" },
          { title: "Comercios", url: "/owner/merchants" },
          { title: "Visibilidad", url: "/owner/visibility" },
        ]
      : actor === "merchant"
        ? [
            {
              title: translations.sidebar.menuItems.subItems.generalPanel,
              url: "/",
            },
            {
              title: translations.sidebar.menuItems.subItems.overview,
              url: "/merchant",
            },
            {
              title: translations.sidebar.menuItems.subItems.terminal,
              url: "/merchant/terminal",
            },
            {
              title: translations.sidebar.menuItems.subItems.profile,
              url: "/merchant/profile",
            },
            {
              title: translations.sidebar.menuItems.subItems.branches,
              url: "/merchant/branches",
            },
            {
              title: translations.sidebar.menuItems.subItems.categories,
              url: "/merchant/categories",
            },
            {
              title: translations.sidebar.menuItems.subItems.products,
              url: "/merchant/products",
            },
            {
              title: translations.sidebar.menuItems.subItems.discounts,
              url: "/merchant/discounts",
            },
            {
              title: translations.sidebar.menuItems.subItems.coupons,
              url: "/merchant/coupons",
            },
            {
              title: translations.sidebar.menuItems.subItems.createCoupon,
              url: "/merchant/coupons/create",
            },
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
          ],
        },

        ...(isOwner
          ? [
              {
                title: "Administracion de Organizaciones",
                icon: Icons.Organization,
                items: [
                  {
                    title: "Directorio Global",
                    url: "/owner/organizations",
                  },
                  {
                    title: "Solicitudes de Producción",
                    url: "/owner/production-requests",
                  },
                ],
              },
            ]
          : []),
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
        ...(onboardingVisibility.kyb
          ? [
              {
                title: translations.sidebar.menuItems.kyb,
                icon: Icons.DocumentTextIcon,
                url: "/pages/onboarding/kyb",
                items: [],
              },
            ]
          : []),
        ...(onboardingVisibility.amlDocumentation
          ? [
              {
                title: translations.sidebar.menuItems.amlDocumentation,
                icon: Icons.AMLIcon,
                url: "/pages/onboarding/aml-documentation",
                items: [],
              },
            ]
          : []),
        ...(onboardingVisibility.technicalDocumentation
          ? [
              {
                title: translations.sidebar.menuItems.technicalDocumentation,
                icon: Icons.CodeIcon,
                url: "/pages/onboarding/technical-documentation",
                items: [],
              },
            ]
          : []),
        ...(onboardingVisibility.businessPlan
          ? [
              {
                title: translations.sidebar.menuItems.businessPlan,
                icon: Icons.DocumentTextIcon,
                url: "/pages/onboarding/business-info",
                items: [],
              },
            ]
          : []),
        ...(onboardingVisibility.additionalInfo
          ? [
              {
                title: translations.sidebar.menuItems.additionalInfo,
                icon: Icons.DocumentTextIcon,
                url: "/pages/onboarding/additional-info",
                items: [],
              },
            ]
          : []),
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

  const productionSection = {
    label: "PRODUCCIÓN",
    items: [
      {
        title: "Producción",
        url: "/organization/production",
        icon: Icons.DocumentTextIcon,
        items: [],
      },
    ],
  };

  const hasProduction = actor === "organization";

  if (shouldPinOnboardingToTop) {
    return [
      onboardingSection,
      ...sections,
      ...(hasProduction ? [productionSection] : []),
    ];
  }

  return [
    ...sections,
    ...(hasProduction ? [productionSection] : []),
    onboardingSection,
  ];
}
