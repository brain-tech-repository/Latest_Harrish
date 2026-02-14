// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//     images: {
//         remotePatterns: [
//             {
//                 protocol: 'https',
//                 hostname: 'api.coreexl.com',
//                 port: '',
//                 pathname: '/**',
//             },
//         ]
//     },
//     async rewrites() {
//       return [
//         // agentTransaction
//         { source: '/advancepayment/:path*', destination: '/advancePayment/:path*' },
//         { source: '/capscollection/:path*', destination: '/capsCollection/:path*' },
//         { source: '/collection/:path*', destination: '/collection/:path*' },
//         { source: '/distributorsdelivery/:path*', destination: '/distributorsDelivery/:path*' },
//         { source: '/distributorsexchange/:path*', destination: '/distributorsExchange/:path*' },
//         { source: '/distributorsinvoice/:path*', destination: '/distributorsInvoice/:path*' },
//         { source: '/distributorsorder/:path*', destination: '/distributorsOrder/:path*' },
//         { source: '/distributorsreturn/:path*', destination: '/distributorsReturn/:path*' },
//         { source: '/newcustomer/:path*', destination: '/newCustomer/:path*' },
//         { source: '/salesteamload/:path*', destination: '/salesTeamLoad/:path*' },
//         { source: '/salesteamreconcile/:path*', destination: '/salesTeamReconcile/:path*' },
//         { source: '/salesteamroutelinkage/:path*', destination: '/salesTeamRouteLinkage/:path*' },
//         { source: '/salesteamtracking/:path*', destination: '/salesTeamTracking/:path*' },
//         { source: '/salesteamunload/:path*', destination: '/salesTeamUnload/:path*' },
//         { source: '/stocktransfer/:path*', destination: '/stocktransfer/:path*' },
//         // assetsManagement
//         { source: '/assetsmaster/:path*', destination: '/assetsMaster/:path*' },
//         { source: '/assetsrequest/:path*', destination: '/assetsRequest/:path*' },
//         { source: '/callregister/:path*', destination: '/callRegister/:path*' },
//         { source: '/chillerinstallation/:path*', destination: '/chillerInstallation/:path*' },
//         { source: '/chillerinstallation/acf/:path*', destination: '/chillerInstallation/acf/:path*' },
//         { source: '/chillerinstallation/bulktransfer/:path*', destination: '/chillerInstallation/bulkTransfer/:path*' },
//         { source: '/chillerinstallation/installationreport/:path*', destination: '/chillerInstallation/installationReport/:path*' },
//         { source: '/chillerinstallation/iro/:path*', destination: '/chillerInstallation/iro/:path*' },
//         { source: '/fridgeupdatecustomer/:path*', destination: '/fridgeUpdateCustomer/:path*' },
//         { source: '/serviceterritory/:path*', destination: '/serviceTerritory/:path*' },
//         { source: '/servicevisit/:path*', destination: '/serviceVisit/:path*' },
//         // claimManagement
//         { source: '/compensationreport/:path*', destination: '/compensationReport/:path*' },
//         { source: '/compiledclaims/:path*', destination: '/compiledClaims/:path*' },
//         { source: '/petitclaim/:path*', destination: '/petitClaim/:path*' },
//         // companyTransaction
//         { source: '/caps/:path*', destination: '/caps/:path*' },
//         { source: '/creditnote/:path*', destination: '/creditNote/:path*' },
//         { source: '/delivery/:path*', destination: '/delivery/:path*' },
//         { source: '/invoice/:path*', destination: '/invoice/:path*' },
//         { source: '/order/:path*', destination: '/order/:path*' },
//         { source: '/purchaseorder/:path*', destination: '/purchaseOrder/:path*' },
//         { source: '/return/:path*', destination: '/return/:path*' },
//         { source: '/sapintegration/:path*', destination: '/sapIntegration/:path*' },
//         { source: '/tmpreturn/:path*', destination: '/tmpReturn/:path*' },
//         // loyaltyProgram
//         { source: '/customerloyaltypoints/:path*', destination: '/customerLoyaltyPoints/:path*' },
//         { source: '/pointsadjustment/:path*', destination: '/pointsAdjustment/:path*' },
//         // manageDistributors
//         { source: '/distributors/:path*', destination: '/distributors/:path*' },
//         { source: '/distributorsoverview/:path*', destination: '/distributorsOverview/:path*' },
//         { source: '/distributorsstock/:path*', destination: '/distributorsStock/:path*' },
//         // master
//         { source: '/companycustomer/:path*', destination: '/companyCustomer/:path*' },
//         { source: '/discount/:path*', destination: '/discount/:path*' },
//         { source: '/fieldcustomer/:path*', destination: '/fieldCustomer/:path*' },
//         { source: '/item/:path*', destination: '/item/:path*' },
//         { source: '/pricing/:path*', destination: '/pricing/:path*' },
//         { source: '/promotion/:path*', destination: '/promotion/:path*' },
//         { source: '/route/:path*', destination: '/route/:path*' },
//         { source: '/routetransfer/:path*', destination: '/routeTransfer/:path*' },
//         { source: '/routevisit/:path*', destination: '/routeVisit/:path*' },
//         { source: '/salesteam/:path*', destination: '/salesTeam/:path*' },
//         { source: '/vehicle/:path*', destination: '/vehicle/:path*' },
//         // merchandiser
//         { source: '/campaign/:path*', destination: '/campaign/:path*' },
//         { source: '/competitor/:path*', destination: '/competitor/:path*' },
//         { source: '/complaintfeedback/:path*', destination: '/complaintFeedback/:path*' },
//         { source: '/planogram/:path*', destination: '/planogram/:path*' },
//         { source: '/planogramimage/:path*', destination: '/planogramImage/:path*' },
//         { source: '/shelfdisplay/:path*', destination: '/shelfDisplay/:path*' },
//         { source: '/stockinstore/:path*', destination: '/stockinstore/:path*' },
//         { source: '/survey/:path*', destination: '/survey/:path*' },
//         { source: '/surveyquestion/:path*', destination: '/surveyQuestion/:path*' },
//         { source: '/view/:path*', destination: '/view/:path*' },
//         // reports 
//         { source: '/customerreport/:path*', destination: '/customerReport/:path*' },
//         { source: '/salesreportdashboard/:path*', destination: '/salesReportDashboard/:path*' },
//         // alert
//         { source: '/alert/:path*', destination: '/alert/:path*' },
//         // harrisTransaction
//         { source: '/customerorder/:path*', destination: '/customerOrder/:path*' },
//         // profile 
//         { source: '/profile/:path*', destination: '/profile/:path*' },
//         // settingProfile
//         { source: '/settingprofile/:path*', destination: '/settingProfile/:path*' },
//         // settings
//         { source: '/settings/:path*', destination: '/settings/:path*' },
//         // settingsdev
//         { source: '/settingsdev/:path*', destination: '/settingsdev/:path*' },
//         // data
//         { source: '/data/:path*', destination: '/data/:path*' },
//         { source: '/settings/:path*', destination: '/settings/:path*' },
//         { source: '/settings/approval/:path*', destination: '/settings/approval/:path*' },
//         { source: '/settings/area/:path*', destination: '/settings/area/:path*' },
//         { source: '/settings/audittrail/:path*', destination: '/settings/audittrail/:path*' },
//         { source: '/settings/bank/:path*', destination: '/settings/bank/:path*' },
//         { source: '/settings/brand/:path*', destination: '/settings/brand/:path*' },
//         { source: '/settings/changetheme/:path*', destination: '/settings/changetheme/:path*' },
//         { source: '/settings/country/:path*', destination: '/settings/country/:path*' },
//         { source: '/settings/customer/:path*', destination: '/settings/customer/:path*' },
//         { source: '/settings/distributorsstock/:path*', destination: '/settings/distributorsstock/:path*' },
//         { source: '/settings/globalsetting/:path*', destination: '/settings/globalsetting/:path*' },
//         { source: '/settings/item/:path*', destination: '/settings/item/:path*' },
//         { source: '/settings/location/:path*', destination: '/settings/location/:path*' },
//         { source: '/settings/manageassets/:path*', destination: '/settings/manageassets/:path*' },
//         { source: '/settings/managecompany/:path*', destination: '/settings/managecompany/:path*' },
//         { source: '/settings/map/:path*', destination: '/settings/map/:path*' },
//         { source: '/settings/menu/:path*', destination: '/settings/menu/:path*' },
//         { source: '/settings/outlet-channel/:path*', destination: '/settings/outlet-channel/:path*' },
//         { source: '/settings/permission/:path*', destination: '/settings/permission/:path*' },
//         { source: '/settings/processflow/:path*', destination: '/settings/processflow/:path*' },
//         { source: '/settings/promotiontypes/:path*', destination: '/settings/promotiontypes/:path*' },
//         { source: '/settings/region/:path*', destination: '/settings/region/:path*' },
//         { source: '/settings/role/:path*', destination: '/settings/role/:path*' },
//         { source: '/settings/routetype/:path*', destination: '/settings/routetype/:path*' },
//         { source: '/settings/submenu/:path*', destination: '/settings/submenu/:path*' },
//         { source: '/settings/user/:path*', destination: '/settings/user/:path*' },
//       ];
//   },
// };

