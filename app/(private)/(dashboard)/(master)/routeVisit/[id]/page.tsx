"use client";

import InputFields from "@/app/components/inputFields";
import StepperForm, {
  StepperStep,
  useStepperForm,
} from "@/app/components/stepperForm";
import {
  getAgentCusByRoute,
  agentCustomerList,
  companyList,
  getRouteVisitDetails,
  regionList,
  routeList,
  saveRouteVisit,
  merchandiserData,
  getCustomerByMerchandiser,
  subRegionList,
  updateRouteVisitDetails,
  warehouseList,
  dummyImport,
  downloadFile
} from "@/app/services/allApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import Link from "@/app/components/smartLink";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import * as yup from "yup";
import Table from "./toggleTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";

// Types for API responses
type Company = {
  id: number;
  company_name?: string;
  name?: string;
};

type Region = {
  id: number;
  region_name?: string;
  name?: string;
};

type Area = {
  id: number;
  area_name?: string;
  name?: string;
};

type Warehouse = {
  id: number;
  warehouse_name?: string;
  warehouse_code?: string;
  name?: string;
};

type Route = {
  id: number;
  route_name?: string;
  name?: string;
};

type Customer = {
  id: number;
  owner_name: string;
  osa_code: string;
};

type Merchandiser = {
  id: number;
  osa_code?: string;
  name?: string;
  full_name?: string;
  label?: string;
};

type RouteVisitDetails = {
  customer_type: string;
  merchandiser_id: string;
  region: Region[];
  area: Area[];
  warehouse: Warehouse[];
  route: Route[];
  companies: Company[];
  days: string[];
  from_date: string;
  to_date: string;
  status: number;
  customer: {
    id: number;
  };
};

type ApiResponse<T> = {
  data?: T | [T];
  error?: boolean;
  message?: string;
  pagination?: {
    last_page?: number;
    current_page?: number;
    limit?: number;
  };
};

type Option = {
  value: string;
  label: string;
};

type DropdownOption = Option;

type RowStates = {
  Monday: boolean;
  Tuesday: boolean;
  Wednesday: boolean;
  Thursday: boolean;
  Friday: boolean;
  Saturday: boolean;
  Sunday: boolean;
};

type CustomerSchedules = Record<number, RowStates>;

