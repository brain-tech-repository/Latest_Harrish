"use client";

import ContainerCard from "@/app/components/containerCard";
import AutoSuggestion, { Option } from "@/app/components/autoSuggestion";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import { listReturnType } from "@/app/components/customTable";
import InputFields from "@/app/components/inputFields";
import StepperForm, { StepperStep, useStepperForm } from "@/app/components/stepperForm";
import { genearateCode, saveFinalCode } from "@/app/services/allApi";
import { addCallRegister, callRegisterByUUID, updateCallRegister, getTechicianList, serialNumberData, getCurrentCustomer } from "@/app/services/assetsApi";
import { useLoading } from "@/app/services/loadingContext";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import { useParams, useRouter } from "next/navigation";
import { JSX, useCallback, useEffect, useState } from "react";
import * as Yup from "yup";
import { chillerList } from "@/app/services/assetsApi";
import {
    ErrorMessage,
    Form,
    Formik,
    FormikErrors,
    FormikHelpers,
    FormikTouched,
} from "formik";
import Link from "@/app/components/smartLink";
const validationSchema = Yup.object({
    ticket_type: Yup.string().required("Ticket Type is required"),
    ticket_date: Yup.string().required("Ticket Date is required"),
    chiller_serial_number: Yup.string().required("Chiller Serial Number is required"),
    assets_category: Yup.string().required("Assets Category is required"),
    model_number: Yup.string().required("Model Number is required"),
    branding: Yup.string().required("Branding is required"),
    current_outlet_name: Yup.string().required("Current Outlet Name is required"),
    current_owner_name: Yup.string().required("Current Owner Name is required"),
    current_warehouse: Yup.string().required("Current Warehouse is required"),
    current_asm: Yup.string().required("Current ASM is required"),
    current_rm: Yup.string().required("Current RM is required"),
    current_road_street: Yup.string().required("Current Road Street is required"),
    current_landmark: Yup.string().required("Current Landmark is required"),
    current_town: Yup.string().required("Current Town is required"),
    current_district: Yup.string().required("Current District is required"),
    current_contact_no1: Yup.string().required("Current Contact No1 is required"),
    technician_id: Yup.string().required("Technician ID is required"),
    ctc_status: Yup.string().required("CTC Status is required"),
    status: Yup.string().required("Status is required"),
    sales_valume: Yup.string().required("Sales Valume is required"),
    followup_status: Yup.string().required("Followup Status is required"),
    nature_of_call: Yup.string().required("Nature of Call is required"),
    follow_up_action: Yup.string().required("Follow Up Action is required"),
});

const stepSchemas = [

    Yup.object().shape({
        ticket_type: Yup.string().required("Ticket Type is required"),
        ticket_date: Yup.string().required("Ticket Date is required"),
        chiller_serial_number: Yup.string().required("Chiller Serial Number is required"),
        assets_category: Yup.string().required("Assets Category is required"),
        model_number: Yup.string().required("Model Number is required"),
        branding: Yup.string().required("Branding is required"),
    }),

    Yup.object().shape({}),

    Yup.object().shape({
        current_outlet_name: Yup.string().required("Current Outlet Name is required"),
        current_owner_name: Yup.string().required("Current Owner Name is required"),
        current_warehouse: Yup.string().required("Current Warehouse is required"),
        current_asm: Yup.string().required("Current ASM is required"),
        current_rm: Yup.string().required("Current RM is required"),
        current_road_street: Yup.string().required("Current Road Street is required"),
        current_landmark: Yup.string().required("Current Landmark is required"),
        current_town: Yup.string().required("Current Town is required"),
        current_district: Yup.string().required("Current District is required"),
        current_contact_no1: Yup.string().required("Current Contact No1 is required"),
        technician_id: Yup.string().required("Technician ID is required"),
        ctc_status: Yup.string().required("CTC Status is required"),
        status: Yup.string().required("Status is required"),
        sales_valume: Yup.string().required("Sales Valume is required"),
        followup_status: Yup.string().required("Followup Status is required"),
        nature_of_call: Yup.string().required("Nature of Call is required"),
        follow_up_action: Yup.string().required("Follow Up Action is required"),
    })
]