// export default nextConfig;

// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//     images: {
//         remotePatterns: [
//             {
//                 protocol: 'https',
//                 hostname: 'api.coreexl.com',
//                 port: '',
//                 pathname: '/**',
//             },
//         ]
//     },
//     async rewrites() {
//       return [
//         // agentTransaction
//         { source: '/advancepayment/:path*', destination: '/advancePayment/:path*' },
//         { source: '/capscollection/:path*', destination: '/capsCollection/:path*' },
//         { source: '/collection/:path*', destination: '/collection/:path*' },
//         { source: '/distributorsdelivery/:path*', destination: '/distributorsDelivery/:path*' },
//         { source: '/distributorsexchange/:path*', destination: '/distributorsExchange/:path*' },
//         { source: '/distributorsinvoice/:path*', destination: '/distributorsInvoice/:path*' },
//         { source: '/distributorsorder/:path*', destination: '/distributorsOrder/:path*' },
//         { source: '/distributorsreturn/:path*', destination: '/distributorsReturn/:path*' },
//         { source: '/newcustomer/:path*', destination: '/newCustomer/:path*' },
//         { source: '/salesteamload/:path*', destination: '/salesTeamLoad/:path*' },
//         { source: '/salesteamreconcile/:path*', destination: '/salesTeamReconcile/:path*' },
//         { source: '/salesteamroutelinkage/:path*', destination: '/salesTeamRouteLinkage/:path*' },
//         { source: '/salesteamtracking/:path*', destination: '/salesTeamTracking/:path*' },
//         { source: '/salesteamunload/:path*', destination: '/salesTeamUnload/:path*' },
//         { source: '/stocktransfer/:path*', destination: '/stocktransfer/:path*' },
//         // assetsManagement
//         { source: '/assetsmaster/:path*', destination: '/assetsMaster/:path*' },
//         { source: '/assetsrequest/:path*', destination: '/assetsRequest/:path*' },
//         { source: '/callregister/:path*', destination: '/callRegister/:path*' },
//         { source: '/chillerinstallation/:path*', destination: '/chillerInstallation/:path*' },
//         { source: '/chillerinstallation/acf/:path*', destination: '/chillerInstallation/acf/:path*' },
//         { source: '/chillerinstallation/bulktransfer/:path*', destination: '/chillerInstallation/bulkTransfer/:path*' },
//         { source: '/chillerinstallation/installationreport/:path*', destination: '/chillerInstallation/installationReport/:path*' },
//         { source: '/chillerinstallation/iro/:path*', destination: '/chillerInstallation/iro/:path*' },
//         { source: '/fridgeupdatecustomer/:path*', destination: '/fridgeUpdateCustomer/:path*' },
//         { source: '/serviceterritory/:path*', destination: '/serviceTerritory/:path*' },
//         { source: '/servicevisit/:path*', destination: '/serviceVisit/:path*' },
//         // claimManagement
//         { source: '/compensationreport/:path*', destination: '/compensationReport/:path*' },
//         { source: '/compiledclaims/:path*', destination: '/compiledClaims/:path*' },
//         { source: '/petitclaim/:path*', destination: '/petitClaim/:path*' },
//         // companyTransaction
//         { source: '/caps/:path*', destination: '/caps/:path*' },
//         { source: '/creditnote/:path*', destination: '/creditNote/:path*' },
//         { source: '/delivery/:path*', destination: '/delivery/:path*' },
//         { source: '/invoice/:path*', destination: '/invoice/:path*' },
//         { source: '/order/:path*', destination: '/order/:path*' },
//         { source: '/purchaseorder/:path*', destination: '/purchaseOrder/:path*' },
//         { source: '/return/:path*', destination: '/return/:path*' },
//         { source: '/sapintegration/:path*', destination: '/sapIntegration/:path*' },
//         { source: '/tmpreturn/:path*', destination: '/tmpReturn/:path*' },
//         // loyaltyProgram
//         { source: '/customerloyaltypoints/:path*', destination: '/customerLoyaltyPoints/:path*' },
//         { source: '/pointsadjustment/:path*', destination: '/pointsAdjustment/:path*' },
//         // manageDistributors
//         { source: '/distributors/:path*', destination: '/distributors/:path*' },
//         { source: '/distributorsoverview/:path*', destination: '/distributorsOverview/:path*' },
//         { source: '/distributorsstock/:path*', destination: '/distributorsStock/:path*' },
//         // master
//         { source: '/companycustomer/:path*', destination: '/companyCustomer/:path*' },
//         { source: '/discount/:path*', destination: '/discount/:path*' },
//         { source: '/fieldcustomer/:path*', destination: '/fieldCustomer/:path*' },
//         { source: '/item/:path*', destination: '/item/:path*' },
//         { source: '/pricing/:path*', destination: '/pricing/:path*' },
//         { source: '/promotion/:path*', destination: '/promotion/:path*' },
//         { source: '/route/:path*', destination: '/route/:path*' },
//         { source: '/routetransfer/:path*', destination: '/routeTransfer/:path*' },
//         { source: '/routevisit/:path*', destination: '/routeVisit/:path*' },
//         { source: '/salesteam/:path*', destination: '/salesTeam/:path*' },
//         { source: '/vehicle/:path*', destination: '/vehicle/:path*' },
//         // merchandiser
//         { source: '/campaign/:path*', destination: '/campaign/:path*' },
//         { source: '/competitor/:path*', destination: '/competitor/:path*' },
//         { source: '/complaintfeedback/:path*', destination: '/complaintFeedback/:path*' },
//         { source: '/planogram/:path*', destination: '/planogram/:path*' },
//         { source: '/planogramimage/:path*', destination: '/planogramImage/:path*' },
//         { source: '/shelfdisplay/:path*', destination: '/shelfDisplay/:path*' },
//         { source: '/stockinstore/:path*', destination: '/stockinstore/:path*' },
//         { source: '/survey/:path*', destination: '/survey/:path*' },
//         { source: '/surveyquestion/:path*', destination: '/surveyQuestion/:path*' },
//         { source: '/view/:path*', destination: '/view/:path*' },
//         // reports 
//         { source: '/customerreport/:path*', destination: '/customerReport/:path*' },
//         { source: '/salesreportdashboard/:path*', destination: '/salesReportDashboard/:path*' },
//         // alert
//         { source: '/alert/:path*', destination: '/alert/:path*' },
//         // harrisTransaction
//         { source: '/customerorder/:path*', destination: '/customerOrder/:path*' },
//         // profile 
//         { source: '/profile/:path*', destination: '/profile/:path*' },
//         // settingProfile
//         { source: '/settingprofile/:path*', destination: '/settingProfile/:path*' },
//         // settings
//         { source: '/settings/:path*', destination: '/settings/:path*' },
//         // settingsdev
//         { source: '/settingsdev/:path*', destination: '/settingsdev/:path*' },
//         // data
//         { source: '/data/:path*', destination: '/data/:path*' },
//         { source: '/settings/:path*', destination: '/settings/:path*' },
//         { source: '/settings/approval/:path*', destination: '/settings/approval/:path*' },
//         { source: '/settings/area/:path*', destination: '/settings/area/:path*' },
//         { source: '/settings/audittrail/:path*', destination: '/settings/audittrail/:path*' },
//         { source: '/settings/bank/:path*', destination: '/settings/bank/:path*' },
//         { source: '/settings/brand/:path*', destination: '/settings/brand/:path*' },
//         { source: '/settings/changetheme/:path*', destination: '/settings/changetheme/:path*' },
//         { source: '/settings/country/:path*', destination: '/settings/country/:path*' },
//         { source: '/settings/customer/:path*', destination: '/settings/customer/:path*' },
//         { source: '/settings/distributorsstock/:path*', destination: '/settings/distributorsstock/:path*' },
//         { source: '/settings/globalsetting/:path*', destination: '/settings/globalsetting/:path*' },
//         { source: '/settings/item/:path*', destination: '/settings/item/:path*' },
//         { source: '/settings/location/:path*', destination: '/settings/location/:path*' },
//         { source: '/settings/manageassets/:path*', destination: '/settings/manageassets/:path*' },
//         { source: '/settings/managecompany/:path*', destination: '/settings/managecompany/:path*' },
//         { source: '/settings/map/:path*', destination: '/settings/map/:path*' },
//         { source: '/settings/menu/:path*', destination: '/settings/menu/:path*' },
//         { source: '/settings/outlet-channel/:path*', destination: '/settings/outlet-channel/:path*' },
//         { source: '/settings/permission/:path*', destination: '/settings/permission/:path*' },
//         { source: '/settings/processflow/:path*', destination: '/settings/processflow/:path*' },
//         { source: '/settings/promotiontypes/:path*', destination: '/settings/promotiontypes/:path*' },
//         { source: '/settings/region/:path*', destination: '/settings/region/:path*' },
//         { source: '/settings/role/:path*', destination: '/settings/role/:path*' },
//         { source: '/settings/routetype/:path*', destination: '/settings/routetype/:path*' },
//         { source: '/settings/submenu/:path*', destination: '/settings/submenu/:path*' },
//         { source: '/settings/user/:path*', destination: '/settings/user/:path*' },
//       ];
//   },
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false, // 🔥 Moved from experimental as per Next 16
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.coreexl.com',
        port: '',
        pathname: '/**',
      },
    ]
  },
  async rewrites() {
    return [
      // Unified list/add/edit rewrites for all major resources
      { source: '/advancepayment/add', destination: '/advancePayment/add' },
      { source: '/advancepayment/:uuid', destination: '/advancePayment/:uuid' },
      { source: '/advancepayment', destination: '/advancePayment' },

      { source: '/capscollection/add', destination: '/capsCollection/add' },
      { source: '/capscollection/:uuid', destination: '/capsCollection/:uuid' },
      { source: '/capscollection', destination: '/capsCollection' },

      { source: '/collection/add', destination: '/collection/add' },
      { source: '/collection/:uuid', destination: '/collection/:uuid' },
      { source: '/collection', destination: '/collection' },

      { source: '/distributorsdelivery/add', destination: '/distributorsDelivery/add' },
      { source: '/distributorsdelivery/details/:uuid', destination: '/distributorsDelivery/details/:uuid' },
      { source: '/distributorsdelivery', destination: '/distributorsDelivery' },

      { source: '/distributorsexchange/add', destination: '/distributorsExchange/add' },
      { source: '/distributorsexchange/details/:uuid', destination: '/distributorsExchange/details/:uuid' },
      { source: '/distributorsexchange', destination: '/distributorsExchange' },

      { source: '/distributorsinvoice/add', destination: '/distributorsInvoice/add' },
      { source: '/distributorsinvoice/details/:uuid', destination: '/distributorsInvoice/details/:uuid' },
      { source: '/distributorsinvoice', destination: '/distributorsInvoice' },

      { source: '/distributorsorder/add', destination: '/distributorsOrder/add' },
      { source: '/distributorsorder/details/:uuid', destination: '/distributorsOrder/details/:uuid' },
      { source: '/distributorsorder', destination: '/distributorsOrder' },

      { source: '/distributorsreturn/add', destination: '/distributorsReturn/add' },
      { source: '/distributorsreturn/details/:uuid', destination: '/distributorsReturn/details/:uuid' },
      { source: '/distributorsreturn', destination: '/distributorsReturn' },

      { source: '/newcustomer/add', destination: '/newCustomer/add' },
      { source: '/newcustomer/:uuid', destination: '/newCustomer/:uuid' },
      { source: '/newcustomer/details/:uuid', destination: '/newCustomer/details/:uuid' },
      { source: '/newcustomer', destination: '/newCustomer' },

      { source: '/salesteamload/add', destination: '/salesTeamLoad/add' },
      { source: '/salesteamload/:uuid', destination: '/salesTeamLoad/:uuid' },
      { source: '/salesteamload', destination: '/salesTeamLoad' },

      { source: '/salesteamreconcile/add', destination: '/salesTeamReconcile/add' },
      { source: '/salesteamreconcile/details/:uuid', destination: '/salesTeamReconcile/details/:uuid' },
      { source: '/salesteamreconcile', destination: '/salesTeamReconcile' },

      { source: '/salesteamroutelinkage/add', destination: '/salesTeamRouteLinkage/add' },
      { source: '/salesteamroutelinkage/:uuid', destination: '/salesTeamRouteLinkage/:uuid' },
      { source: '/salesteamroutelinkage', destination: '/salesTeamRouteLinkage' },

      { source: '/salesteamtracking/add', destination: '/salesTeamTracking/add' },
      { source: '/salesteamtracking/:uuid', destination: '/salesTeamTracking/:uuid' },
      { source: '/salesteamtracking', destination: '/salesTeamTracking' },

      { source: '/salesteamunload/add', destination: '/salesTeamUnload/add' },
      { source: '/salesteamunload/details/:uuid', destination: '/salesTeamUnload/details/:uuid' },
      { source: '/salesteamunload', destination: '/salesTeamUnload' },

      { source: '/stocktransfer/add', destination: '/stocktransfer/add' },
      { source: '/stocktransfer/:uuid', destination: '/stocktransfer/:uuid' },
      { source: '/stocktransfer', destination: '/stocktransfer' },
      // agentTransaction
      // Unified list/add/edit rewrites for all major resources
      { source: '/advancepayment/add', destination: '/advancePayment/add' },
      { source: '/advancepayment/:uuid', destination: '/advancePayment/:uuid' },
      { source: '/advancepayment', destination: '/advancePayment' },

      { source: '/capscollection/add', destination: '/capsCollection/add' },
      { source: '/capscollection/details/:uuid', destination: '/capsCollection/details/:uuid' },
      { source: '/capscollection', destination: '/capsCollection' },

      { source: '/collection/add', destination: '/collection/add' },
      { source: '/collection/:uuid', destination: '/collection/:uuid' },
      { source: '/collection', destination: '/collection' },

      { source: '/distributorsdelivery/add', destination: '/distributorsDelivery/add' },
      { source: '/distributorsdelivery/:uuid', destination: '/distributorsDelivery/:uuid' },
      { source: '/distributorsdelivery', destination: '/distributorsDelivery' },

      { source: '/distributorsexchange/add', destination: '/distributorsExchange/add' },
      { source: '/distributorsexchange/:uuid', destination: '/distributorsExchange/:uuid' },
      { source: '/distributorsexchange', destination: '/distributorsExchange' },

      { source: '/distributorsinvoice/add', destination: '/distributorsInvoice/add' },
      { source: '/distributorsinvoice/:uuid', destination: '/distributorsInvoice/:uuid' },
      { source: '/distributorsinvoice', destination: '/distributorsInvoice' },

      { source: '/distributorsorder/add', destination: '/distributorsOrder/add' },
      { source: '/distributorsorder/:uuid', destination: '/distributorsOrder/:uuid' },
      { source: '/distributorsorder', destination: '/distributorsOrder' },

      { source: '/distributorsreturn/add', destination: '/distributorsReturn/add' },
      { source: '/distributorsreturn/:uuid', destination: '/distributorsReturn/:uuid' },
      { source: '/distributorsreturn', destination: '/distributorsReturn' },



      { source: '/salesteamload/add', destination: '/salesTeamLoad/add' },
      { source: '/salesteamload/details/:uuid', destination: '/salesTeamLoad/details/:uuid' },
      { source: '/salesteamload', destination: '/salesTeamLoad' },



      { source: '/salesteamroutelinkage/add', destination: '/salesTeamRouteLinkage/add' },
      { source: '/salesteamroutelinkage/:uuid', destination: '/salesTeamRouteLinkage/:uuid' },
      { source: '/salesteamroutelinkage', destination: '/salesTeamRouteLinkage' },

      { source: '/salesteamtracking/add', destination: '/salesTeamTracking/add' },
      { source: '/salesteamtracking/:uuid', destination: '/salesTeamTracking/:uuid' },
      { source: '/salesteamtracking', destination: '/salesTeamTracking' },

      { source: '/salesteamunload/add', destination: '/salesTeamUnload/add' },
      { source: '/salesteamunload/:uuid', destination: '/salesTeamUnload/:uuid' },
      { source: '/salesteamunload', destination: '/salesTeamUnload' },

      { source: '/stocktransfer/add', destination: '/stocktransfer/add' },
      { source: '/stocktransfer/:uuid', destination: '/stocktransfer/:uuid' },
      { source: '/stocktransfer', destination: '/stocktransfer' },
      // assetsManagement
      { source: '/assetsmaster/add', destination: '/assetsMaster/add' },
      { source: '/assetsmaster/:uuid', destination: '/assetsMaster/:uuid' },
      { source: '/assetsmaster/view/:uuid', destination: '/assetsMaster/view/:uuid' },
      { source: '/assetsmaster', destination: '/assetsMaster' },

      { source: '/assetsrequest/add', destination: '/assetsRequest/add' },
      { source: '/assetsrequest/:id', destination: '/assetsRequest/:id' },
      { source: '/assetsrequest/view/:uuid', destination: '/assetsRequest/view/:uuid' },
      { source: '/assetsrequest', destination: '/assetsRequest' },

      { source: '/callregister/add', destination: '/callRegister/add' },
      { source: '/callregister/:uuid', destination: '/callRegister/:uuid' },
      { source: '/callregister/details/:uuid', destination: '/callRegister/details/:uuid' },
      { source: '/callregister', destination: '/callRegister' },

      { source: '/chillerinstallation/add', destination: '/chillerInstallation/add' },
      { source: '/chillerinstallation/:uuid', destination: '/chillerInstallation/:uuid' },
      { source: '/chillerinstallation', destination: '/chillerInstallation' },
      { source: '/chillerinstallation/installationreport/view/:uuid', destination: '/chillerInstallation/installationReport/view/:uuid' },
      { source: '/chillerinstallation/installationreport/:uuid', destination: '/chillerInstallation/installationReport/:uuid' },
      { source: '/chillerinstallation/installationreport', destination: '/chillerInstallation/installationReport' },
      { source: '/chillerinstallation/bulktransfer/add', destination: '/chillerInstallation/bulkTransfer/add' },
      { source: '/chillerinstallation/bulktransfer/addallocated', destination: '/chillerInstallation/bulkTransfer/addAllocated' },
      { source: '/chillerinstallation/bulktransfer/:uuid', destination: '/chillerInstallation/bulkTransfer/:uuid' },
      { source: '/chillerinstallation/bulktransfer/detail/:uuid', destination: '/chillerInstallation/bulkTransfer/detail/:uuid' },
      { source: '/chillerinstallation/bulktransfer', destination: '/chillerInstallation/bulkTransfer' },
      // { source: '/chillerinstallation/iro/view/:id', destination: '/chillerInstallation/iro/view/:id' },
      // { source: '/chillerinstallation/iro', destination: '/chillerInstallation/iro' },
      { source: '/chillerinstallation/iro/:path*', destination: '/chillerInstallation/iro/:path*' },
      { source: '/fridgeupdatecustomer/add', destination: '/fridgeUpdateCustomer/add' },
      { source: '/fridgeupdatecustomer/:id', destination: '/fridgeUpdateCustomer/:id' },
      { source: '/fridgeupdatecustomer/view/:uuid', destination: '/fridgeUpdateCustomer/view/:uuid' },
      { source: '/fridgeupdatecustomer', destination: '/fridgeUpdateCustomer' },

      { source: '/serviceterritory/add', destination: '/serviceTerritory/add' },
      { source: '/serviceterritory/:uuid', destination: '/serviceTerritory/:uuid' },
      { source: '/serviceterritory', destination: '/serviceTerritory' },

      { source: '/servicevisit/add', destination: '/serviceVisit/add' },
      { source: '/servicevisit/:uuid', destination: '/serviceVisit/:uuid' },
      { source: '/servicevisit/details/:uuid', destination: '/serviceVisit/details/:uuid' },
      { source: '/servicevisit', destination: '/serviceVisit' },
      // claimManagement
      { source: '/compensationreport/add', destination: '/compensationReport/add' },
      { source: '/compensationreport/:uuid', destination: '/compensationReport/:uuid' },
      { source: '/compensationreport', destination: '/compensationReport' },

      { source: '/compiledclaims/add', destination: '/compiledClaims/add' },
      { source: '/compiledclaims/:uuid', destination: '/compiledClaims/:uuid' },
      { source: '/compiledclaims', destination: '/compiledClaims' },

      { source: '/petitclaim/add', destination: '/petitClaim/add' },
      { source: '/petitclaim/:uuid', destination: '/petitClaim/:uuid' },
      { source: '/petitclaim', destination: '/petitClaim' },
      // companyTransaction
      { source: '/caps/add', destination: '/caps/add' },
      { source: '/caps/:uuid', destination: '/caps/:uuid' },
      { source: '/caps', destination: '/caps' },

      { source: '/creditnote/add', destination: '/creditNote/add' },
      { source: '/creditnote/:uuid', destination: '/creditNote/:uuid' },
      { source: '/creditnote', destination: '/creditNote' },

      { source: '/delivery/add', destination: '/delivery/add' },
      { source: '/delivery/:uuid', destination: '/delivery/:uuid' },
      { source: '/delivery', destination: '/delivery' },

      { source: '/invoice/add', destination: '/invoice/add' },
      { source: '/invoice/:uuid', destination: '/invoice/:uuid' },
      { source: '/invoice', destination: '/invoice' },

      { source: '/order/add', destination: '/order/add' },
      { source: '/order/:uuid', destination: '/order/:uuid' },
      { source: '/order', destination: '/order' },

      { source: '/purchaseorder/add', destination: '/purchaseOrder/add' },
      { source: '/purchaseorder/:uuid', destination: '/purchaseOrder/:uuid' },
      { source: '/purchaseorder', destination: '/purchaseOrder' },

      { source: '/return/add', destination: '/return/add' },
      { source: '/return/:uuid', destination: '/return/:uuid' },
      { source: '/return', destination: '/return' },

      { source: '/sapintegration/add', destination: '/sapIntegration/add' },
      { source: '/sapintegration/:uuid', destination: '/sapIntegration/:uuid' },
      { source: '/sapintegration', destination: '/sapIntegration' },

      { source: '/tmpreturn/add', destination: '/tmpReturn/add' },
      { source: '/tmpreturn/:uuid', destination: '/tmpReturn/:uuid' },
      { source: '/tmpreturn', destination: '/tmpReturn' },
      // loyaltyProgram
      { source: '/customerloyaltypoints/add', destination: '/customerLoyaltyPoints/add' },
      { source: '/customerloyaltypoints/:uuid', destination: '/customerLoyaltyPoints/:uuid' },
      { source: '/customerloyaltypoints/details/:uuid', destination: '/customerLoyaltyPoints/details/:uuid' },
      { source: '/customerloyaltypoints', destination: '/customerLoyaltyPoints' },

      { source: '/pointsadjustment/add', destination: '/pointsAdjustment/add' },
      { source: '/pointsadjustment/:uuid', destination: '/pointsAdjustment/:uuid' },
      { source: '/pointsadjustment', destination: '/pointsAdjustment' },
      // manageDistributors
      { source: '/distributors/add', destination: '/distributors/add' },
      { source: '/distributors/:uuid', destination: '/distributors/:uuid' },
      { source: '/distributors', destination: '/distributors' },

      { source: '/distributorsoverview/add', destination: '/distributorsOverview/add' },
      { source: '/distributorsoverview/:uuid', destination: '/distributorsOverview/:uuid' },
      { source: '/distributorsoverview', destination: '/distributorsOverview' },

      { source: '/distributorsstock/add', destination: '/distributorsStock/add' },
      { source: '/distributorsstock/:uuid', destination: '/distributorsStock/:uuid' },
      { source: '/distributorsstock', destination: '/distributorsStock' },
      // master
      { source: '/companycustomer/add', destination: '/companyCustomer/add' },
      { source: '/companycustomer/:uuid', destination: '/companyCustomer/:uuid' },
      { source: '/companycustomer/details/:uuid', destination: '/companyCustomer/details/:uuid' },
      { source: '/companycustomer', destination: '/companyCustomer' },

      { source: '/discount/add', destination: '/discount/add' },
      { source: '/discount/:uuid', destination: '/discount/:uuid' },
      { source: '/discount', destination: '/discount' },

      { source: '/fieldcustomer/add', destination: '/fieldCustomer/add' },
      { source: '/fieldcustomer/details/:uuid', destination: '/fieldCustomer/details/:uuid' },
      { source: '/fieldcustomer/:uuid', destination: '/fieldCustomer/:uuid' },
      { source: '/fieldcustomer/details/:uuid', destination: '/fieldCustomer/details/:uuid' },
      { source: '/fieldcustomer', destination: '/fieldCustomer' },

      { source: '/item/add', destination: '/item/add' },
      { source: '/item/:uuid', destination: '/item/:uuid' },
      { source: '/item/details/:uuid', destination: '/item/details/:uuid' },
      { source: '/item', destination: '/item' },

      { source: '/pricing/add', destination: '/pricing/add' },
      { source: '/pricing/:uuid', destination: '/pricing/:uuid' },
      { source: '/pricing', destination: '/pricing' },

      { source: '/promotion/add', destination: '/promotion/add' },
      { source: '/promotion/:uuid', destination: '/promotion/:uuid' },
      { source: '/promotion', destination: '/promotion' },

      { source: '/route/add', destination: '/route/add' },
      { source: '/route/:uuid', destination: '/route/:uuid' },
      { source: '/route', destination: '/route' },

      { source: '/routetransfer/add', destination: '/routeTransfer/add' },
      { source: '/routetransfer/:uuid', destination: '/routeTransfer/:uuid' },
      { source: '/routetransfer', destination: '/routeTransfer' },

      { source: '/routevisit/add', destination: '/routeVisit/add' },
      { source: '/routevisit/:uuid', destination: '/routeVisit/:uuid' },
      { source: '/routevisit', destination: '/routeVisit' },

      { source: '/salesteam/add', destination: '/salesTeam/add' },
      { source: '/salesteam/:uuid', destination: '/salesTeam/:uuid' },
      { source: '/salesteam/details/:uuid', destination: '/salesTeam/details/:uuid' },
      { source: '/salesteam', destination: '/salesTeam' },

      { source: '/vehicle/add', destination: '/vehicle/add' },
      { source: '/vehicle/:uuid', destination: '/vehicle/:uuid' },
      { source: '/vehicle', destination: '/vehicle' },
      // merchandiser
      { source: '/campaign/add', destination: '/campaign/add' },
      { source: '/campaign/:uuid', destination: '/campaign/:uuid' },
      { source: '/campaign', destination: '/campaign' },

      { source: '/competitor/add', destination: '/competitor/add' },
      { source: '/competitor/:uuid', destination: '/competitor/:uuid' },
      { source: '/competitor', destination: '/competitor' },

      { source: '/complaintfeedback/add', destination: '/complaintFeedback/add' },
      { source: '/complaintfeedback/:uuid', destination: '/complaintFeedback/:uuid' },
      { source: '/complaintfeedback', destination: '/complaintFeedback' },

      { source: '/planogram/add', destination: '/planogram/add' },
      { source: '/planogram/:uuid', destination: '/planogram/:uuid' },
      { source: '/planogram', destination: '/planogram' },

      { source: '/planogramimage/add', destination: '/planogramImage/add' },
      { source: '/planogramimage/:uuid', destination: '/planogramImage/:uuid' },
      { source: '/planogramimage', destination: '/planogramImage' },

      { source: '/shelfdisplay/add', destination: '/shelfDisplay/add' },
      { source: '/shelfdisplay/:uuid', destination: '/shelfDisplay/:uuid' },
      { source: '/shelfdisplay/view/:uuid', destination: '/shelfDisplay/view/:uuid' },
      { source: '/shelfdisplay', destination: '/shelfDisplay' },

      { source: '/stockinstore/add', destination: '/stockinstore/add' },
      { source: '/stockinstore/:uuid', destination: '/stockinstore/:uuid' },
      { source: '/stockinstore', destination: '/stockinstore' },

      { source: '/survey/add', destination: '/survey/add' },
      { source: '/survey/:uuid', destination: '/survey/:uuid' },
      { source: '/survey', destination: '/survey' },

      { source: '/surveyquestion/add', destination: '/surveyQuestion/add' },
      { source: '/surveyquestion/:uuid', destination: '/surveyQuestion/:uuid' },
      { source: '/surveyquestion', destination: '/surveyQuestion' },

      { source: '/view/add', destination: '/view/add' },
      { source: '/view/:uuid', destination: '/view/:uuid' },
      { source: '/view', destination: '/view' },
      // reports 
      { source: '/dashboard', destination: '/adminDashboard' },
      { source: '/customerreport', destination: '/customerReport' },
      { source: '/salesreportdashboard', destination: '/salesReportDashboard' },
      { source: '/itemreport', destination: '/itemReport' },
      { source: '/attendencereport', destination: '/attendenceReport' },
      { source: '/poorderreport', destination: '/poOrderReport' },
      { source: '/comparisonreport', destination: '/comparisonReport' },
      { source: '/loadunloadreport', destination: '/loadUnloadReport' },
      { source: '/visitreport', destination: '/visitReport' },

      // alert
      { source: '/alert/add', destination: '/alert/add' },
      { source: '/alert/:uuid', destination: '/alert/:uuid' },
      { source: '/alert', destination: '/alert' },
      // harrisTransaction
      { source: '/customerorder/add', destination: '/customerOrder/add' },
      { source: '/customerorder/:uuid', destination: '/customerOrder/:uuid' },
      { source: '/customerorder', destination: '/customerOrder' },
      // profile 
      { source: '/profile/add', destination: '/profile/add' },
      { source: '/profile/:uuid', destination: '/profile/:uuid' },
      { source: '/profile', destination: '/profile' },
      // settingProfile
      { source: '/settingprofile/add', destination: '/settingProfile/add' },
      { source: '/settingprofile/:uuid', destination: '/settingProfile/:uuid' },
      { source: '/settingprofile', destination: '/settingProfile' },
      // settings
      { source: '/settings/add', destination: '/settings/add' },
      { source: '/settings/:uuid', destination: '/settings/:uuid' },
      { source: '/settings', destination: '/settings' },
      // settingsdev
      { source: '/settingsdev/add', destination: '/settingsdev/add' },
      { source: '/settingsdev/:uuid', destination: '/settingsdev/:uuid' },
      { source: '/settingsdev', destination: '/settingsdev' },
      // data
      { source: '/data/add', destination: '/data/add' },
      { source: '/data/:uuid', destination: '/data/:uuid' },
      { source: '/data', destination: '/data' },
      { source: '/settings/:path*', destination: '/settings/:path*' },


      { source: '/settings/tier/add', destination: '/settings/tier/add' },
      { source: '/settings/tier/:uuid', destination: '/settings/tier/:uuid' },
      { source: '/settings/tier', destination: '/settings/tier' },

      { source: '/settings/rewardcategory/add', destination: '/settings/rewardCategory/add' },
      { source: '/settings/rewardcategory/:uuid', destination: '/settings/rewardCategory/:uuid' },
      { source: '/settings/rewardcategory', destination: '/settings/rewardCategory' },

      { source: '/settings/bonuspoints/add', destination: '/settings/bonusPoints/add' },
      { source: '/settings/bonuspoints/:uuid', destination: '/settings/bonusPoints/:uuid' },
      { source: '/settings/bonuspoints', destination: '/settings/bonusPoints' },

      { source: '/settings/approval/addworkflow', destination: '/settings/approval/addworkflow' },
      { source: '/settings/approval/:uuid', destination: '/settings/approval/:uuid' },
      { source: '/settings/approval/addworkflow', destination: '/settings/approval/addworkflow' },
      { source: '/settings/approval', destination: '/settings/approval' },
      { source: '/settings/approval/assignworkflow', destination: '/settings/approval/assignworkflow' },

      { source: '/settings/area/add', destination: '/settings/area/add' },
      { source: '/settings/area/:uuid', destination: '/settings/area/:uuid' },
      { source: '/settings/area', destination: '/settings/area' },

      { source: '/settings/audittrail/add', destination: '/settings/audittrail/add' },
      { source: '/settings/audittrail/:uuid', destination: '/settings/audittrail/:uuid' },
      { source: '/settings/audittrail', destination: '/settings/audittrail' },

      { source: '/settings/bank/add', destination: '/settings/bank/add' },
      { source: '/settings/bank/:uuid', destination: '/settings/bank/:uuid' },
      { source: '/settings/bank', destination: '/settings/bank' },

      { source: '/settings/brand/add', destination: '/settings/brand/add' },
      { source: '/settings/brand/:uuid', destination: '/settings/brand/:uuid' },
      { source: '/settings/brand', destination: '/settings/brand' },

      { source: '/settings/changetheme/add', destination: '/settings/changeTheme/add' },
      { source: '/settings/changetheme/:uuid', destination: '/settings/changeTheme/:uuid' },
      { source: '/settings/changetheme', destination: '/settings/changeTheme' },

      { source: '/settings/country/add', destination: '/settings/country/add' },
      { source: '/settings/country/:uuid', destination: '/settings/country/:uuid' },
      { source: '/settings/country', destination: '/settings/country' },

      { source: '/settings/customer/customercategory/add', destination: '/settings/customer/customerCategory/add' },
      { source: '/settings/customer/customercategory/:id', destination: '/settings/customer/customerCategory/:id' },
      { source: '/settings/customer/customercategory', destination: '/settings/customer/customerCategory' },

      { source: '/settings/customer/customersubcategory/add', destination: '/settings/customer/customerSubCategory/add' },
      { source: '/settings/customer/customersubcategory/:id', destination: '/settings/customer/customerSubCategory/:id' },
      { source: '/settings/customer/customersubcategory', destination: '/settings/customer/customerSubCategory' },

      { source: '/settings/distributorsstock/add', destination: '/settings/distributorsstock/add' },
      { source: '/settings/distributorsstock/:uuid', destination: '/settings/distributorsstock/:uuid' },
      { source: '/settings/distributorsstock', destination: '/settings/distributorsstock' },

      { source: '/settings/globalsetting/add', destination: '/settings/globalSetting/add' },
      { source: '/settings/globalsetting/:uuid', destination: '/settings/globalSetting/:uuid' },
      { source: '/settings/globalsetting', destination: '/settings/globalSetting' },

      { source: '/settings/item/category/add', destination: '/settings/item/category/add' },
      { source: '/settings/item/category/:uuid', destination: '/settings/item/category/:uuid' },
      { source: '/settings/item/category', destination: '/settings/item/category' },

      { source: '/settings/item/subcategory/add', destination: '/settings/item/subCategory/add' },
      { source: '/settings/item/subcategory/:uuid', destination: '/settings/item/subCategory/:uuid' },
      { source: '/settings/item/subcategory', destination: '/settings/item/subCategory' },

      { source: '/settings/location/add', destination: '/settings/location/add' },
      { source: '/settings/location/:uuid', destination: '/settings/location/:uuid' },
      { source: '/settings/location', destination: '/settings/location' },

      { source: '/settings/manageassets/assetscategory/add', destination: '/settings/manageAssets/assetsCategory/add' },
      { source: '/settings/manageassets/assetscategory/:uuid', destination: '/settings/manageAssets/assetsCategory/:uuid' },
      { source: '/settings/manageassets/assetscategory', destination: '/settings/manageAssets/assetsCategory' },

      { source: '/settings/manageassets/assetsmodel/add', destination: '/settings/manageAssets/assetsModel/add' },
      { source: '/settings/manageassets/assetsmodel/:uuid', destination: '/settings/manageAssets/assetsModel/:uuid' },
      { source: '/settings/manageassets/assetsmodel', destination: '/settings/manageAssets/assetsModel' },

      { source: '/settings/manageassets/branding/add', destination: '/settings/manageAssets/branding/add' },
      { source: '/settings/manageassets/branding/:uuid', destination: '/settings/manageAssets/branding/:uuid' },
      { source: '/settings/manageassets/branding', destination: '/settings/manageAssets/branding' },

      { source: '/settings/manageassets/manufacturer/add', destination: '/settings/manageAssets/manufacturer/add' },
      { source: '/settings/manageassets/manufacturer/:uuid', destination: '/settings/manageAssets/manufacturer/:uuid' },
      { source: '/settings/manageassets/manufacturer', destination: '/settings/manageAssets/manufacturer' },

      { source: '/settings/manageassets/project/add', destination: '/settings/manageAssets/project/add' },
      { source: '/settings/manageassets/project/:uuid', destination: '/settings/manageAssets/project/:uuid' },
      { source: '/settings/manageassets/project', destination: '/settings/manageAssets/project' },

      { source: '/settings/manageassets/sparemenu/add', destination: '/settings/manageAssets/spareMenu/add' },
      { source: '/settings/manageassets/sparemenu/:uuid', destination: '/settings/manageAssets/spareMenu/:uuid' },
      { source: '/settings/manageassets/sparemenu', destination: '/settings/manageAssets/spareMenu' },

      { source: '/settings/manageassets/sparecategory/add', destination: '/settings/manageAssets/spareCategory/add' },
      { source: '/settings/manageassets/sparecategory/:uuid', destination: '/settings/manageAssets/spareCategory/:uuid' },
      { source: '/settings/manageassets/sparecategory', destination: '/settings/manageAssets/spareCategory' },

      { source: '/settings/manageassets/sparesubcategory/add', destination: '/settings/manageAssets/spareSubCategory/add' },
      { source: '/settings/manageassets/sparesubcategory/:uuid', destination: '/settings/manageAssets/spareSubCategory/:uuid' },
      { source: '/settings/manageassets/sparesubcategory', destination: '/settings/manageAssets/spareSubCategory' },

      { source: '/settings/manageassets/vendor/add', destination: '/settings/manageAssets/vendor/add' },
      { source: '/settings/manageassets/vendor/:uuid', destination: '/settings/manageAssets/vendor/:uuid' },
      { source: '/settings/manageassets/vendor', destination: '/settings/manageAssets/vendor' },

      { source: '/settings/managecompany/company/add', destination: '/settings/manageCompany/company/add' },
      { source: '/settings/managecompany/company/:id', destination: '/settings/manageCompany/company/:id' },
      { source: '/settings/managecompany/company/details/:id', destination: '/settings/manageCompany/company/details/:id' },
      { source: '/settings/managecompany/company', destination: '/settings/manageCompany/company' },

      { source: '/settings/map/add', destination: '/settings/map/add' },
      { source: '/settings/map/:uuid', destination: '/settings/map/:uuid' },
      { source: '/settings/map', destination: '/settings/map' },

      { source: '/settings/menu/add', destination: '/settings/menu/add' },
      { source: '/settings/menu/:uuid', destination: '/settings/menu/:uuid' },
      { source: '/settings/menu', destination: '/settings/menu' },

      { source: '/settings/outlet-channel/add', destination: '/settings/outlet-channel/add' },
      { source: '/settings/outlet-channel/:uuid', destination: '/settings/outlet-channel/:uuid' },
      { source: '/settings/outlet-channel', destination: '/settings/outlet-channel' },

      { source: '/settings/permission/add', destination: '/settings/permission/add' },
      { source: '/settings/permission/:uuid', destination: '/settings/permission/:uuid' },
      { source: '/settings/permission', destination: '/settings/permission' },

      { source: '/settings/processflow/add', destination: '/settings/processFlow/add' },
      { source: '/settings/processflow/:uuid', destination: '/settings/processFlow/:uuid' },
      { source: '/settings/processflow', destination: '/settings/processFlow' },

      { source: '/settings/promotiontypes/add', destination: '/settings/promotionTypes/add' },
      { source: '/settings/promotiontypes/:uuid', destination: '/settings/promotionTypes/:uuid' },
      { source: '/settings/promotiontypes', destination: '/settings/promotiontypes' },

      { source: '/settings/region/add', destination: '/settings/region/add' },
      { source: '/settings/region/:uuid', destination: '/settings/region/:uuid' },
      { source: '/settings/region', destination: '/settings/region' },

      { source: '/settings/role/add', destination: '/settings/role/add' },
      { source: '/settings/role/:uuid', destination: '/settings/role/:uuid' },
      { source: '/settings/role', destination: '/settings/role' },

      { source: '/settings/routetype/add', destination: '/settings/routetype/add' },
      { source: '/settings/routetype/:uuid', destination: '/settings/routetype/:uuid' },
      { source: '/settings/routetype', destination: '/settings/routetype' },

      { source: '/settings/submenu/add', destination: '/settings/submenu/add' },
      { source: '/settings/submenu/:uuid', destination: '/settings/submenu/:uuid' },
      { source: '/settings/submenu', destination: '/settings/submenu' },

      { source: '/settings/user/add', destination: '/settings/user/add' },
      { source: '/settings/user/:uuid', destination: '/settings/user/:uuid' },
      { source: '/settings/user', destination: '/settings/user' },


      { source: '/ticketmanagement', destination: '/ticketManagement' },
      { source: '/ticketmanagement/:uuid', destination: '/ticketManagement/:uuid' },
      { source: '/ticketmanagement', destination: '/ticketManagement' },

      { source: '/search', destination: '/search' },
      { source: '/ticketmanagement/:uuid', destination: '/ticketManagement/:uuid' },
      { source: '/ticketmanagement', destination: '/ticketManagement' },
    ];
  },
};

export default nextConfig;