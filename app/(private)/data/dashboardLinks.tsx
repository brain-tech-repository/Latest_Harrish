// Utility to recursively lowercase all hrefs in the menu structure
function lowercaseHrefs(data: SidebarDataType[]): SidebarDataType[] {
  return data.map((sidebar) => ({
    ...sidebar,
    data: sidebar.data.map(lowercaseLinkData)
  }));
}

function lowercaseLinkData(link: LinkDataType): LinkDataType {
  const newLink: LinkDataType = {
    ...link,
    href: typeof link.href === 'string' ? link.href.toLowerCase() : link.href,
  };
  if (link.children && Array.isArray(link.children)) {
    newLink.children = link.children.map(lowercaseLinkData);
  }
  return newLink;
}
import { IconifyIcon } from "@iconify-icon/react/dist/iconify.mjs";

export type SidebarDataType = {
  name?: string;
  data: LinkDataType[];
};

export type LinkDataType = {
  id?: number | string;
  isActive: boolean;
  href: string;
  label: string;
  leadingIcon: IconifyIcon | string;
  trailingIcon?: IconifyIcon | string;
  iconColor?: string;
  permissions?: []
  children?: LinkDataType[];
};

export const initialLinkData: SidebarDataType[] = lowercaseHrefs([
  {
    data: [
      {
        isActive: false,
        href: "#",
        label: "Masters",
        leadingIcon: "hugeicons:workflow-square-06",
        trailingIcon: "mdi-light:chevron-right",
        iconColor: "text-yellow-400",
        children: [
          {
            isActive: false,
            href: "/vehicle",
            label: "Vehicle",
            leadingIcon: "mdi:car",
            iconColor: "text-yellow-400",
          },
          {
            isActive: false,
            href: "/route",
            label: "Route",
            leadingIcon: "mdi:map",
            iconColor: "text-yellow-400",
          },
          {
            isActive: false,
            href: "/routevisit",
            label: "Route Visit Plan",
            leadingIcon: "icon-park-solid:plan",
            iconColor: "text-yellow-400",
          },
          {
            isActive: false,
            href: "/routeTransfer",
            label: "Route Transfer",
            leadingIcon: "icon-park-outline:transfer",
            iconColor: "text-yellow-400",
          },
          {
            isActive: false,
            href: "/fieldCustomer",
            label: "Field Customers",
            leadingIcon: "carbon:customer",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/companyCustomer",
            label: "Company Customers",
            leadingIcon: "lucide:user",
            iconColor: "text-green-500",
          },
          {
            isActive: false,
            href: "/salesTeam",
            label: "Sales Team",
            leadingIcon: "carbon:sales-ops",
            iconColor: "text-cyan-500",
          },

          {
            isActive: false,
            href: "/item",
            label: "Item",
            leadingIcon: "mdi:package-variant",
            iconColor: "text-cyan-500",
          },

          // {
          //     isActive: false,
          //     href: "/customer",
          //     label: "Customer",
          //     leadingIcon: "lucide:user",
          //     iconColor: "text-green-500"
          // },

          // {
          //     isActive: false,
          //     href: "/discount",
          //     label: "Discount",
          //     leadingIcon: "mdi:package-variant",
          //     iconColor: "text-cyan-500"
          // },
          // {
          //     isActive: false,
          //     href: "/item",
          //     label: "Items",
          //     leadingIcon: "mdi:package-variant",
          //     iconColor: "text-cyan-500"
          // },

          //         {
          //     isActive: false,
          //     href: "/pricing",
          //     label: "Pricing",
          //     leadingIcon: "mdi:currency-usd",
          //     iconColor: "text-yellow-400"
          // },
        ],
      },
      {
        isActive: false,
        href: "#",
        label: "Manage Distributors",
        leadingIcon: "tabler:building-warehouse",
        iconColor: "text-green-500",
        trailingIcon: "mdi-light:chevron-right",
        children: [
          {
            isActive: false,
            href: "/distributors",
            label: "Distributors",
            leadingIcon: "tabler:building-warehouse",
            iconColor: "text-violet-500",
          },
          {
            isActive: false,
            href: "/distributorsOverview",
            label: "Distributors Overview",
            leadingIcon: "carbon:delivery-parcel",
            iconColor: "text-cyan-500"
          },
          // {
          //   isActive: false,
          //   href: "/distributorsStock",
          //   label: "Distributors Stock",
          //   leadingIcon: "carbon:heat-map-stocks",
          //   iconColor: "text-cyan-500"
          // },

        ]
      },
      {
        isActive: false,
        href: "#",
        label: "Pricing & Promotion",
        leadingIcon: "mdi:currency-usd",
        trailingIcon: "mdi-light:chevron-right",
        iconColor: "text-yellow-400",
        children: [
          {
            isActive: false,
            href: "/pricing",
            label: "Pricing",
            leadingIcon: "mdi:currency-usd",
            iconColor: "text-yellow-400",
          },
          {
            isActive: false,
            href: "/promotion",
            label: "Promotion",
            leadingIcon: "hugeicons:promotion",
            iconColor: "text-red-500",
          },

          {
            isActive: false,
            href: "/discount",
            label: "Discount",
            leadingIcon: "mdi:package-variant",
            iconColor: "text-cyan-500",
          },
        ],
      },
      {
        isActive: false,
        href: "#",
        label: "Distributor's Transaction",
        leadingIcon: "mdi:account-cash-outline",
        iconColor: "text-green-500",
        trailingIcon: "mdi-light:chevron-right",
        children: [
          {
            isActive: false,
            href: "/distributorsOrder",
            label: "Distributor's Order",
            leadingIcon: "carbon:delivery-parcel",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/distributorsDelivery",
            label: "Distributor's Delivery",
            leadingIcon: "solar:delivery-broken",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/distributorsInvoice",
            label: "Distributor's Invoice",
            leadingIcon: "hugeicons:invoice",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/distributorsReturn",
            label: "Distributor's Return",
            leadingIcon: "icon-park-outline:return",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/distributorsExchange",
            label: "Distributor's Exchange",
            leadingIcon: "uil:exchange",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/salesTeamRouteLinkage",
            label: "Sales Team Linkage",
            leadingIcon: "line-md:link",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/salesTeamLoad",
            label: "Sales Team Load",
            leadingIcon: "mdi:tanker-truck",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/salesTeamUnload",
            label: "Sales Team Unload",
            leadingIcon: "mdi:truck-remove-outline",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/capsCollection",
            label: "CAPS Master Collection",
            leadingIcon: "game-icons:bottle-cap",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/collection",
            label: "Collection",
            leadingIcon: "heroicons-outline:collection",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/newCustomer",
            label: "Approval Customers",
            leadingIcon: "mdi:truck-remove-outline",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/advancePayment",
            label: "Advance Payment",
            leadingIcon: "oui:ml-create-advanced-job",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/stocktransfer",
            label: "Stock Transfer",
            leadingIcon: "bitcoin-icons:transfer-filled",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/salesTeamTracking",
            label: "Sales Team Tracking",
            leadingIcon: "hugeicons:shipment-tracking",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/salesTeamReconcile",
            label: "Sales Team Reconcile",
            leadingIcon: "mdi:package-variant",
            iconColor: "text-cyan-500"
          },
        ]
      },
      {
        isActive: false,
        href: "#",
        label: "Company Transaction",
        leadingIcon: "streamline-ultimate:accounting-bill-stack-1",
        iconColor: "text-green-500",
        trailingIcon: "mdi-light:chevron-right",
        children: [
          {
            isActive: false,
            href: "/purchaseOrder",
            label: "Purchase Order",
            leadingIcon: "carbon:delivery-parcel",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/order",
            label: "Order",
            leadingIcon: "carbon:delivery-parcel",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/delivery",
            label: "Delivery",
            leadingIcon: "solar:delivery-broken",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/invoice",
            label: "Invoice",
            leadingIcon: "hugeicons:invoice",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/return",
            label: "Return",
            leadingIcon: "icon-park-outline:return",
            iconColor: "text-cyan-500"
          },
          // {
          //   isActive: false,
          //   href: "/tmpReturn",
          //   label: "Temporary Return",
          //   leadingIcon: "hugeicons:invoice",
          //   iconColor: "text-cyan-500"
          // },
          {
            isActive: false,
            href: "/caps",
            label: "CAPS Deposit",
            leadingIcon: "game-icons:bottle-cap",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/creditNote",
            label: "Credit Note",
            leadingIcon: "mdi-light:credit-card",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/sapIntegration",
            label: "SAP Integration",
            leadingIcon: "hugeicons:invoice",
            iconColor: "text-cyan-500"
          },

        ]
      },
      {
        isActive: false,
        href: "#",
        label: "Claim Management",
        leadingIcon: "lucide:baggage-claim",
        iconColor: "text-green-500",
        trailingIcon: "mdi-light:chevron-right",
        children: [
          {
            isActive: false,
            href: "/compiledClaims",
            label: "Compiled Claims",
            leadingIcon: "carbon:delivery-parcel",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/petitClaim",
            label: "Petit Claim",
            leadingIcon: "mdi:file-document-outline",
            iconColor: "text-cyan-500"
          },
          {
            isActive: false,
            href: "/compensationReport",
            label: "Compensation Report",
            leadingIcon: "hugeicons:invoice",
            iconColor: "text-cyan-500"
          },

        ]
      },
      {
        isActive: false,
        href: "#",
        label: "Merchandisers",
        leadingIcon: "picon:business",
        trailingIcon: "mdi-light:chevron-right",
        iconColor: "text-yellow-400",
        children: [
          {
            isActive: false,
            href: "/shelfDisplay",
            label: "Shelf Display",
            leadingIcon: "streamline:shelf",
            iconColor: "text-yellow-400",
          },
          {
            isActive: false,
            href: "/planogram",
            label: "Planogram",
            leadingIcon: "lucide:user",
            iconColor: "text-green-500",
          },
          {
            isActive: false,
            href: "/campaign",
            label: "Campaign Info",
            leadingIcon: "material-symbols:info-rounded",
            iconColor: "text-yellow-400",
          },
          {
            isActive: false,
            href: "/survey",
            label: "Survey",
            leadingIcon: "wpf:survey",
            iconColor: "text-yellow-400",
          },
          {
            isActive: false,
            href: "/complaintFeedback",
            label: "Complaint Feedback",
            leadingIcon: "hugeicons:chat-feedback",
            iconColor: "text-yellow-400",
          },
          {
            isActive: false,
            href: "/stockinstore",
            label: "Stock in Store",
            leadingIcon: "vaadin:stock",
            iconColor: "text-yellow-400",
          },
          {
            isActive: false,
            href: "/competitor",
            label: "Competitor Info",
            leadingIcon: "akar-icons:info",
            iconColor: "text-yellow-400",
          },
        ],
      },
      {
        isActive: false,
        href: "#",
        label: "Assets Management",
        leadingIcon: "streamline-freehand:money-bag",
        iconColor: "text-green-500",
        trailingIcon: "mdi-light:chevron-right",
        children: [
          {
            isActive: false,
            href: "/assetsMaster",
            label: "Assets Master",
            leadingIcon: "guidance:refrigeration",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/assetsRequest",
            label: "Assets Request",
            leadingIcon: "si:pull-request-duotone",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "#",
            label: "Chiller Installation",
            leadingIcon: "streamline-freehand:money-bag",
            iconColor: "text-green-500",
            trailingIcon: "mdi-light:chevron-right",
            children: [
              {
                isActive: false,
                href: "/chillerInstallation/acf",
                label: "Approve CRF Request",
                leadingIcon: "guidance:refrigeration",
                iconColor: "text-cyan-500",
              },
              {
                isActive: false,
                href: "/chillerInstallation/iro",
                label: "Installation Order",
                leadingIcon: "guidance:refrigeration",
                iconColor: "text-cyan-500",
              },
              {
                isActive: false,
                href: "/chillerInstallation/installationReport",
                label: "Installation Report",
                leadingIcon: "guidance:refrigeration",
                iconColor: "text-cyan-500",
              },
              {
                isActive: false,
                href: "/chillerInstallation/bulkTransfer",
                label: "Bulk Transfer",
                leadingIcon: "guidance:refrigeration",
                iconColor: "text-cyan-500",
              },
            ],
          },
          {
            isActive: false,
            href: "/fridgeUpdateCustomer",
            label: "Fridge Update Customer",
            leadingIcon: "si:pull-request-duotone",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/callRegister",
            label: "Call Register",
            leadingIcon: "material-symbols:add-call-outline",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/serviceVisit",
            label: "Service Visit",
            leadingIcon: "material-symbols:nest-doorbell-visitor-outline",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/serviceTerritory",
            label: "Service Territory",
            leadingIcon: "carbon:user-service",
            iconColor: "text-cyan-500",
          },
        ],
      },
      {
        isActive: false,
        href: "#",
        label: "Loyalty Program",
        leadingIcon: "fa-solid:award",
        iconColor: "text-green-500",
        trailingIcon: "mdi-light:chevron-right",
        children: [
          {
            isActive: false,
            href: "/customerLoyaltyPoints",
            label: "Customer Loyalty Points",
            leadingIcon: "mdi:star-circle",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/pointsAdjustment",
            label: "Points Adjustment",
            leadingIcon: "mdi:adjust",
            iconColor: "text-cyan-500",
          },

        ],
      },
      {
        isActive: false,
        href: "#",
        label: "Reports",
        leadingIcon: "ri:dashboard-line",
        iconColor: "text-green-500",
        trailingIcon: "mdi-light:chevron-right",
        children: [
          {
            isActive: false,
            href: "/dashboard",
            label: "Admin Dashboard",
            leadingIcon: "lucide:map-pin",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/salesReportDashboard",
            label: "Sales Report",
            leadingIcon: "mdi:adjust",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/customerReport",
            label: "Customer Report",
            leadingIcon: "stash:person-duotone",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/itemReport",
            label: "Item Report",
            leadingIcon: "raphael:package",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/attendenceReport",
            label: "Attendence Report",
            leadingIcon: "lucide:calendar-check",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/poOrderReport",
            label: "PO Order Report",
            leadingIcon: "lucide:clipboard-list",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/comparisonreport",
            label: "Comparison Report",
            leadingIcon: "lucide:git-compare",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/loadUnloadReport",
            label: "Load Unload Report",
            leadingIcon: "lucide:truck",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/visitReport",
            label: "Visit Report",
            leadingIcon: "lucide:map-pin",
            iconColor: "text-cyan-500",
          }
        ],
      },
      {
        isActive: false,
        href: "#",
        label: "Call Center",
        leadingIcon: "material-symbols:headset-mic-outline-sharp",
        iconColor: "text-green-500",
        trailingIcon: "material-symbols:headset-mic-outline-sharp",
        children: [
          {
            isActive: false,
            href: "/ticketManagement",
            label: "Ticket Management",
            leadingIcon: "mdi:adjust",
            iconColor: "text-cyan-500",
          },
          {
            isActive: false,
            href: "/search",
            label: "Search",
            leadingIcon: "mdi:adjust",
            iconColor: "text-cyan-500",
          }
        ],
      },
    ],
  },
]);