interface CallRegister {
    ticket_type: string;
    osa_code: string;
    ticket_date: string;
    chiller_serial_number: string;
    assets_category: string;
    model_number: string;
    branding: string;
    outlet_name: string;
    owner_name: string;
    street: string;
    landmark: string;
    town: string;
    district: string;
    contact_no1: string;
    contact_no2: string;
    current_outlet_name: string;
    current_owner_name: string;
    current_warehouse: string;
    current_asm: string;
    current_rm: string;
    current_road_street: string;
    current_landmark: string;
    current_town: string;
    current_district: string;
    current_contact_no1: string;
    current_contact_no2: string;
    technician_id: string;
    ctc_status: string;
    status: string;
    sales_valume: string;
    followup_status: string;
    nature_of_call: string;
    follow_up_action: string;
}


export default function AddOrEditChiller() {
    const [technicianOptions, setTechnicianOptions] = useState<{ value: string; label: string }[]>([]);
    const [codeMode] = useState<"auto" | "manual">("auto");
    const [assignCusId, setAssignCusId] = useState("");
    const [assetNoId, setAssetNoId] = useState("");
    const [modelNoId, setModelNoId] = useState("");
    const [brandId, setBrandId] = useState("");
    const [distributorid, setDistributorId] = useState("");
    const [asmId, setAsmId] = useState("");
    const [rsmId, setRsmId] = useState("");
    const [editData,setEditData] = useState<any>();
    const [skeleton, setSkeleton] = useState(false);
    const {
        agentCustomerOptions,

        brandingOptions,
        ensureBrandingLoaded,

        ensureAgentCustomerLoaded,
    } = useAllDropdownListData();

    const steps: StepperStep[] = [
        { id: 1, label: "Basic Information" },
        { id: 2, label: "Assign Customer Details" },
        { id: 3, label: "Current Customer Details" },
    ];

    const { currentStep, nextStep, prevStep, markStepCompleted, isStepCompleted, isLastStep } =
        useStepperForm(steps.length);

    const { showSnackbar } = useSnackbar();
    const router = useRouter();
    const params = useParams();
    const { setLoading } = useLoading();

    const isEditMode = params?.uuid && params?.uuid !== "add";
    const chillerId = isEditMode ? String(params?.uuid) : null;

    const [chiller, setChiller] = useState({
        ticket_type: "",
        osa_code: "",
        ticket_date: "",
        chiller_serial_number: "",
        assets_category: "",
        model_number: "",
        chiller_code: "",
        branding: "",
        outlet_code: "",
        outlet_name: "",
        owner_name: "",
        street: "",
        landmark: "",
        town: "",
        district: "",
        contact_no1: "",
        contact_no2: "",
        current_outlet_code: "",
        current_outlet_name: "",
        current_owner_name: "",
        current_warehouse: "",
        current_asm: "",
        current_rm: "",
        current_road_street: "",
        current_landmark: "",
        current_town: "",
        current_district: "",
        current_contact_no1: "",
        current_contact_no2: "",
        technician_id: "",
        ctc_status: "",
        status: "1",
        sales_valume: "",
        followup_status: "",
        nature_of_call: "",
        follow_up_action: "",
    });


    useEffect(() => {

        ensureAgentCustomerLoaded();
        ensureBrandingLoaded();
    }, [ensureAgentCustomerLoaded, ensureBrandingLoaded]);

    useEffect(() => {
        (async () => {
            try {
                const response = await getTechicianList();
                const techData = Array.isArray(response?.data)
                    ? response.data
                    : (response?.data?.data || []);

                const options = techData.map((item: { id: string | number; osa_code: string; name: string }) => ({
                    value: String(item.id),
                    label: `${item.osa_code} - ${item.name}`,
                }));

                setTechnicianOptions(options);
            } catch (error) {
                showSnackbar("Failed to fetch technician data", "error");
            }
        })();
    }, []);

    /* ----------------------------------------------------
       FETCH + PREFILL + AUTO CODE GENERATION
    ---------------------------------------------------- */
    useEffect(() => {
        async function fetchData() {
            if (isEditMode && chillerId) {
                // ---------- EDIT MODE ----------
                setLoading(true);
                const res = await callRegisterByUUID(chillerId);
                setLoading(false);

                if (res.error) {
                    showSnackbar(res.data?.message || "Failed to fetch details", "error");
                    return;
                }

                const d = res.data;
                setEditData(d);
                setChiller({
                    ticket_type: d.ticket_type || "",
                    osa_code: d.osa_code || "",
                    ticket_date: d.ticket_date || "",
                    chiller_serial_number: d.chiller_serial_number || "",
                    assets_category: d.asset_number || "",
                    model_number: `${d.model_number?.code || ""} - ${d.model_number?.name || ""}`,
                    chiller_code: d.chiller_code || "",
                    branding: `${String(d.branding?.id || "")}`,
                    outlet_code: d.assigned_customer.code || "",
                    outlet_name: `${d.assigned_customer?.code || ""} - ${d.assigned_customer?.name || ""}`,
                    owner_name: d.assigned_customer?.owner_name || "",
                    street: d.assigned_customer?.street || "",
                    landmark: d.assigned_customer?.landmark || "",
                    town: d.assigned_customer?.town || "",
                    district: d.assigned_customer?.district || "",
                    contact_no1: d.assigned_customer?.contact_no_1 || "",
                    contact_no2: d.assigned_customer?.contact_no_2 || "",
                    current_outlet_code: d.current_outlet_code || "",
                    current_outlet_name: String(d.current_customer?.id )|| "",
                    current_owner_name: d.current_owner_name || "",
                    current_warehouse: `${d.current_warehouse_code || ""} - ${d.current_warehouse_name || ""}`,
                    current_asm: `${d.current_asm?.name || ""}`,
                    current_rm: `${d.current_rm?.name || ""}`,
                    current_road_street: d.current_road_street || "",
                    current_landmark: d.current_landmark || "",
                    current_town: d.current_town || "",
                    current_district: d.current_district || "",
                    current_contact_no1: d.current_contact_no1 || "",
                    current_contact_no2: d.current_contact_no2 || "",
                    technician_id: String(d.technician_id || ""),
                    ctc_status: (d.ctc_status === "Same Outlet" ? "1" : "0"),
                    status: String(d.status ?? "1"),
                    sales_valume: d.sales_valume || "",
                    followup_status: d.followup_status || "",
                    nature_of_call: d.nature_of_call || "",
                    follow_up_action: d.follow_up_action || "",
                });
            }
        }

        fetchData();
    }, [isEditMode, chillerId]);

    // Define stepFields to match each step's fields for validation
    const stepFields = [
        // Step 1: Basic Information
        [
            "ticket_type", "osa_code", "ticket_date", "chiller_serial_number", "assets_category", "model_number", "brand"
        ],
        // Step 2: Assign Customer Details
        [
            "outlet_name", "owner_name", "street", "landmark", "town", "district", "contact_no1", "contact_no2"
        ],
        // Step 3: Current Customer Details
        [
            "current_outlet_name", "current_owner_name", "current_warehouse", "current_asm", "current_rm", "current_road_street", "current_landmark", "current_town", "current_district", "current_contact_no1", "current_contact_no2", "technician_id", "ctc_status", "status", "sales_valume", "followup_status", "nature_of_call", "follow_up_action"
        ]
    ];


    const fetchSerialNumber = async (
        serial: string,
        setFieldValue: FormikHelpers<CallRegister>["setFieldValue"]
    ) => {
        try {
            setSkeleton(true);
            const res = await serialNumberData({ serial_number: serial });

            const d = res?.data;
            if (!d) {
                showSnackbar("No data found for this serial number", "warning");
                return;
            }

            // ✅ DO NOT touch chiller_serial_number here

            // ✅ Store IDs in state
            setAssignCusId(res?.data?.customer?.id ?? "");
            if (d.assets_category?.id) setAssetNoId(String(d.assets_category.id));
            if (d.model_number?.id) setModelNoId(String(d.model_number.id));
            if (d.brand?.id) setBrandId(String(d.brand.id));

            // ✅ Select fields → store IDs
            setFieldValue("branding", String(d.brand?.id || ""));

            // ✅ Text fields
            setFieldValue(
                "assets_category",
                `${d.assets_category?.osa_code || ""} - ${d.assets_category?.name || ""}`
            );
            setFieldValue(
                "model_number",
                `${d.model_number?.code || ""} - ${d.model_number?.name || ""}`
            );

            if (d.customer) {
                setFieldValue(
                    "outlet_name",
                    `${d.customer?.osa_code} - ${d.customer?.name}`
                );
                setFieldValue("owner_name", d.customer?.owner_name || "");
                setFieldValue("street", d.customer?.street || "");
                setFieldValue("landmark", d.customer?.landmark || "");
                setFieldValue("town", d.customer?.town || "");
                setFieldValue("district", d.customer?.district || "");
                setFieldValue("contact_no1", d.customer?.contact_no || "");
                setFieldValue("contact_no2", d.customer?.contact_no2 || "");
            }

        } catch {
            showSnackbar("Failed to fetch serial number details", "error");
        } finally {
            setSkeleton(false);
        }
    };


    const fetchCurrentCustomer = async (
        search: string,
        setFieldValue: FormikHelpers<CallRegister>["setFieldValue"]
    ) => {
        // Set Asset Number (chiller_serial_number) input field

        try {
            setSkeleton(true);
            const res = await getCurrentCustomer({ search: search });
            setDistributorId(res?.data?.get_warehouse?.id);
            setAsmId(res?.data?.get_warehouse?.area?.created_by?.id);
            setRsmId(res?.data?.get_warehouse?.region?.created_by?.id);
            const d = res


            setFieldValue("current_owner_name", d.data.owner_name);
            setFieldValue("current_warehouse", `${d.data.get_warehouse?.warehouse_code || ""} - ${d.data.get_warehouse?.warehouse_name || ""}`);
            setFieldValue("current_asm", d.data?.get_warehouse?.area.created_by.username || "");
            setFieldValue("current_rm", d.data?.get_warehouse?.region.created_by.username || "");
            setFieldValue("current_road_street", d.data?.street || "");
            setFieldValue("current_landmark", d.data?.landmark || "");
            setFieldValue("current_town", d.data?.town || "");
            setFieldValue("current_district", d.data?.district || "");
            setFieldValue("current_contact_no1", d.data?.contact_no || "");
            setFieldValue("current_contact_no2", d.data?.contact_no2 || "");
            setSkeleton(false);

        } catch (err) {
            console.error(err);
            showSnackbar("Failed to fetch serial number details", "error");
        }
    };

    const handleNext = async (
        values: CallRegister,
        actions: FormikHelpers<CallRegister>
    ) => {
        try {
            // Only validate if schema exists for the current step
            const schema = stepSchemas[currentStep - 1];
            if (schema) {
                await schema.validate(values, { abortEarly: false });
            }
            markStepCompleted(currentStep);
            nextStep();
        } catch (err: unknown) {
            if (err instanceof Yup.ValidationError) {
                const errors: FormikErrors<CallRegister> = {};
                const touched: FormikTouched<CallRegister> = {};
                // Only include fields for the current step
                const fields = stepFields[currentStep - 1];
                err.inner.forEach((error) => {
                    if (
                        error.path &&
                        Array.isArray(fields) &&
                        fields.includes(error.path)
                    ) {
                        errors[error.path as keyof CallRegister] = error.message;
                        touched[error.path as keyof CallRegister] = true;
                    }
                });
                actions.setErrors(errors);
                actions.setTouched(touched);
            }
            showSnackbar("Please fix validation errors before proceeding", "error");
        }
    };

    /* ----------------------------------------------------
         FINAL SUBMIT
      ---------------------------------------------------- */
    const handleSubmit = async (values: any) => {

        const payload1 = {
            ticket_type: values.ticket_type,
            osa_code: values.osa_code,
            ticket_date: values.ticket_date,
            chiller_serial_number: values.chiller_serial_number,
            assets_category: String(editData?.asset_number),
            model_number: Number(editData?.model_number?.id),
            branding: Number(values.branding),
            assigned_customer_id: editData?.assigned_customer?.id ? Number(editData.assigned_customer.id) : "",

            outlet_code: values.outlet_code,
            outlet_name: values.outlet_name,
            owner_name: values.owner_name,
            road_street: values.street, // FIXED
            landmark: values.landmark,
            town: values.town,
            district: values.district,
            contact_no1: values.contact_no1,
            contact_no2: values.contact_no2,

            current_outlet_code: values.current_outlet_code,
            current_outlet_name: Number(values.current_outlet_name),
            current_owner_name: values.current_owner_name,
            current_warehouse: Number(editData?.current_warehouse_id),
            current_asm: Number(asmId),
            current_rm: Number(rsmId),
            current_road_street: values.current_road_street,
            current_landmark: values.current_landmark,
            current_town: values.current_town,
            current_district: values.current_district,
            current_contact_no1: values.current_contact_no1,
            current_contact_no2: values.current_contact_no2,

            technician_id: Number(values.technician_id),
            ctc_status: Number(values.ctc_status),
            status: values.status,
            sales_valume: Number(values.sales_valume),
            followup_status: values.followup_status,

            nature_of_call: values.nature_of_call,
            follow_up_action: values.follow_up_action,
        };

        const payload = {
            ticket_type: values.ticket_type,
            osa_code: values.osa_code,
            ticket_date: values.ticket_date,
            chiller_serial_number: values.chiller_serial_number,
            assets_category: Number(assetNoId),
            model_number: Number(modelNoId),
            branding: Number(values.branding),
            assigned_customer_id: assignCusId ? Number(assignCusId) : "",

            outlet_code: values.outlet_code,
            outlet_name: values.outlet_name,
            owner_name: values.owner_name,
            road_street: values.street, // FIXED
            landmark: values.landmark,
            town: values.town,
            district: values.district,
            contact_no1: values.contact_no1,
            contact_no2: values.contact_no2,

            current_outlet_code: values.current_outlet_code,
            current_outlet_name: Number(values.current_outlet_name),
            current_owner_name: values.current_owner_name,
            current_warehouse: Number(distributorid),
            current_asm: Number(asmId),
            current_rm: Number(rsmId),
            current_road_street: values.current_road_street,
            current_landmark: values.current_landmark,
            current_town: values.current_town,
            current_district: values.current_district,
            current_contact_no1: values.current_contact_no1,
            current_contact_no2: values.current_contact_no2,

            technician_id: Number(values.technician_id),
            ctc_status: Number(values.ctc_status),
            status: values.status,
            sales_valume: Number(values.sales_valume),
            followup_status: values.followup_status,

            nature_of_call: values.nature_of_call,
            follow_up_action: values.follow_up_action,
        };


        let res;
        if (isEditMode) res = await updateCallRegister(chillerId!, payload1 as any);
        else res = await addCallRegister(payload as any);

        if (res.error) {
            showSnackbar(res.data?.message || "Failed to save", "error");
        } else {
            // After successful add, call saveFinalCode like vehicle add page
            if (!isEditMode) {
                try {
                    await saveFinalCode({
                        reserved_code: values.osa_code,
                        model_name: chiller.ticket_type,
                    });
                } catch (e) {
                    // optional: handle error or ignore
                }
            }
            showSnackbar(`Chiller ${isEditMode ? "updated" : "added"} successfully`, "success");
            router.push("/callRegister");
        }
    };

    /* ----------------------------------------------------
       RENDER STEP CONTENT
    ---------------------------------------------------- */
    const renderStepContent = (
        values: CallRegister,
        setFieldValue: FormikHelpers<CallRegister>["setFieldValue"],
        errors: FormikErrors<CallRegister>,
        touched: FormikTouched<CallRegister>
    ): JSX.Element | null => {
        switch (currentStep) {
            case 1:
                return (
                    <ContainerCard>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputFields
                                required
                                label="Ticket Type"
                                name="ticket_type"
                                options={[
                                    { value: "RB", label: "RB" },
                                    { value: "BD", label: "BD" },
                                    { value: "TR", label: "TR" }
                                ]}
                                value={values.ticket_type}
                                onChange={async (e) => {
                                    const type = e.target.value;
                                    setFieldValue("ticket_type", type);
                                    setChiller((prev) => ({ ...prev, ticket_type: type }));

                                    // Generate code for new additions only
                                    if (!isEditMode && type) {
                                        const res = await genearateCode({ model_name: type });
                                        const generatedCode = res?.code || "";
                                        setFieldValue("osa_code", generatedCode);
                                        setChiller((prev) => ({ ...prev, osa_code: generatedCode }));
                                    }
                                }}
                                error={touched.ticket_type && errors.ticket_type}
                            />
                            <InputFields
                                label="Ticket Number"
                                name="osa_code"
                                showSkeleton={!!values.ticket_type && !values.osa_code}
                                value={values.osa_code}
                                disabled={codeMode === "auto"}
                                onChange={(e) => setFieldValue("osa_code", e.target.value)}
                            />

                            <InputFields
                                required
                                label="Ticket Date"
                                type="date"
                                name="ticket_date"
                                value={values.ticket_date}
                                min={new Date().toISOString().split("T")[0]}
                                max={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setFieldValue("ticket_date", e.target.value)}
                                error={touched.ticket_date && errors.ticket_date}
                            />

                            <AutoSuggestion
                                placeholder="Search Chiller Serial Number"
                                onSearch={async (query) => {
                                    // Use chillerList API to fetch options
                                    const res = await chillerList({ serial_number: query, dropdown: 'true' });
                                    // Map API response (array of strings) to Option[]
                                    if (Array.isArray(res?.data)) {
                                        return res.data.map((serial: string) => ({
                                            value: serial,
                                            label: serial
                                        }));
                                    }
                                    return [];
                                }}
                                onSelect={(option) => {
                                    setFieldValue("chiller_serial_number", option.value);
                                    if (option.value) {
                                        fetchSerialNumber(option.value, setFieldValue);
                                    }
                                }}
                                minSearchLength={0}
                                debounceMs={300}
                                selectedOption={values.chiller_serial_number ? { value: values.chiller_serial_number, label: values.chiller_serial_number } : null}
                                disabled={false}
                                label="Chiller Serial Number"
                                required={true}
                                error={touched.chiller_serial_number && errors.chiller_serial_number}
                                name="chiller_serial_number"
                                id="chiller_serial_number"
                            />





                            {/* <InputFields
                                // required
                                label="Chiller Code"
                                name="chiller_code"
                                value={values.chiller_code}
                                onChange={(e) => setFieldValue("chiller_code", e.target.value)}
                            // error={touched.sap_code && errors.sap_code}
                            /> */}

                            <InputFields
                                required
                                disabled
                                label="Asset Number"
                                name="assets_category"
                                value={values.assets_category}
                                showSkeleton={skeleton}
                                // options={assetsTypeOptions}
                                onChange={(e) => setFieldValue("assets_category", e.target.value)}
                                error={touched.assets_category && errors.assets_category}
                            />

                            <InputFields
                                required
                                disabled
                                label="Model Number"
                                showSkeleton={skeleton}
                                name="model_number"
                                value={values.model_number}
                                // options={assetsModelOptions}
                                onChange={(e) => setFieldValue("model_number", e.target.value)}
                                error={touched.model_number && errors.model_number}
                            />

                            <InputFields
                                required
                                disabled
                                showSkeleton={skeleton}
                                label="Branding"
                                name="branding"
                                value={values.branding}
                                options={brandingOptions}
                                onChange={(e) => setFieldValue("branding", e.target.value)}
                                error={touched.branding && errors.branding}
                            />
                        </div>
                    </ContainerCard>
                );

            case 2:
                return (
                    <ContainerCard>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            <InputFields
                                searchable
                                disabled
                                label="outlet Name"
                                name="outlet_name"
                                value={values.outlet_name}
                                // options={agentCustomerOptions}
                                onChange={(e) => setFieldValue("outlet_name", e.target.value)}
                                error={touched.outlet_name && errors.outlet_name}
                            />

                            <InputFields
                                disabled
                                label="Owner Name"
                                name="owner_name"
                                value={values.owner_name}
                                onChange={(e) => setFieldValue("owner_name", e.target.value)}
                                error={touched.owner_name && errors.owner_name}
                            />

                            <InputFields
                                disabled
                                label="Road/Street"
                                name="road_street"
                                value={values.street}
                                onChange={(e) => setFieldValue("street", e.target.value)}
                                error={touched.street && errors.street}
                            />

                            <InputFields
                                disabled
                                label="Landmark"
                                name="landmark"
                                value={values.landmark}
                                onChange={(e) => setFieldValue("landmark", e.target.value)}
                                error={touched.landmark && errors.landmark}
                            />

                            <InputFields
                                disabled
                                label="Village/Town"
                                name="town"
                                value={values.town}
                                onChange={(e) => setFieldValue("town", e.target.value)}
                                error={touched.town && errors.town}
                            />

                            <InputFields
                                disabled
                                label="District"
                                name="district"
                                value={values.district}
                                onChange={(e) => setFieldValue("district", e.target.value)}
                                error={touched.district && errors.district}
                            />

                            <InputFields
                                disabled
                                label="Contact No1"
                                name="contact_no1"
                                value={values.contact_no1}
                                onChange={(e) => setFieldValue("contact_no1", e.target.value)}
                                error={touched.contact_no1 && errors.contact_no1}
                            />

                            <InputFields
                                disabled
                                label="Contact No2"
                                name="contact_no2"
                                value={values.contact_no2}
                                onChange={(e) => setFieldValue("contact_no2", e.target.value)}
                                error={touched.contact_no2 && errors.contact_no2}
                            />
                        </div>
                    </ContainerCard>
                );
            case 3:
                return (
                    <ContainerCard>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


                            <InputFields
                                required
                                searchable
                                label="Outlet Name"
                                name="current_outlet_name"
                                value={values.current_outlet_name}
                                options={agentCustomerOptions}
                                onChange={(e) => {
                                    setFieldValue("current_outlet_name", e.target.value)
                                    const selectedOption = agentCustomerOptions.find(opt => opt.value === e.target.value);
                                    const valueToSend = selectedOption?.value1 || selectedOption?.label;
                                    if (valueToSend) {
                                        fetchCurrentCustomer(valueToSend, setFieldValue);
                                    }
                                }
                                }
                                error={touched.current_outlet_name && errors.current_outlet_name}
                            />

                            <InputFields
                                required
                                label="Owner Name"
                                showSkeleton={skeleton}
                                name="current_owner_name"
                                value={values.current_owner_name}
                                onChange={(e) => setFieldValue("current_owner_name", e.target.value)}
                                error={touched.current_owner_name && errors.current_owner_name}
                            />

                            <InputFields
                                required
                                disabled
                                showSkeleton={skeleton}
                                searchable
                                label="Distributors"
                                name="current_warehouse"
                                value={values.current_warehouse}
                                onChange={(e) => setFieldValue("current_warehouse", e.target.value)}
                                error={touched.current_warehouse && errors.current_warehouse}
                            />

                            <InputFields
                                required
                                showSkeleton={skeleton}
                                disabled
                                label="Area Sales Manager"
                                name="current_asm"
                                value={values.current_asm}
                                onChange={(e) => setFieldValue("current_asm", e.target.value)}
                                error={touched.current_asm && errors.current_asm}
                            />

                            <InputFields
                                disabled
                                showSkeleton={skeleton}
                                required
                                label="Regional Manager"
                                name="current_rm"
                                value={values.current_rm}
                                onChange={(e) => setFieldValue("current_rm", e.target.value)}
                                error={touched.current_rm && errors.current_rm}
                            />

                            <InputFields
                                required
                                showSkeleton={skeleton}
                                label="Road/Street"
                                name="current_road_street"
                                value={values.current_road_street}
                                onChange={(e) => setFieldValue("current_road_street", e.target.value)}
                                error={touched.current_road_street && errors.current_road_street}
                            />

                            <InputFields
                                required
                                showSkeleton={skeleton}
                                label="Landmark"
                                name="current_landmark"
                                value={values.current_landmark}
                                onChange={(e) => setFieldValue("current_landmark", e.target.value)}
                                error={touched.current_landmark && errors.current_landmark}
                            />

                            <InputFields
                                required
                                showSkeleton={skeleton}
                                label="Village/Town"
                                name="current_town"
                                value={values.current_town}
                                onChange={(e) => setFieldValue("current_town", e.target.value)}
                                error={touched.current_town && errors.current_town}
                            />

                            <InputFields
                                required
                                showSkeleton={skeleton}
                                label="District"
                                name="current_district"
                                value={values.current_district}
                                onChange={(e) => setFieldValue("current_district", e.target.value)}
                                error={touched.current_district && errors.current_district}
                            />

                            <InputFields
                                required
                                showSkeleton={skeleton}
                                label="Contact No1"
                                name="current_contact_no1"
                                value={values.current_contact_no1}
                                onChange={(e) => setFieldValue("current_contact_no1", e.target.value)}
                                error={touched.current_contact_no1 && errors.current_contact_no1}
                            />

                            <InputFields
                                showSkeleton={skeleton}
                                label="Contact No2"
                                name="current_contact_no2"
                                value={values.current_contact_no2}
                                onChange={(e) => setFieldValue("current_contact_no2", e.target.value)}
                            />

                            <InputFields
                                required
                                searchable
                                label="Technician Name"
                                name="technician_id"
                                value={values.technician_id}
                                options={technicianOptions}
                                onChange={(e) => setFieldValue("technician_id", e.target.value)}
                                error={touched.technician_id && errors.technician_id}
                            />

                            <InputFields
                                required
                                label="CTC Status"
                                name="ctc_status"
                                value={values.ctc_status}
                                options={[
                                    { value: "1", label: "Same Outlet" },
                                    { value: "0", label: "Missmatch Outlet" },
                                ]}
                                onChange={(e) => setFieldValue("ctc_status", e.target.value)}
                                error={touched.ctc_status && errors.ctc_status}
                            />

                            <InputFields
                                required
                                label="Call Status"
                                name="status"
                                value={values.status}
                                placeholder="Select Call Status"
                                options={[
                                    { value: "Pending", label: "Pending" },
                                    { value: "In Progress", label: "In Progress" },
                                    { value: "Closed By Technician", label: "Closed By Technician" },
                                    { value: "Completed", label: "Completed" },
                                    { value: "Cancelled", label: "Cancelled" },
                                ]}
                                onChange={(e) => setFieldValue("status", e.target.value)}
                                error={touched.status && errors.status}
                            />

                            <InputFields
                                required
                                integerOnly
                                type="number"
                                label="Sales Volume(Last 3 Months)"
                                name="sales_valume"
                                value={values.sales_valume}
                                onChange={(e) => setFieldValue("sales_valume", e.target.value)}
                                error={touched.sales_valume && errors.sales_valume}
                            />

                            <InputFields
                                required
                                label="Follow Up Status"
                                name="followup_status"
                                options={[
                                    { value: "Assigned To Technician", label: "Assigned To Technician" },
                                    { value: "Waiting For Technician To Attend", label: "Waiting For Technician To Attend" },
                                    { value: "Reassigned To Technician", label: "Reassigned To Technician" },
                                    { value: "Spare Approval Pending", label: "Spare Approval Pending" },
                                    { value: "Spare Out Of Stock", label: "Spare Out Of Stock" },
                                    { value: "Completed", label: "Completed" },
                                ]}
                                value={values.followup_status}
                                onChange={(e) => setFieldValue("followup_status", e.target.value)}
                                error={touched.followup_status && errors.followup_status}
                            />

                            <InputFields
                                required
                                type="textarea"
                                label="Nature of Complaint"
                                name="nature_of_call"
                                value={values.nature_of_call}
                                onChange={(e) => setFieldValue("nature_of_call", e.target.value)}
                                error={touched.nature_of_call && errors.nature_of_call}
                            />

                            <InputFields
                                required
                                type="textarea"
                                label="Follow Up Action"
                                name="follow_up_action"
                                value={values.follow_up_action}
                                onChange={(e) => setFieldValue("follow_up_action", e.target.value)}
                                error={touched.follow_up_action && errors.follow_up_action}
                            />
                        </div>
                    </ContainerCard>
                );

            default:
                return null;
        }
    };

    return (
        <div>
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/callRegister" back>
                    <Icon icon="lucide:arrow-left" width={24} />
                </Link>
                <h1 className="text-xl font-semibold">
                    {isEditMode ? "Update Call Register" : "Add Call Register"}
                </h1>
            </div>

            {/* FORMIK */}
            <Formik
                initialValues={chiller}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, setFieldValue, errors, touched, handleSubmit, setErrors, setTouched }) => (
                    <Form>
                        <StepperForm
                            steps={steps.map((step) => ({
                                ...step,
                                isCompleted: isStepCompleted(step.id),
                            }))}
                            currentStep={currentStep}
                            onBack={prevStep}
                            onNext={() =>
                                handleNext(values, {
                                    setErrors,
                                    setTouched,
                                } as unknown as FormikHelpers<CallRegister>)
                            }
                            onSubmit={handleSubmit}
                            showSubmitButton={isLastStep}
                            showNextButton={!isLastStep}
                            nextButtonText="Save & Next"
                            submitButtonText="Submit"
                        >
                            {renderStepContent(values, setFieldValue, errors, touched)}
                        </StepperForm>
                    </Form>
                )}
            </Formik>
        </div>
    );
}