export default function AddEditRouteVisit() {
  // Info popover state/hooks (must be top-level, not inside renderStepContent)
  const [infoPopoverOpen, setInfoPopoverOpen] = useState(false);
  const infoPopoverRef = useRef<HTMLDivElement>(null);
  const infoButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!infoPopoverOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        infoPopoverRef.current &&
        !infoPopoverRef.current.contains(e.target as Node) &&
        infoButtonRef.current &&
        !infoButtonRef.current.contains(e.target as Node)
      ) {
        setInfoPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [infoPopoverOpen]);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const params = useParams();
  const visitId = params?.id as string | undefined;
  const isEditMode = !!(visitId && visitId !== "add");

  const { setLoading } = useLoading();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [regionOptions, setRegionOptions] = useState<DropdownOption[]>([]);
  const [areaOptions, setAreaOptions] = useState<DropdownOption[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<DropdownOption[]>(
    []
  );
  const [routeOptions, setRouteOptions] = useState<DropdownOption[]>([]);
  const [companyOptions, setCompanyOptions] = useState<DropdownOption[]>([]);
  const [merchandiserOptions, setMerchandiserOptions] = useState<DropdownOption[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerPagination, setCustomerPagination] = useState({
    current_page: 1,
    last_page: 1,
    loadingMore: false,
    hasMore: false
  });
  const [customerSchedules, setCustomerSchedules] = useState<CustomerSchedules>(
    {}
  );

  const [headerUuid, setHeaderUuid] = useState<string>("");

  const [selectedCustomerType, setSelectedCustomerType] = useState<string>();

  const [skeleton, setSkeleton] = useState({
    region: false,
    route: false,
    warehouse: false,
    area: false,
    company: false,
    merchandiser: false,
  });

  const [form, setForm] = useState({
    salesman_type: "1",
    merchandiser: "",
    region: [] as string[],
    area: [] as string[],
    warehouse: [] as string[],
    route: "",
    company: [] as string[],
    days: [] as string[],
    from_date: "",
    to_date: "",
    status: "1",
  });

  // Stepper setup
  const steps: StepperStep[] = [
    { id: 1, label: "Route Details" },
    { id: 2, label: "Customer Schedule" },
  ];

  const {
    currentStep,
    nextStep,
    prevStep,
    markStepCompleted,
    isStepCompleted,
    isLastStep,
  } = useStepperForm(steps.length);

  // ✅ Validation schema for multi-selects
  const validationSchema = yup.object().shape({
    salesman_type: yup.string().required("Customer type is required"),
    region: yup.array().min(1, "At least one region is required"),
    area: yup.array().min(1, "At least one area is required"),
    warehouse: yup.array().min(1, "At least one warehouse is required"),
    route: yup.string().required("Route is required"),
    company: yup.array().min(1, "At least one company is required"),
    days: yup.array().min(1, "At least one day is required"),
    from_date: yup.string().required("From date is required"),
    to_date: yup.date()
      .required("Valid To date is required")
      .when("from_date", (from_date, schema) => {
        return from_date
          ? schema.min(from_date, "Valid To must be after Valid From")
          : schema;
      }),
    status: yup.string().required("Status is required"),
  });

  // Step-specific validation schemas
  const stepSchemas: yup.ObjectSchema<Record<string, unknown>>[] = [
    // Step 1: Route Details validation
    yup.object().shape({
      region: validationSchema.fields.region,
      area: validationSchema.fields.area,
      warehouse: validationSchema.fields.warehouse,
      route: validationSchema.fields.route,
      company: validationSchema.fields.company,
      from_date: validationSchema.fields.from_date,
      to_date: validationSchema.fields.to_date,
      status: validationSchema.fields.status,
    }) as yup.ObjectSchema<Record<string, unknown>>,
    // Step 2: Customer Schedule validation
    yup.object().shape({
      salesman_type: validationSchema.fields.salesman_type,
    }) as yup.ObjectSchema<Record<string, unknown>>,
  ];

  // Build dynamic schema for step 1 based on salesman_type
  const getStep1Schema = (salesmanType: string): yup.ObjectSchema<Record<string, unknown>> => {
    if (salesmanType === "2") {
      // Merchandiser: require merchandiser, company, region
      return yup.object().shape({
        merchandiser: yup.string().required("Merchandiser is required"),
        company: yup.array().of(yup.string()).min(1, "At least one company is required"),
        region: yup.array().of(yup.string()).min(1, "At least one region is required"),
        from_date: validationSchema.fields.from_date,
        to_date: validationSchema.fields.to_date,
        status: validationSchema.fields.status,
      }) as yup.ObjectSchema<Record<string, unknown>>;
    }

    // Agent customer (default) - require company, region, area, warehouse, route
    return yup.object().shape({
      company: yup.array().of(yup.string()).min(1, "At least one company is required"),
      region: yup.array().of(yup.string()).min(1, "At least one region is required"),
      area: yup.array().of(yup.string()).min(1, "At least one area is required"),
      warehouse: yup.array().of(yup.string()).min(1, "At least one warehouse is required"),
      route: yup.string().required("Route is required"),
      from_date: validationSchema.fields.from_date,
      to_date: validationSchema.fields.to_date,
      status: validationSchema.fields.status,
    }) as yup.ObjectSchema<Record<string, unknown>>;
  };

  // ✅ Fetch dropdowns
  const loadDropdownData = async () => {
    try {
      !isEditMode && setLoading(true);
      // Fetch companies
      setSkeleton({ ...skeleton, company: true });
      const companiesRes = await companyList({ ...(!isEditMode && { allData: "true" }), dropdown: 'true' });
      const companies = (companiesRes?.data || []) as Company[];
      setCompanyOptions(
        Array.isArray(companies)
          ? companies.map((c: Company) => ({
            value: String(c.id),
            label: c.company_name || c.name || "",
          }))
          : []
      );
      setSkeleton({ ...skeleton, company: false });
      // Fetch merchandiser list for merchandiser dropdown
      try {
        const merchRes: ApiResponse<Merchandiser[]> = await merchandiserData({ ...(!isEditMode && { allData: "true" }), });
        const merchOpts = (merchRes?.data || merchRes || []) as Merchandiser[];
        setMerchandiserOptions(
          merchOpts.map((m: Merchandiser) => ({
            value: String(m.id),
            label: `${m.osa_code ? `${m.osa_code} - ` : ""}${m.name || m.full_name || m.label || String(m.id)}`,
          })) || []
        );
      } catch (mErr) {
        console.error("Failed to load merchandiser data:", mErr);
        setMerchandiserOptions([]);
      }
      !isEditMode && setLoading(false);
    } catch {
      showSnackbar("Failed to load dropdown data", "error");
    }
  };

  // ✅ Load data for editing - UPDATED BASED ON NEW ARRAY RESPONSE FORMAT
  const loadVisitData = async (uuid: string) => {
    setLoading(true);
    try {
      const res = await getRouteVisitDetails(uuid);

      if (res?.data) {
        const d = Array.isArray(res.data) ? res.data[0] : res.data;
        setHeaderUuid(d.header?.uuid || "");

        const routeId = res.data[0].route[0]?.id;

        // Format dates from "2025-10-31T00:00:00.000000Z" to "2025-10-31"
        const formatDate = (dateString: string) => {
          if (!dateString) return "";
          return dateString.split("T")[0];
        };

        const backendStatus = d.status;
        const statusValue = backendStatus === 0 ? "0" : "1";

        // Always set as arrays of string IDs
        const toIdArray = (arr: any[] | undefined) => Array.isArray(arr) ? arr.map((x) => String(x.id)) : [];

        setForm({
          salesman_type: d.customer_type || "1",
          merchandiser: d?.merchandiser?.id ? String(d.merchandiser.id) : "",
          region: toIdArray(d.region),
          area: toIdArray(d.area),
          warehouse: toIdArray(d.warehouse),
          route: routeId ? String(routeId) : "",
          company: toIdArray(d.companies),
          days: d.days || [],
          from_date: formatDate(d.from_date),
          to_date: formatDate(d.to_date),
          status: statusValue,
        });

        setSelectedCustomerType(d.customer_type || "1");

        // Step 2: Extract all customers and their days
        const schedules: CustomerSchedules = {};
        const list = Array.isArray(res.data) ? res.data : [res.data];
        list.forEach((item: any) => {
          if (item.customer && item.customer.id) {
            const days = item.days || [];
            schedules[item.customer.id] = {
              Monday: days.includes("Monday"),
              Tuesday: days.includes("Tuesday"),
              Wednesday: days.includes("Wednesday"),
              Thursday: days.includes("Thursday"),
              Friday: days.includes("Friday"),
              Saturday: days.includes("Saturday"),
              Sunday: days.includes("Sunday"),
            };
          }
        });
        setCustomerSchedules(schedules);
      } else {
        showSnackbar("Route visit not found", "error");
      }
    } catch (error) {
      console.error("Error loading visit data:", error);
      showSnackbar("Failed to fetch route visit details", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = useCallback(async (current_page: number = 1, isAppend: boolean = false) => {
    const USE_total_DATA = false; // 👈 Set to false when done testing

    if (isAppend) {
      setCustomerPagination(prev => ({ ...prev, loadingMore: true }));
    } else {
      setLoading(true);
      setCustomers([]); // Clear existing customers on fresh fetch
    }

    try {
      let res: ApiResponse<Customer[]> | null = null;

      const salesmanType = form.salesman_type;
      const merchId = form.merchandiser;
      const route_id = form.route;

      if (salesmanType === "2") {
        if (!merchId) {
          setCustomers([]);
          setLoading(false);
          return;
        }
        const normalizedId = String(merchId).trim().replace(/\\/g, "").replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "");
        res = await getCustomerByMerchandiser(normalizedId, { page: String(current_page), limit: "50" });
      } else if (salesmanType && route_id) {
        res = await getAgentCusByRoute(String(route_id), { page: String(current_page), limit: "50" });
      }

      if (res) {
        const newData = (Array.isArray(res) ? res : (res.data || [])) as Customer[];
        const pagination = res.pagination || { last_page: 1, current_page: 1 };

        setCustomers(prev => isAppend ? [...prev, ...newData] : newData);
        setCustomerPagination({
          current_page: Number(pagination.current_page) || current_page,
          last_page: Number(pagination.last_page) || 1,
          loadingMore: false,
          hasMore: (Number(pagination.current_page) || current_page) < (Number(pagination.last_page) || 1)
        });
      }
    } catch (error: any) {
      console.error("Error fetching customers:", error);

      // Handle 404 as "No Data Found"
      if (error?.response?.status === 404) {
        if (!isAppend) {
          setCustomers([]);
          setCustomerPagination({
            current_page: 1,
            last_page: 1,
            loadingMore: false,
            hasMore: false
          });
        }
      } else {
        if (!isAppend) setCustomers([]);
      }
    } finally {
      setLoading(false);
      setCustomerPagination((prev) => ({ ...prev, loadingMore: false }));
    }
  }, [form.salesman_type, form.merchandiser, form.route, setLoading]);

  const handleLoadMoreCustomers = useCallback(() => {
    if (customerPagination.hasMore && !customerPagination.loadingMore) {
      fetchCustomers(customerPagination.current_page + 1, true);
    }
  }, [customerPagination, fetchCustomers]);

  useEffect(() => {
    // Only fetch customers if route/merchandiser is selected and we are on step 2
    if (currentStep === 2) {
      fetchCustomers(1, false);
    }
  }, [form.salesman_type, form.merchandiser, form.route, currentStep, fetchCustomers]);

  // ✅ When Company changes → Fetch Regions
  useEffect(() => {
    if (!form.company.length) {
      setRegionOptions([]);
      setForm((prev) => ({
        ...prev,
        region: [],
        area: [],
        warehouse: [],
        route: "",
      }));
      return;
    }

    const fetchRegions = async () => {
      try {
        setSkeleton((prev) => ({ ...prev, region: true }));
        const regions: ApiResponse<Region[]> = await regionList({
          company_id: form.company.join(","),
          dropdown: 'true',
          ...(!isEditMode && { allData: "true" }),
        });

        // Defensive: handle both { data: Region[] } and Region[]
        let regionListData: Region[] = [];
        if (Array.isArray(regions)) {
          regionListData = regions;
        } else if (Array.isArray(regions?.data)) {
          regionListData = regions.data as Region[];
        }

        setRegionOptions(
          regionListData.map((r: Region) => ({
            value: String(r.id),
            label: r.region_name || r.name || "",
          }))
        );
      } catch (err) {
        console.error("Failed to fetch region list:", err);
        setRegionOptions([]);
      } finally {
        setSkeleton((prev) => ({ ...prev, region: false }));
      }
    };

    fetchRegions();
  }, [form.company, isEditMode]);

  // 1️⃣ When Region changes → Fetch Areas
  useEffect(() => {
    if (!form.region.length) {
      setAreaOptions([]);
      setForm((prev) => ({ ...prev, area: [], warehouse: [], route: "" }));
      return;
    }

    const fetchAreas = async () => {
      try {
        setSkeleton((prev) => ({ ...prev, area: true }));
        const res: ApiResponse<{ data: Area[] } | Area[]> = await subRegionList({
          region_id: form.region.join(","),
          dropdown: 'true',
          ...(!isEditMode && { allData: "true" }),
        });
        const areaList = (res as { data: Area[] })?.data || (res as Area[]) || [];

        setAreaOptions(
          areaList.map((a: Area) => ({
            value: String(a.id),
            label: a.area_name || a.name || "",
          }))
        );
      } catch (err) {
        console.error("Failed to fetch area list:", err);
        setAreaOptions([]);
      } finally {
        setSkeleton((prev) => ({ ...prev, area: false }));
      }
    };

    fetchAreas();
  }, [form.region, isEditMode]);

  // 2️⃣ When Area changes → Fetch Warehouses
  useEffect(() => {
    if (!form.area.length) {
      setWarehouseOptions([]);
      setForm((prev) => ({ ...prev, warehouse: [], route: "" }));
      return;
    }

    const fetchWarehouses = async () => {
      try {
        setSkeleton((prev) => ({ ...prev, warehouse: true }));
        const res = await warehouseList({
          area_id: form.area.join(","),
          dropdown: "true",
          ...(isEditMode && { allData: "true" })
        });
        const warehousesList = (res as { data: Warehouse[] })?.data || (res as Warehouse[]) || [];

        setWarehouseOptions(
          warehousesList.map((w: Warehouse) => ({
            value: String(w.id),
            label: `${w.warehouse_code} - ${w.warehouse_name || w.name || ""}`,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch warehouse list:", err);
        setWarehouseOptions([]);
      } finally {
        setSkeleton((prev) => ({ ...prev, warehouse: false }));
      }
    };

    fetchWarehouses();
  }, [form.area, isEditMode]);

  // 3️⃣ When Warehouse changes → Fetch Routes
  useEffect(() => {
    if (!form.warehouse.length) {
      setRouteOptions([]);
      setForm((prev) => ({ ...prev, route: "" }));
      return;
    }

    const fetchRoutes = async () => {
      try {
        setSkeleton((prev) => ({ ...prev, route: true }));
        const res: ApiResponse<{ data: Route[] } | Route[]> = await routeList({
          warehouse_id: form.warehouse.join(","),
          dropdown: 'true',
          ...(!isEditMode && { allData: "true" }),
        });
        const routeListData = (res as { data: Route[] })?.data || (res as Route[]) || [];

        setRouteOptions(
          routeListData.map((r: Route) => ({
            value: String(r.id),
            label: r.route_name || r.name || "",
          }))
        );
      } catch (err) {
        console.error("Failed to fetch route list:", err);
        setRouteOptions([]);
      } finally {
        setSkeleton((prev) => ({ ...prev, route: false }));
      }
    };

    fetchRoutes();
  }, [form.warehouse, isEditMode]);
  useEffect(() => {
    loadDropdownData();
    if (isEditMode && visitId) {
      loadVisitData(visitId);
    }
  }, [isEditMode, visitId]);

  // ✅ Multi-select handler
  const handleMultiSelectChange = (field: string, value: string[]) => {
    if (field == "salesman_type") {
      setSelectedCustomerType(value[0] || "");
      setForm((prev) => ({ ...prev, [field]: value[0] || "" }));
    } else if (field === "merchandiser") {
      // Merchandiser is a single-select logically; normalize to a string id
      const raw = Array.isArray(value) ? value[0] : value;
      const normalized = raw == null ? "" : String(raw).trim().replace(/^\"|\"$/g, "");
      setForm((prev) => ({ ...prev, merchandiser: normalized }));
    } else {
      setForm((prev) => ({
        ...prev,
        [field]: value,
        // Reset dependent fields when parent changes
        ...(field === "company" && {
          region: [],
          area: [],
          warehouse: [],
          route: "",
        }),
        ...(field === "region" && { area: [], warehouse: [], route: "" }),
        ...(field === "area" && { warehouse: [], route: "" }),
        ...(field === "warehouse" && { route: "" }),
      }));
    }
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ✅ Step navigation
  const handleNext = async () => {
    try {
      let schema: yup.ObjectSchema<Record<string, unknown>> | undefined;
      if (currentStep === 1) {
        schema = getStep1Schema(form.salesman_type);
      } else if (currentStep === 2) {
        schema = yup.object().shape({ salesman_type: validationSchema.fields.salesman_type });
      }

      if (schema) {
        await schema.validate(form, { abortEarly: false });
      }
      markStepCompleted(currentStep);
      nextStep();
      setErrors({});
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) formErrors[e.path] = e.message;
        });
        setErrors(formErrors);
      }
    }
  };

  // ✅ Convert rowStates object to array format
  const convertRowStatesToSchedules = (rowStates: CustomerSchedules) => {
    return Object.entries(rowStates)
      .map(([customerId, daysObj]) => {
        const days = Object.entries(daysObj)
          .filter(([_, isSelected]) => isSelected)
          .map(([day]) => day);
        return {
          customer_id: Number(customerId),
          days,
        };
      })
      .filter((schedule) => schedule.days.length > 0);
  };

  // ✅ Handle submit
  const handleSubmit = async () => {
    try {
     


      // ✅ Convert your raw object to expected format - customerSchedules is already in Record format
      const formattedSchedules = convertRowStatesToSchedules(customerSchedules);


      // Validate if at least one customer has days
      if (formattedSchedules.length === 0) {
        showSnackbar("Please select days for at least one customer", "error");
        return;
      }

      setErrors({});
      setSubmitting(true);

      const payload: Record<string, unknown> = {
        customer_type: Number(form.salesman_type),
        customers: formattedSchedules.map((schedule) => ({
          customer_id: Number(schedule.customer_id),
          company_id: form.company.join(","),
          region: form.region.join(","),
          area: form.area.join(","),
          warehouse: form.warehouse.join(","),
          route: [form.route],
          days: schedule.days.join(","),
          from_date: form.from_date,
          to_date: form.to_date,
          status: Number(form.status),
        })),
      };

      // If salesman type is Merchandiser, include selected merchandiser id in payload
      if (form.salesman_type === "2" && form.merchandiser) {
        const merchId = String(form.merchandiser).trim().replace(/^"+|"+$/g, "");
        payload.merchandiser_id = Number(merchId);
      }


      let res: ApiResponse<Record<string, unknown>>;
      if (isEditMode && headerUuid) {
        res = await updateRouteVisitDetails(headerUuid, payload);
      } else {
        res = await saveRouteVisit(payload);
      }

      if (res?.error) {
        console.error("API Error:", res.error);
        let errorMsg = "Failed to save route visit";
        if (res?.data && typeof res.data === "object" && "message" in res.data && typeof res.data.message === "string") {
          errorMsg = res.data.message;
        }
        showSnackbar(errorMsg, "error");
      } else {
        showSnackbar(
          isEditMode
            ? "Route visit updated successfully"
            : "Route visit created successfully",
          "success"
        );
        router.push("/routeVisit");
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);

      if (err instanceof yup.ValidationError) {
        const formErrors: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) formErrors[e.path] = e.message;
        });
        setErrors(formErrors);
        showSnackbar("Please fix the form errors", "error");
      } else {
        showSnackbar("Failed to submit form", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        function setFieldValue(field: string, value: any): void {
          setForm((prev) => ({
            ...prev,
            [field]: value,
            // Reset dependent fields when parent changes
            ...(field === "company" && {
              region: [],
              area: [],
              warehouse: [],
              route: "",
            }),
            ...(field === "region" && { area: [], warehouse: [], route: "" }),
            ...(field === "area" && { warehouse: [], route: "" }),
            ...(field === "warehouse" && { route: "" }),
          }));
          if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
        }
        return (
          <div className="bg-white rounded-2xl shadow divide-y divide-gray-200 mb-6">
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <InputFields
                  required
                  label="From Date"
                  type="date"
                  value={form.from_date ? form.from_date.split("T")[0] : ""}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, from_date: e.target.value }));
                    if (errors.from_date) setErrors((prev) => ({ ...prev, from_date: "" }));
                  }}
                  error={errors.from_date}
                />
              </div>

              <div>
                <InputFields
                  required
                  label="To Date"
                  type="date"
                  value={form.to_date ? form.to_date.split("T")[0] : ""}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, to_date: e.target.value }));
                    if (errors.to_date) setErrors((prev) => ({ ...prev, to_date: "" }));
                  }}
                  min={form.from_date}
                  error={errors.to_date}
                />
              </div>
              {/* {!isEditMode && ( */}
              {/* Salesman Type */}
              <div>
                <InputFields
                  required
                  disabled={isEditMode}
                  label="Customer Type"
                  value={form.salesman_type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      salesman_type: e.target.value,
                    }))
                  }
                  options={[
                    { value: "1", label: "Field Customer" },
                    { value: "2", label: "Merchandiser" },
                  ]}
                  error={errors.salesman_type}
                />
              </div>

              {/* Merchandiser select shown when Salesman Type = Merchandiser */}
              {form.salesman_type === "2" && (
                <div>
                  <InputFields
                    required
                    label="Merchandiser"
                    value={form.merchandiser}
                    // InputFields is single-select here; normalize value to string
                    onChange={(e) => {
                      const raw = (e as any).target?.value;
                      const val = Array.isArray(raw) ? raw[0] : raw;
                      const normalized = val == null ? "" : String(val).trim().replace(/^"+|"+$/g, "");
                      setForm((prev) => ({ ...prev, merchandiser: normalized }));
                    }}
                    showSkeleton={skeleton.merchandiser}
                    options={merchandiserOptions}
                    isSingle={true}
                    error={errors.merchandiser}
                  />

                </div>
              )}
              {/* )} */}
              {/* Company - Multi Select */}
              <div>
                <InputFields
                  required
                  label="Company"
                  searchable
                  value={form.company}
                  multiSelectChips={true}
                  onChange={(e) =>
                    handleMultiSelectChange(
                      "company",
                      Array.isArray(e.target.value) ? e.target.value : []
                    )
                  }
                  showSkeleton={skeleton.company}
                  options={companyOptions}
                  isSingle={false}
                  error={errors.company}
                />
              </div>

              {/* Region - Multi Select */}
              <div>
                <InputFields
                  required
                  searchable
                  disabled={form.company.length === 0}
                  label="Region"
                  value={form.region}
                  multiSelectChips={true}
                  onChange={(e) =>
                    handleMultiSelectChange(
                      "region",
                      Array.isArray(e.target.value) ? e.target.value : []
                    )
                  }
                  options={regionOptions}
                  showSkeleton={skeleton.region}
                  isSingle={false}
                  error={errors.region}
                />
              </div>

              {/* Area - Multi Select */}
              {form.salesman_type !== "2" && (
                <div>
                  <InputFields
                    required
                    searchable
                    disabled={form.region.length === 0}
                    label="Area"
                    multiSelectChips={true}
                    value={form.area}
                    onChange={(e) =>
                      handleMultiSelectChange(
                        "area",
                        Array.isArray(e.target.value) ? e.target.value : []
                      )
                    }
                    showSkeleton={skeleton.area}
                    options={areaOptions}
                    isSingle={false}
                    error={errors.area}
                  />
                </div>
              )}

              {/* Warehouse - Multi Select */}
              {form.salesman_type !== "2" && (
                <div>
                  <InputFields
                    required
                    searchable
                    disabled={form.area.length === 0 || areaOptions.length === 0}
                    label="Distributors"
                    multiSelectChips={true}
                    value={form.warehouse}
                    onChange={(e) =>
                      handleMultiSelectChange(
                        "warehouse",
                        Array.isArray(e.target.value) ? e.target.value : []
                      )
                    }
                    showSkeleton={skeleton.warehouse}
                    options={warehouseOptions}
                    isSingle={false}
                    error={errors.warehouse}
                  />
                </div>
              )}

              {/* Route - Multi Select */}
              {form.salesman_type !== "2" && (
                <div>
                  <InputFields
                    required
                    searchable
                    placeholder="Select Route"
                    disabled={form.warehouse.length === 0}
                    label="Route"
                    value={form.route}
                    onChange={(e) =>
                      setFieldValue("route", e.target.value)
                    }
                    showSkeleton={skeleton.route}
                    options={routeOptions}
                    error={errors.route}
                  />
                </div>
              )}

              {/* Status */}
              <div>
                <InputFields
                  required
                  label="Status"
                  type="radio"
                  value={form.status || "1"}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  options={[
                    { value: "1", label: "Active" },
                    { value: "0", label: "Inactive" },
                  ]}
                  error={errors.status}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="bg-white rounded-2xl shadow divide-y divide-gray-200 mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Customer Schedule
                </h3>

              </div>
              <Table
                customers={customers}
                setCustomerSchedules={setCustomerSchedules}
                initialSchedules={Object.entries(customerSchedules).map(
                  ([customerId, daysObj]) => ({
                    customer_id: Number(customerId),
                    days: Object.entries(daysObj)
                      .filter(([_, isSelected]) => isSelected)
                      .map(([day]) => day),
                  })
                )}
                editMode={isEditMode}
                visitUuid={visitId} // Pass the visit ID when in edit mode
                hasMore={customerPagination.hasMore}
                onLoadMore={handleLoadMoreCustomers}
                isLoadingMore={customerPagination.loadingMore}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/routeVisit" back>
            <Icon icon="lucide:arrow-left" width={24} />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode ? "Update Route Visit Plan" : "Add Route Visit Plan"}
          </h1>
        </div>
      </div>

      {/* Stepper Form */}
      <StepperForm
        steps={steps.map((step) => ({
          ...step,
          isCompleted: isStepCompleted(step.id),
        }))}
        currentStep={currentStep}
        onBack={prevStep}
        onNext={handleNext}
        onSubmit={handleSubmit}
        showSubmitButton={isLastStep}
        showNextButton={!isLastStep}
        nextButtonText="Save & Next"
        submitButtonText={submitting
              ? isEditMode
                ? "Updating..."
                : "Submitting..."
              : isEditMode
                ? "Update"
                : "Submit"}
      >
        {renderStepContent()}
      </StepperForm>
    </div>
  );
}