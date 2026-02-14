
"use client";

import ContainerCard from "@/app/components/containerCard";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import InputFields from "@/app/components/inputFields";
import StepperForm, {
    StepperStep,
    useStepperForm,
} from "@/app/components/stepperForm";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import axios from "axios";
import {
    ErrorMessage,
    Form,
    Formik,
    FormikErrors,
    FormikHelpers,
    FormikTouched,
} from "formik";
import { useRouter } from "next/navigation";
import * as Yup from "yup";

import Loading from "@/app/components/Loading";
import { saveFinalCode,genearateCode } from "@/app/services/allApi";
import {
    addServiceVisit,
    chillerList,
    getServiceVisitById,
    getTechicianList,
    serviceVisitGenearateCode,
    updateServiceVisit,
    getCurrentCustomer
} from "@/app/services/assetsApi";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "@/app/components/smartLink";

// File validation helper
const FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const SUPPORTED_FORMATS = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileValidation = Yup.mixed()
    .test("fileSize", "File too large (max 10MB)", (value) => {
        if (!value) return true; // No file is valid (optional field)
        if (value instanceof File) {
            return value.size <= FILE_SIZE;
        }
        return true; // If it's a string (existing file), it's valid
    })
    .test("fileFormat", "Unsupported Format", (value) => {
        if (!value) return true; // No file is valid (optional field)
        if (value instanceof File) {
            return SUPPORTED_FORMATS.includes(value.type);
        }
        return true; // If it's a string (existing file), it's valid
    });

const validationSchema = Yup.object({
    ticket_type: Yup.string()
        .required("Ticket Type is required"),
    time_in: Yup.string()
        .required("Time In is required"),
    time_out: Yup.string()
        .required("Time Out is required"),
    outlet_code: Yup.string()
        .required("Outlet Name is required"),
    owner_name: Yup.string()
        .required("Current Owner Name is required"),
    street: Yup.string()
        ,
    landmark: Yup.string()
        ,
    contact_no: Yup.string()
        .required("Current Contact No1 is required"),
    contact_no2: Yup.string()
        .required("Current Contact No2 is required"),
    district: Yup.string()
        ,
    town_village: Yup.string()
        ,
    // owner_name: Yup.string()
    //     .trim()
    //     .required("Owner Name is required")
    //     .max(100, "Owner Name cannot exceed 100 characters"),
    contact_person: Yup.string()
        .required("Contact Person is required"),
    technician_id: Yup.string()
        .required("Technician ID is required"),
    ticket_status: Yup.string().required("Ticket Status is required"),
    ct_status: Yup.string().required("CT Status is required"),
    cts_comment: Yup.string()
        .required("CTS Comment is required"),
    chiller_id: Yup.string()
        .required("Chiller is required"),
    model_no: Yup.string()
        .required("Model No is required"),
    serial_no: Yup.string()
        .required("Serial No is required"),
    asset_no: Yup.string()
        .required("Asset No is required"),
    branding: Yup.string()
        .required("Branding is required"),
    nature_of_call_id: Yup.string()
        .required("Nature of Call is required")
        .max(255, "Nature of Call cannot exceed 255 characters"),
    current_voltage: Yup.string().required("Current Voltage is required")
        .max(100, "Current Voltage cannot exceed 100 characters"),
    amps: Yup.string().required("Amps is required")
        .max(100, "Amps cannot exceed 100 characters"),
    cabin_temperature: Yup.string().required("Cabin Temperature is required")
        .max(100, "Cabin Temperature cannot exceed 100 characters"),
    work_status: Yup.string()
        .required("Work Status is required"),
    type_details_photo1: fileValidation,
    type_details_photo2: fileValidation,
    technical_behavior: Yup.number()
        .required("Technical Behaviour is required"),
    service_quality: Yup.string()
        .required("Service Quality is required"),
    customer_signature: fileValidation,
    is_machine_in_working: Yup.string().required("Is Machine In Working is required"),
    cleanliness: Yup.string().required("Cleanliness is required"),
    condensor_coil_cleand: Yup.string().required("Condensor Coil Cleaned is required"),
    gaskets: Yup.string().required("Gaskets is required"),
    light_working: Yup.string().required("Light Working is required"),
    branding_no: Yup.string().required("Branding No is required"),
    propper_ventilation_available: Yup.string().required("Proper Ventilation Available is required"),
    leveling_positioning: Yup.string().required("Leveling Positioning is required"),
    stock_availability_in: Yup.string().required("Stock Availability In is required"),
    is_machine_in_working_img: fileValidation,
    cleanliness_img: fileValidation,
    condensor_coil_cleand_img: fileValidation,
    stock_availability_in_img: fileValidation,
    cooler_image: fileValidation,
    cooler_image2: fileValidation,

});

const stepSchemas = [
    // Step 1: Basic Outlet Information
    Yup.object().shape({
        ticket_type: validationSchema.fields.ticket_type,
        time_in: validationSchema.fields.time_in,
        time_out: validationSchema.fields.time_out,
        ticket_status: validationSchema.fields.ticket_status,
    }),
    Yup.object().shape({
        outlet_code: validationSchema.fields.outlet_code,
        owner_name: validationSchema.fields.owner_name,
        street: validationSchema.fields.street,
        landmark: validationSchema.fields.landmark,
        district: validationSchema.fields.district,
        town_village: validationSchema.fields.town_village,
        contact_no: validationSchema.fields.contact_no,
        contact_no2: validationSchema.fields.contact_no2,
        // owner_name: validationSchema.fields.owner_name,
        contact_person: validationSchema.fields.contact_person,
        technician_id: validationSchema.fields.technician_id,
        ct_status: validationSchema.fields.ct_status,
        cts_comment: validationSchema.fields.cts_comment,

    }),

    // Step 2: Location and Personnel
    Yup.object().shape({
        chiller_id: validationSchema.fields.chiller_id,
        model_no: validationSchema.fields.model_no,
        serial_no: validationSchema.fields.serial_no,
        asset_no: validationSchema.fields.asset_no,
        branding: validationSchema.fields.branding,
    }),

    Yup.object().shape({
        nature_of_call_id: validationSchema.fields.nature_of_call_id,
        current_voltage: validationSchema.fields.current_voltage,
        amps: validationSchema.fields.amps,
        cabin_temperature: validationSchema.fields.cabin_temperature,
    }),

    Yup.object().shape({
        work_status: validationSchema.fields.work_status,
        type_details_photo1: validationSchema.fields.type_details_photo1,
        type_details_photo2: validationSchema.fields.type_details_photo2,
        technical_behavior: validationSchema.fields.technical_behavior,
        service_quality: validationSchema.fields.service_quality,
        customer_signature: validationSchema.fields.customer_signature,
    }),

    Yup.object().shape({
        is_machine_in_working: validationSchema.fields.is_machine_in_working,
        cleanliness: validationSchema.fields.cleanliness,
        condensor_coil_cleand: validationSchema.fields.condensor_coil_cleand,
        gaskets: validationSchema.fields.gaskets,
        light_working: validationSchema.fields.light_working,
        branding_no: validationSchema.fields.branding_no,
        propper_ventilation_available: validationSchema.fields.propper_ventilation_available,
        leveling_positioning: validationSchema.fields.leveling_positioning,
        stock_availability_in: validationSchema.fields.stock_availability_in,
        is_machine_in_working_img: validationSchema.fields.is_machine_in_working_img,
        cleanliness_img: validationSchema.fields.cleanliness_img,
        condensor_coil_cleand_img: validationSchema.fields.condensor_coil_cleand_img,
        stock_availability_in_img: validationSchema.fields.stock_availability_in,
        cooler_image: validationSchema.fields.cooler_image,
        cooler_image2: validationSchema.fields.cooler_image2,
    }),
];

type ServiceVisit = {
    model_name: string;
    osa_code: string;
    outlet_code: string;
    owner_name: string;
    street: string;
    landmark: string;
    contact_no: string;
    contact_no2: string;
    district: string;
    town_village: string;
    // owner_name: string;
    contact_person: string;
    ticket_type: string;
    time_in: string;
    time_out: string;
    status: string;
    model_no: string;
    serial_no: string;
    asset_no: string;
    branding: string;
    ticket_status: string;
    ct_status: string;
    technician_id: string;
    is_machine_in_working: string;
    cleanliness: string;
    condensor_coil_cleand: string;
    gaskets: string;
    light_working: string;
    branding_no: string;
    propper_ventilation_available: string;
    leveling_positioning: string;
    stock_availability_in: string;
    cts_comment: string;
    current_voltage: string;
    amps: string;
    chiller_id: string;
    cabin_temperature: string;
    work_status: string;
    technical_behavior: string;
    service_quality: string;
    nature_of_call_id: string;
    type_details_photo1: string | File;
    type_details_photo2: string | File;
    is_machine_in_working_img: string | File;
    cleanliness_img: string | File;
    condensor_coil_cleand_img: string | File;
    stock_availability_in_img: string | File;
    cooler_image: string | File;
    cooler_image2: string | File;
    customer_signature: string | File;
};

type DropdownOption = {
    value: string;
    label: string;
};

type FileField = {
    fieldName: keyof ServiceVisit;
    label: string;
    accept?: string;
};

// const TICKET_MODEL_MAP: Record<string, string> = {
//     BD: "BD",
//     RB: "RB",
//     TR: "TR",
// };


const fileFields: FileField[] = [
    { fieldName: "type_details_photo1", label: "Type Details Photo 1", accept: "image/*,.pdf" },
    { fieldName: "type_details_photo2", label: "Type Details Photo 2", accept: "image/*,.pdf" },
    { fieldName: "is_machine_in_working_img", label: "Is Machine In Working Img", accept: "image/*,.pdf" },
    { fieldName: "cleanliness_img", label: "Cleanliness Img", accept: "image/*,.pdf" },
    { fieldName: "condensor_coil_cleand_img", label: "Condensor Coil Cleaned Img", accept: "image/*,.pdf" },
    { fieldName: "stock_availability_in_img", label: "Stock Availability In Img", accept: "image/*,.pdf" },
    { fieldName: "cooler_image", label: "Cooler Image", accept: "image/*,.pdf" },
    { fieldName: "cooler_image2", label: "Cooler Image 2", accept: "image/*,.pdf" },
    { fieldName: "customer_signature", label: "Customer Signature", accept: "image/*,.pdf" },
];

// Create axios instance for form data
const APIFormData = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        "Content-Type": "multipart/form-data",
    },
});

APIFormData.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default function AddServiceVisitStepper() {
    
    const [uploadedFiles, setUploadedFiles] = useState<
        Record<string, { file: File; preview?: string }>
    >({});
    const [loading, setLoading] = useState(false);
    // const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [existingData, setExistingData] = useState<ServiceVisit | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { channelOptions, assetsModelOptions, agentCustomerOptions, brandingOptions, ensureAgentCustomerLoaded, ensureBrandingLoaded, ensureChannelLoaded, ensureAssetsModelLoaded, ensureLocationLoaded } = useAllDropdownListData();
    const [technicianOptions, setTechnicianOptions] = useState<{ value: string; label: string }[]>([]);
    const [chillerOptions, setChillerOptions] = useState<{ value: string; label: string }[]>([]);
    const [skeleton, setSkeleton] = useState(false);
    const codeGeneratedRef = useRef(false);
    const params = useParams();
    // const uuid = params?.id;
    // const isAddMode = uuid === "add" || !uuid;
    const [chillers, setChillers] = useState<any[]>([]);
    const [skeletonLoading, setSkeletonLoading] = useState(false);
    const [modelName,setModelName] = useState("");
    const steps: StepperStep[] = [
        { id: 1, label: "Basic Information" },
        { id: 2, label: "Current Customer Details" },
        { id: 3, label: "Fridge Details" },
        { id: 4, label: "Work Details" },
        { id: 5, label: "Work Done Details" },
        { id: 6, label: "Equipment Condition" },
    ];
  const uuid = Array.isArray(params?.uuid) ? params?.uuid[0] : params?.uuid;
  const isEditMode = uuid !== undefined && uuid !== "add";
    const {
        currentStep,
        nextStep,
        prevStep,
        markStepCompleted,
        isStepCompleted,
        isLastStep,
    } = useStepperForm(steps.length);

    const { showSnackbar } = useSnackbar();
    const router = useRouter();

    useEffect(() => {
        ensureChannelLoaded();
        ensureLocationLoaded();
        ensureAssetsModelLoaded();
        ensureBrandingLoaded();
        ensureAgentCustomerLoaded();
    }, []);

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

    useEffect(() => {
        (async () => {
            try {
                const response = await chillerList();

                const chillerData = Array.isArray(response?.data)
                    ? response.data
                    : response?.data?.data ?? [];

                setChillers(chillerData);

                const options = chillerData.map((item: any) => ({
                    value: String(item.id),
                    label: item.osa_code,
                }));

                setChillerOptions(options);
            } catch (error) {
                showSnackbar("Failed to fetch chiller data", "error");
            }
        })();
    }, []);

    // This effect will be handled inside the Formik component through onChange handler



   

    const fetchExistingData = async (id: string) => {
        try {
            setLoading(true);
            const res = await getServiceVisitById(id);

            if (res.status === "success" && res.data) {
                const data = res.data;

                // Transform the API response to match our ServiceVisit type
                const transformedData: ServiceVisit = {
                    model_name: data.model_name || "",
                    osa_code: data.osa_code || "",
                    outlet_code: String(data.outlet_id),
                    owner_name: data.owner_name || "",
                    street: data.street || "",
                    landmark: data.landmark || "",
                    contact_no: data.contact_no || "",
                    contact_no2: data.contact_no2 || "",
                    district: data.district || "",
                    town_village: data.town_village || "",
                    contact_person: data.contact_person || "",
                    ticket_type: data.ticket_type === "BD" ? "SER_BD" : data.ticket_type || "",
                    time_in: data.time_in ? String(data.time_in).split(" ")[0] : "",
                    time_out: data.time_out ? String(data.time_out).split(" ")[0] : "",
                    model_no: data.model_no?.name || data.model_no || "",
                    status: data.status || "",
                    serial_no: data.serial_no || "",
                    asset_no: data.asset_no || "",
                    branding: data.branding?.name || data.branding || "",
                    ticket_status: String(data.ticket_status),
                    ct_status: data.ct_status === "Same Outlet" ? "1" : data.ct_status === "Missmatch Outlet" ? "0" : String(data.ct_status || ""),
                    chiller_id: String(data.chiller_id?.id || data.chiller_id || ""),
                    is_machine_in_working: String(data.is_machine_in_working || ""),
                    cleanliness: String(data.cleanliness || ""),
                    condensor_coil_cleand: String(data.condensor_coil_cleand || ""),
                    gaskets: String(data.gaskets || ""),
                    light_working: String(data.light_working || ""),
                    branding_no: String(data.branding_no || ""),
                    propper_ventilation_available: String(data.propper_ventilation_available || ""),
                    leveling_positioning: String(data.leveling_positioning || ""),
                    stock_availability_in: String(data.stock_availability_in || ""),
                    cts_comment: data.cts_comment || "",
                    current_voltage: String(data.current_voltage || ""),
                    amps: String(data.amps || ""),
                    cabin_temperature: String(data.cabin_temperature || ""),
                    work_status: String(data.work_status || ""),
                    technical_behavior: String(data.technical_behavior || data.technical_behavior || ""),
                    service_quality: String(data.service_quality || ""),
                    nature_of_call_id: String(data.nature_of_call),
                    technician_id: String(data.technician?.id || data.technician_id?.id || data.technician_id || ""),
                    type_details_photo1: data.type_details_photo1 || "",
                    type_details_photo2: data.type_details_photo2 || "",
                    is_machine_in_working_img: data.is_machine_in_working_img || "",
                    cleanliness_img: data.cleanliness_img || "",
                    condensor_coil_cleand_img: data.condensor_coil_cleand_img || "",
                    stock_availability_in_img: data.stock_availability_in_img || "",
                    cooler_image: data.cooler_image || "",
                    cooler_image2: data.cooler_image2 || "",
                    customer_signature: data.customer_signature || "",
                };

                setExistingData(transformedData);

                // Set uploaded files for existing file names
                const fileFieldsToCheck = [
                    "type_details_photo1",
                    "type_details_photo2",
                    "is_machine_in_working_img",
                    "cleanliness_img",
                    "condensor_coil_cleand_img",
                    "stock_availability_in_img",
                    "cooler_image",
                    "cooler_image2",
                    "customer_signature",
                ];

                const initialUploadedFiles: Record<
                    string,
                    { file: File; preview?: string }
                > = {};
                fileFieldsToCheck.forEach((field) => {
                    if (transformedData[field as keyof ServiceVisit]) {
                        initialUploadedFiles[field] = {
                            file: new File(
                                [],
                                transformedData[field as keyof ServiceVisit] as string
                            ),
                            preview: undefined,
                        };
                    }
                });
                setUploadedFiles(initialUploadedFiles);
            } else {
                showSnackbar("Failed to fetch service visit data", "error");
                setExistingData(null);
            }
        } catch (error) {
            console.error("Error fetching existing data:", error);
            showSnackbar("Failed to fetch service visit data", "error");
            setExistingData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isEditMode && uuid) {
            fetchExistingData(uuid);
        } else {
            setLoading(false);
        }
    }, [uuid, isEditMode]);

    const isFieldDisabled = (field: keyof ServiceVisit) =>
        isEditMode && field !== "chiller_id";

    // const ticketTypeRef = useRef<string>("");

    // const handleTicketTypeChange = async (ticketType: string) => {
    //     if (!ticketType) return;

    //     const modelName = TICKET_MODEL_MAP[ticketType];
    //     if (!modelName) return;

    //     // prevent re-trigger in edit mode
    //     if (codeGeneratedRef.current) return;

    //     try {
    //         codeGeneratedRef.current = true;

    //         const res = await serviceVisitGenearateCode({
    //             model_name: modelName,
    //         });

    //         // This will be called from the form with setFieldValue
    //     } catch (err) {
    //         showSnackbar("Failed to generate code", "error");
    //     }
    // };



    const handleFileChange = (
        fieldName: keyof ServiceVisit,
        event: React.ChangeEvent<HTMLInputElement>,
        setFieldValue: FormikHelpers<ServiceVisit>["setFieldValue"]
    ) => {
        const file = event.target.files?.[0];
        if (file) {

            if (file.size > FILE_SIZE) {
                showSnackbar(
                    `File size must be less than 10MB for ${fieldName}`,
                    "error"
                );
                event.target.value = "";
                return;
            }


            if (!SUPPORTED_FORMATS.includes(file.type)) {
                showSnackbar(
                    `Unsupported file format for ${fieldName}. Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF`,
                    "error"
                );
                event.target.value = ""; // Clear the input
                return;
            }

            setFieldValue(fieldName, file);

            // Generate preview for images
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setUploadedFiles((prev) => ({
                        ...prev,
                        [fieldName]: {
                            file,
                            preview: e.target?.result as string,
                        },
                    }));
                };
                reader.readAsDataURL(file);
            } else {
                setUploadedFiles((prev) => ({
                    ...prev,
                    [fieldName]: { file },
                }));
            }

            showSnackbar(`File "${file.name}" selected for ${fieldName}`, "success");
        }
    };

    const removeFile = (
        fieldName: keyof ServiceVisit,
        setFieldValue: (
            field: keyof ServiceVisit,
            value: ServiceVisit,
            shouldValidate?: boolean
        ) => void
    ) => {
        setUploadedFiles((prev) => {
            const newFiles = { ...prev };
            delete newFiles[fieldName];
            return newFiles;
        });
        showSnackbar(`File removed from ${fieldName}`, "info");
    };

    const renderFileInput = (
        fieldName: keyof ServiceVisit,
        label: string,
        values: ServiceVisit,
        setFieldValue: FormikHelpers<ServiceVisit>["setFieldValue"],
        errors: FormikErrors<ServiceVisit>,
        touched: FormikTouched<ServiceVisit>,
        accept?: string
    ) => {
        const fileInfo = uploadedFiles[fieldName];
        const currentValue = values[fieldName];
        const hasFile =
            fileInfo || (typeof currentValue === "string" && currentValue);

        return (
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>

                {!hasFile ? (
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Icon
                                    icon="lucide:upload"
                                    className="w-8 h-8 mb-4 text-gray-500"
                                />
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to upload</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    PDF, DOC, JPG, PNG, GIF (MAX 10MB)
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept={accept || ".pdf,.doc,.docx,image/*"}
                                onChange={(e) => handleFileChange(fieldName, e, setFieldValue)}
                            />
                        </label>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-3">
                            {fileInfo?.preview ? (
                                <img
                                    src={fileInfo.preview}
                                    alt="Preview"
                                    className="w-12 h-12 object-cover rounded"
                                />
                            ) : (
                                <Icon icon="lucide:file" className="w-8 h-8 text-gray-500" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {fileInfo
                                        ? fileInfo.file.name
                                        : typeof currentValue === "string"
                                            ? currentValue
                                            : "File"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {fileInfo
                                        ? `${(fileInfo.file.size / 1024 / 1024).toFixed(2)} MB`
                                        : "Uploaded file"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeFile(fieldName, setFieldValue)}
                            className="text-red-600 hover:text-red-800"
                        >
                            <Icon icon="lucide:trash-2" className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {touched[fieldName] && errors[fieldName] && (
                    <div className="text-sm text-red-600 mt-1">
                        {errors[fieldName] as string}
                    </div>
                )}
            </div>
        );
    };

    const initialValues: ServiceVisit = {
        model_name: "",
        osa_code: "",
        outlet_code: "",
        owner_name: "",
        street: "",
        landmark: "",
        contact_no: "",
        contact_no2: "",
        district: "",
        town_village: "",
        // owner_name: "",
        contact_person: "",
        ticket_type: "",
        time_in: "",
        time_out: "",
        status: "",
        model_no: "",
        serial_no: "",
        asset_no: "",
        branding: "",
        ticket_status: "",
        ct_status: "",
        chiller_id: "",
        is_machine_in_working: "",
        cleanliness: "",
        condensor_coil_cleand: "",
        gaskets: "",
        light_working: "",
        branding_no: "",
        propper_ventilation_available: "",
        leveling_positioning: "",
        stock_availability_in: "",
        cts_comment: "",
        current_voltage: "",
        amps: "",
        cabin_temperature: "",
        work_status: "",
        technical_behavior: "",
        service_quality: "",
        nature_of_call_id: "",
        technician_id: "",
        type_details_photo1: "",
        type_details_photo2: "",
        is_machine_in_working_img: "",
        cleanliness_img: "",
        condensor_coil_cleand_img: "",
        stock_availability_in_img: "",
        cooler_image: "",
        cooler_image2: "",
        customer_signature: "",
    };

    const stepFields = [
        ["ticket_type", "time_in", "time_out", "ticket_status"],
        ["outlet_code", "owner_name","street","landmark","contact_no","contact_no2","district","town_village","contact_person", "technician_id","ct_status" ,"cts_comment"],
        ["chiller_id", "model_no", "serial_no", "asset_no", "branding"],
        ["nature_of_call_id", "current_voltage", "amps", "cabin_temperature"],
        ["work_status", "type_details_photo1", "type_details_photo2", "technical_behavior", "service_quality", "customer_signature"],
        ["is_machine_in_working", "cleanliness", "condensor_coil_cleand", "gaskets", "light_working", "branding_no", "propper_ventilation_available", "leveling_positioning", "stock_availability_in", "is_machine_in_working_img", "cleanliness_img", "condensor_coil_cleand_img", "stock_availability_in_img", "cooler_image", "cooler_image2"],
        // ["owner_name", "outlet_code", "landmark", "district", "location", "town_village", "longitude", "latitude", "contact_no", "contact_no2", "contact_person", "ticket_type", "time_in", "time_out", "model_no", "serial_no", "asset_no", "branding", "ticket_status", "is_machine_in_working", "cleanliness", "condensor_coil_cleand", "gaskets", "light_working", "branding_no", "propper_ventilation_available", "leveling_positioning", "stock_availability_in", "complaint_type", "comment", "cts_comment", "spare_part_used", "pending_other_comments", "any_dispute", "current_voltage", "amps", "cabin_temperature", "work_status", "wrok_status_pending_reson", "spare_request", "work_done_type", "spare_details", "technical_behavior", "service_quality", "nature_of_call_id", "technician_id", "type_details_photo1", "type_details_photo2"],
        // ["is_machine_in_working_img", "cleanliness_img", "condensor_coil_cleand_img", "gaskets_img", "light_working_img", "branding_no_img", "propper_ventilation_available_img", "leveling_positioning_img", "stock_availability_in_img", "cooler_image", "cooler_image2", "customer_signature"],

    ];

    const handleNext = async (
        values: ServiceVisit,
        actions: FormikHelpers<ServiceVisit>
    ) => {
        try {
            const schema = stepSchemas[currentStep - 1];
            await schema.validate(values, { abortEarly: false });
            markStepCompleted(currentStep);
            nextStep();
        } catch (err: unknown) {
            if (err instanceof Yup.ValidationError) {
                const errors: FormikErrors<ServiceVisit> = {};
                const touched: FormikTouched<ServiceVisit> = {};
                // Only include fields for the current step
                const fields = stepFields[currentStep - 1] || [];
                err.inner.forEach((error) => {
                    if (error.path && fields.includes(error.path)) {
                        errors[error.path as keyof ServiceVisit] = error.message;
                        touched[error.path as keyof ServiceVisit] = true;
                    }
                });
                actions.setErrors(errors);
                actions.setTouched(touched);
            }
            // showSnackbar("Please fix validation errors before proceeding", "error");
        }
    };

        const fetchCurrentCustomer = async (
            search: string,
            setFieldValue: FormikHelpers<any>["setFieldValue"]
        ) => {
            // Set Asset Number (chiller_serial_number) input field
    
            try {
                setSkeleton(true);
                const res = await getCurrentCustomer({ search: search });
                // setDistributorId(res?.data?.get_warehouse?.id);
                // setAsmId(res?.data?.get_warehouse?.area?.created_by?.id);
                // setRsmId(res?.data?.get_warehouse?.region?.created_by?.id);
                const d = res
    
    
                setFieldValue("owner_name", d.data.owner_name);
                setFieldValue("street", d.data?.street || "");
                setFieldValue("landmark", d.data?.landmark || "");
                setFieldValue("town_village", d.data?.town || "");
                setFieldValue("district", d.data?.district || "");
                setFieldValue("contact_no", d.data?.contact_no || "");
                setFieldValue("contact_no2", d.data?.contact_no2 || "");
                setSkeleton(false);
    
            } catch (err) {
                console.error(err);
                showSnackbar("Failed to fetch serial number details", "error");
            }
            finally {
                setSkeleton(false);
            }
        };

    const handleSubmit = async (values: ServiceVisit) => {
        try {
            setIsSubmitting(true);
            await validationSchema.validate(values, { abortEarly: false });

            // Create FormData for file upload
            const formData = new FormData();

            // Append all non-file fields
            Object.keys(values).forEach((key) => {
                const value = values[key as keyof ServiceVisit];

                // Skip file fields for now (they will be appended separately)
                if (value instanceof File) {
                    return;
                }

                // Exclude these fields from the payload
                // if (["model_no", "serial_no", "asset_no", "branding"].includes(key)) {
                //     return;
                // }

                if (value !== null && value !== undefined && value !== "") {
                    formData.append(key, value.toString());
                }
            });

            // Append file fields
            fileFields.forEach((fileField) => {
                const fileValue = values[fileField.fieldName];
                if (fileValue instanceof File) {
                    formData.append(fileField.fieldName, fileValue);
                } else if (typeof fileValue === "string" && fileValue) {
                    // For existing files in edit mode, you might want to handle them differently
                    // If it's a string (existing file path), you can append it as is or skip
                    // formData.append(fileField.fieldName, fileValue);
                }
            });
           
            let res;
            if (isEditMode && uuid) {
                // Update existing record with FormData
                res = await updateServiceVisit(uuid.toString(), formData);
            } else {
                // Create new record with FormData
                res = await addServiceVisit(formData);
            }
            console.log("API Response:", res);

            // Only redirect if no error and no errors in response
            if (!res || res.error) {
                console.log("API Error:", res?.error);
                showSnackbar(
                    res?.data?.message ||
                    `Failed to ${isEditMode ? "update" : "add"} Service Visit`,
                    "error"
                );
            } else {
                showSnackbar(
                    `Service Visit ${isEditMode ? "updated" : "added"} successfully`,
                    "success"
                );

                if (!isEditMode) {
                    await saveFinalCode({
                        reserved_code: values.osa_code,
                        model_name: modelName,
                    });
                }
                router.push("/serviceVisit");
            }
        } catch (error:any) {
            if (error instanceof Yup.ValidationError) {
                const errorMessages = error.inner.map((err: any) => err.message);
                const firstError = errorMessages[0];
                const additionalErrorCount = errorMessages.length - 1;
                
                let message = firstError;
                if (additionalErrorCount > 0) {
                    message += ` (and ${additionalErrorCount} more error${additionalErrorCount > 1 ? 's' : ''})`;
                }
                
                showSnackbar(message, "error");
            } else if (error?.message) {
                // API error response (e.g. { message: "The time in field must be a valid date. (and 1 more error)", errors: {...} })
                showSnackbar(error.message, "error");
            } else {
                showSnackbar(`Failed to ${isEditMode ? "update" : "add"} Service Visit`, "error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepContent = (
        values: ServiceVisit,
        setFieldValue: FormikHelpers<ServiceVisit>["setFieldValue"],
        errors: FormikErrors<ServiceVisit>,
        touched: FormikTouched<ServiceVisit>
    ) => {
        if (loading) {
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <Loading />
                </div>
            );
        }

        switch (currentStep) {
            case 1:
                return (
                    <ContainerCard>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <InputFields
                                    required
                                    label="Ticket Type"
                                    name="ticket_type"
                                    disabled={isFieldDisabled("ticket_type")}
                                    value={values.ticket_type}
                                    options={[
                                        { label: "BD", value: "SER_BD" },
                                        { label: "AUD", value: "AUD" },
                                        { label: "INS", value: "INS" },
                                        { label: "PM", value: "PM" },
                                    ]}
                                    onChange={async (e) => {
                                        const ticketType = e.target.value;

                                        // reset guard when ticket type changes
                                        if (ticketType !== values.ticket_type) {
                                            codeGeneratedRef.current = false;
                                        }
                                        setModelName(ticketType);

                                        setFieldValue("ticket_type", ticketType);
                                        setModelName(ticketType);
                                        // const modelName = TICKET_MODEL_MAP[ticketType];
                                        // if (!modelName) return;

                                        if (codeGeneratedRef.current) return;
                                        codeGeneratedRef.current = true;

                                        try {
                                            setSkeletonLoading(true);
                                            const res = await genearateCode(
                                                { model_name: ticketType }
                                            );

                                            setFieldValue("prefix", e.target.value);
                                            setFieldValue("osa_code", res?.code || "");
                                        } catch (err) {
                                            codeGeneratedRef.current = false; // allow retry
                                            showSnackbar("Failed to generate code", "error");
                                        }
                                        finally {setSkeletonLoading(false);}
                                    }}
                                    error={touched.ticket_type && errors.ticket_type}
                                />

                                {/* <ErrorMessage
                                    name="ticket_type"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>
                            <div>
                                <InputFields
                                    label="Code"
                                    name="osa_code"
                                    showSkeleton={skeletonLoading}
                                    value={values.osa_code}
                                    disabled
                                    onChange={(e) => setFieldValue("osa_code", e.target.value)}
                                    error={touched.osa_code && errors.osa_code}
                                />
                            </div>
                            <div>
                                <InputFields
                                    required
                                    label="Ticket Status"
                                    name="ticket_status"
                                    disabled={isFieldDisabled("ticket_status")}
                                    value={values.ticket_status}
                                    options={[
                                        { value: "0", label: "Pending" },
                                        { value: "1", label: "Closed By Technician" },
                                    ]}
                                    onChange={(e) => setFieldValue("ticket_status", e.target.value)}
                                    error={touched.ticket_status && errors.ticket_status}
                                />
                            </div>
                          <div>
                                <InputFields
                                    required
                                    label="Time In"
                                    name="time_in"
                                    type="date"
                                    disabled={isFieldDisabled("time_in")}
                                    value={values.time_in}
                                    onChange={(e) => setFieldValue("time_in", e.target.value)}
                                    error={touched.time_in && errors.time_in}
                                />
                                {/* <ErrorMessage
                                    name="time_in"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>
                            <div>
                                <InputFields
                                    required
                                    label="Time Out"
                                    name="time_out"
                                    type="date"
                                    disabled={isFieldDisabled("time_out")}
                                    value={values.time_out}
                                    onChange={(e) => setFieldValue("time_out", e.target.value)}
                                    error={touched.time_out && errors.time_out}
                                    min={values.time_in || undefined}
                                />
                                {/* <ErrorMessage
                                    name="time_out"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>
                        </div>
                    </ContainerCard>
                );
            case 2:
                return (
                    <ContainerCard>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <InputFields
                                    required
                                    label="Outlet Name"
                                    name="outlet_code"
                                    disabled={isFieldDisabled("outlet_code")}
                                    value={values.outlet_code}
                                    options={agentCustomerOptions}
                                    onChange={(e) =>{ setFieldValue("outlet_code", e.target.value)
                                        if (e.target.value){ {
                                        fetchCurrentCustomer(e.target.value, setFieldValue);
                                    }
                                }
                                    }}
                                    error={touched.outlet_code && errors.outlet_code}
                                />
                            </div>
                             <InputFields
                                                           required
                                                           label="Owner Name"
                                                           showSkeleton={skeleton}
                                                           name="owner_name"
                                                           disabled={isFieldDisabled("owner_name")}
                                                           value={values.owner_name}
                                                           onChange={(e) => setFieldValue("owner_name", e.target.value)}
                                                           error={touched.owner_name && errors.owner_name}
                                                       />
                           
                                                     
                                                      
                              <InputFields
                                                           showSkeleton={skeleton}
                                                           label="Road/Street"
                                                           name="street"
                                                                              disabled={isFieldDisabled("street")}
                                                           value={values.street}
                                                           onChange={(e) => setFieldValue("street", e.target.value)}
                                                        //    error={touched.street && errors.street}
                                                       />
                           
                                                       <InputFields
                                                           showSkeleton={skeleton}
                                                           label="Landmark"
                                                           name="landmark"
                                                           disabled={isFieldDisabled("landmark")}
                                                           value={values.landmark}
                                                           onChange={(e) => setFieldValue("landmark", e.target.value)}
                                                        //    error={touched.landmark && errors.landmark}
                                                       />
                           
                                                       <InputFields
                                                           showSkeleton={skeleton}
                                                           label="Village/Town"
                                                           name="town_village"
                                                           disabled={isFieldDisabled("town_village")}
                                                           value={values.town_village}
                                                           onChange={(e) => setFieldValue("town_village", e.target.value)}
                                                        //    error={touched.town_village && errors.town_village}
                                                       />
                           
                                                       <InputFields
                                                           showSkeleton={skeleton}
                                                           label="District"
                                                           name="district"
                                                           disabled={isFieldDisabled("district")}
                                                           value={values.district}
                                                           onChange={(e) => setFieldValue("district", e.target.value)}
                                                        //    error={touched.district && errors.district}
                                                       />
                           
                                                       <InputFields
                                                           required
                                                           showSkeleton={skeleton}
                                                           label="Contact No1"
                                                           name="contact_no"
                                                           disabled={isFieldDisabled("contact_no")}
                                                           value={values.contact_no}
                                                           onChange={(e) => setFieldValue("contact_no", e.target.value)}
                                                           error={touched.contact_no && errors.contact_no}
                                                       />
                           
                                                       <InputFields
                                                           showSkeleton={skeleton}
                                                           label="Contact No2"
                                                           name="contact_no2"
                                                           disabled={isFieldDisabled("contact_no2")}
                                                           value={values.contact_no2}
                                                           onChange={(e) => setFieldValue("contact_no2", e.target.value)}
                                                       />
                           
                            <div>
                                <InputFields
                                    required
                                    label="Contact Person"
                                    name="contact_person"
                                    disabled={isFieldDisabled("contact_person")}
                                    value={values.contact_person}
                                    onChange={(e) => setFieldValue("contact_person", e.target.value)}
                                    error={touched.contact_person && errors.contact_person}
                                />
                                
                            </div>
                            <div>
                                <InputFields
                                    required
                                    label="Technician"
                                    name="technician_id"
                                    disabled={isFieldDisabled("technician_id")}
                                    value={values.technician_id}
                                    options={technicianOptions}
                                    onChange={(e) => setFieldValue("technician_id", e.target.value)}
                                    error={touched.technician_id && errors.technician_id}
                                />
                               
                            </div>
                            <div>
                                <InputFields
                                    required
                                    label="CT Status"
                                    name="ct_status"
                                    disabled={isFieldDisabled("ct_status")}
                                    value={values.ct_status}
                                    options={[
                                        { value: "1", label: "Same Outlet" },
                                        { value: "0", label: "Missmatch Outlet" },
                                    ]}
                                    onChange={(e) => setFieldValue("ct_status", e.target.value)}
                                    error={touched.ct_status && errors.ct_status}
                                />
                                
                            </div>
                            <div>
                                <InputFields
                                required
                                    label="CTS Comment"
                                    name="cts_comment"
                                    disabled={isFieldDisabled("cts_comment")}
                                    value={values.cts_comment}
                                    onChange={(e) => setFieldValue("cts_comment", e.target.value)}
                                    error={touched.cts_comment && errors.cts_comment}
                                />
                               
                            </div>


                        </div>
                    </ContainerCard>
                );

            case 3:
                return (
                    <ContainerCard>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            <div>
                                <InputFields
                                required
                                    label="Chiller"
                                    name="chiller_id"
                                    options={chillerOptions}
                                    value={values.chiller_id}
                                    onChange={(e) => {
                                        setFieldValue("chiller_id", e.target.value);

                                        // Auto-fill chiller details
                                        const selectedChiller = chillers.find(
                                            (c) => String(c.id) === e.target.value
                                        );

                                        if (selectedChiller) {
                                            setFieldValue("asset_no", selectedChiller.assets_type || "");
                                            setFieldValue("serial_no", selectedChiller.serial_number || "");
                                            setFieldValue("model_no", selectedChiller.model_number?.name || "");
                                            setFieldValue("branding", selectedChiller.branding?.name || "");
                                        }
                                    }}
                                    error={touched.chiller_id && errors.chiller_id}
                                />

                                {/* <ErrorMessage
                                    name="chiller_id"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            <div>
                                <InputFields
                                required
                                    label="Model No."
                                    name="model_no"
                                    disabled
                                    value={values.model_no}
                                    onChange={(e) => setFieldValue("model_no", e.target.value)}
                                    error={touched.model_no && errors.model_no}
                                />
                                {/* <ErrorMessage
                                    name="model_no"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>
                            <div>
                                <InputFields
                                required
                                    label="Serial No."
                                    name="serial_no"
                                    disabled
                                    value={values.serial_no}
                                    onChange={(e) => setFieldValue("serial_no", e.target.value)}
                                    error={touched.serial_no && errors.serial_no}
                                />
                                {/* <ErrorMessage
                                    name="serial_no"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>
                            {/* <div>
                                <InputFields
                                required
                                    label="Asset Category"
                                    name="asset_no"
                                    disabled
                                    value={values.asset_no}
                                    onChange={(e) => setFieldValue("asset_no", e.target.value)}
                                    error={touched.asset_no && errors.asset_no}
                                />
                               
                            </div> */}
                            <div>
                                <InputFields
                                required
                                    label="Asset Type"
                                    name="asset_no"
                                    disabled
                                    value={values.asset_no}
                                    onChange={(e) => setFieldValue("asset_no", e.target.value)}
                                    error={touched.asset_no && errors.asset_no}
                                />
                                {/* <ErrorMessage
                                    name="asset_no"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>
                            <div>
                                <InputFields
                                required
                                    label="Branding"
                                    name="branding"
                                    disabled
                                    value={values.branding}
                                    onChange={(e) => setFieldValue("branding", e.target.value)}
                                    error={touched.branding && errors.branding}
                                />
                                {/* <ErrorMessage
                                    name="branding"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                        </div>
                    </ContainerCard>

                );
            case 4:
                return (
                    <ContainerCard>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <InputFields
                                required
                                    label="Nature of Call"
                                    type="number"
                                    integerOnly
                                    min={1}
                                    name="nature_of_call_id"
                                    disabled={isFieldDisabled("nature_of_call_id")}
                                    value={values.nature_of_call_id}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val < 1) return;
                                        setFieldValue("nature_of_call_id", e.target.value)}}
                                    error={touched.nature_of_call_id && errors.nature_of_call_id}
                                />
                                {/* <ErrorMessage
                                    name="nature_of_call_id"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>
                            <div>
                                <InputFields
                                required
                                type="number"
                                integerOnly
                                min={1}
                                    label="Current Voltage"
                                    name="current_voltage"
                                    disabled={isFieldDisabled("current_voltage")}
                                    value={values.current_voltage}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val < 1) return;
                                        setFieldValue("current_voltage", e.target.value)}}
                                    error={touched.current_voltage && errors.current_voltage}
                                />
                                {/* <ErrorMessage
                                    name="current_voltage"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            <div>
                                <InputFields
                                required
                                type="number"
                                integerOnly
                                min={1}
                                error={touched.amps && errors.amps}
                                    label="Amps"
                                    name="amps"
                                    disabled={isFieldDisabled("amps")}
                                    value={values.amps}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val < 1) return;setFieldValue("amps", e.target.value)}}
                                />
                                {/* <ErrorMessage
                                    name="amps"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            <div>
                                <InputFields
                                required
                                type="number"
                                integerOnly
                                    label="Cabin Temperature"
                                    name="cabin_temperature"
                                    disabled={isFieldDisabled("cabin_temperature")}
                                    value={values.cabin_temperature}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val < 1) return;
                                        setFieldValue("cabin_temperature", e.target.value)}}
                                    error={touched.cabin_temperature && errors.cabin_temperature}
                                />
                                {/* <ErrorMessage
                                    name="cabin_temperature"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>
                        </div>
                    </ContainerCard>

                );

            case 5:
                return (
                    <ContainerCard>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>
                                <InputFields
                                required
                                    label="Work Status"
                                    name="work_status"
                                    disabled={isFieldDisabled("work_status")}
                                    value={values.work_status}
                                    options={[
                                        { value: "1", label: "Active" },
                                        { value: "0", label: "In Active" },
                                    ]}
                                    onChange={(e) => setFieldValue("work_status", e.target.value)}
                                    error={touched.work_status && errors.work_status}
                                />
                                {/* <ErrorMessage
                                    name="work_status"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            {renderFileInput(
                                "type_details_photo1",
                                "Type Details Photo 1",
                                values,
                                setFieldValue,
                                errors,
                                touched,
                                "image/*,.pdf"
                            )}

                            {renderFileInput(
                                "type_details_photo2",
                                "Type Details Photo 2",
                                values,
                                setFieldValue,
                                errors,
                                touched,
                                "image/*,.pdf"
                            )}

                            <div>
                                                                <InputFields
                                                                    required
                                                                    type="number"
                                                                    integerOnly
                                                                    min={1}
                                                                    max={10}
                                                                    label="Technical Behaviour Rating"
                                                                    name="technical_behavior"
                                                                    disabled={isFieldDisabled("technical_behavior")}
                                                                    value={values.technical_behavior}
                                                                    onChange={(e) => {
                                                                        const val = Number(e.target.value);
                                                                        if (val < 1 || val > 10) return;
                                                                        setFieldValue("technical_behavior", e.target.value);
                                                                    }}
                                                                    error={touched.technical_behavior && errors.technical_behavior}
                                                                />
                                {/* <ErrorMessage
                                    name="technical_behavior"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            <div>
                                <InputFields
                                required
                                type="number"
                                integerOnly
                                    label="Service Quality Rating"
                                    name="service_quality"
                                    min={1}
                                                                    max={10}
                                    disabled={isFieldDisabled("service_quality")}
                                    value={values.service_quality}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val < 1 || val > 10) return;
                                        setFieldValue("service_quality", e.target.value)}}
                                    error={touched.service_quality && errors.service_quality}
                                />
                                {/* <ErrorMessage
                                    name="service_quality"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            {renderFileInput(
                                "customer_signature",
                                "Customer Signature",
                                values,
                                setFieldValue,
                                errors,
                                touched,
                                "image/*,.pdf"
                            )}

                        </div>
                    </ContainerCard>
                );

            case 6:
                return (
                    <ContainerCard>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <InputFields
                                required
                                    label="Is Machine In Working"
                                    name="is_machine_in_working"
                                    disabled={isFieldDisabled("is_machine_in_working")}
                                    value={values.is_machine_in_working}
                                    options={[
                                        { value: "1", label: "Yes" },
                                        { value: "0", label: "No" },
                                    ]}
                                    onChange={(e) => setFieldValue("is_machine_in_working", e.target.value)}
                                    error={touched.is_machine_in_working && errors.is_machine_in_working}
                                />
                                {/* <ErrorMessage
                                    name="is_machine_in_working"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            <div>
                                <InputFields
                                required
                                    label="Cleanliness"
                                    name="cleanliness"
                                    disabled={isFieldDisabled("cleanliness")}
                                    value={values.cleanliness}
                                    options={[
                                        { value: "1", label: "Yes" },
                                        { value: "0", label: "No" },
                                    ]}
                                    onChange={(e) => setFieldValue("cleanliness", e.target.value)}
                                    error={touched.cleanliness && errors.cleanliness}
                                />
                                {/* <ErrorMessage
                                    name="cleanliness"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            <div>
                                <InputFields
                                required
                                    label="Condensor Coil Cleaned"
                                    name="condensor_coil_cleand"
                                    disabled={isFieldDisabled("condensor_coil_cleand")}
                                    value={values.condensor_coil_cleand}
                                    options={[
                                        { value: "1", label: "Yes" },
                                        { value: "0", label: "No" },
                                    ]}
                                    onChange={(e) => setFieldValue("condensor_coil_cleand", e.target.value)}
                                    error={touched.condensor_coil_cleand && errors.condensor_coil_cleand}
                                />
                                {/* <ErrorMessage
                                    name="condensor_coil_cleand"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            <div>
                                <InputFields
                                required
                                    label="Gaskets"
                                    name="gaskets"
                                    disabled={isFieldDisabled("gaskets")}
                                    value={values.gaskets}
                                    options={[
                                        { value: "1", label: "Yes" },
                                        { value: "0", label: "No" },
                                    ]}
                                    onChange={(e) => setFieldValue("gaskets", e.target.value)}
                                    error={touched.gaskets && errors.gaskets}
                                />
                                {/* <ErrorMessage
                                    name="gaskets"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            <div>
                                <InputFields
                                required
                                    label="Light Working"
                                    name="light_working"
                                    disabled={isFieldDisabled("light_working")}
                                    value={values.light_working}
                                    options={[
                                        { value: "1", label: "Yes" },
                                        { value: "0", label: "No" },
                                    ]}
                                    onChange={(e) => setFieldValue("light_working", e.target.value)}
                                    error={touched.light_working && errors.light_working}
                                />
                                {/* <ErrorMessage
                                    name="light_working"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            <div>
                                <InputFields
                                required
                                    label="Branding No"
                                    name="branding_no"
                                    disabled={isFieldDisabled("branding_no")}
                                    value={values.branding_no}
                                    options={[
                                        { value: "1", label: "Yes" },
                                        { value: "0", label: "No" },
                                    ]}
                                    onChange={(e) => setFieldValue("branding_no", e.target.value)}
                                    error={touched.branding_no && errors.branding_no}
                                />
                                {/* <ErrorMessage
                                    name="branding_no"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>
                            <div>
                                <InputFields
                                required
                                error={touched.propper_ventilation_available && errors.propper_ventilation_available}
                                    label="Proper Ventilation Available"
                                    name="propper_ventilation_available"
                                    disabled={isFieldDisabled("propper_ventilation_available")}
                                    value={values.propper_ventilation_available}
                                    options={[
                                        { value: "1", label: "Yes" },
                                        { value: "0", label: "No" },
                                    ]}
                                    onChange={(e) => setFieldValue("propper_ventilation_available", e.target.value)}
                                />
                                {/* <ErrorMessage
                                    name="propper_ventilation_available"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            <div>
                                <InputFields
                                required
                                    label="Leveling Positioning"
                                    name="leveling_positioning"
                                    disabled={isFieldDisabled("leveling_positioning")}
                                    value={values.leveling_positioning}
                                    options={[
                                        { value: "1", label: "Yes" },
                                        { value: "0", label: "No" },
                                    ]}
                                    onChange={(e) => setFieldValue("leveling_positioning", e.target.value)}
                                    error={touched.leveling_positioning && errors.leveling_positioning}
                                />
                                {/* <ErrorMessage
                                    name="leveling_positioning"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            <div>
                                <InputFields
                                required
                                    label="Stock Availability In"
                                    name="stock_availability_in"
                                    disabled={isFieldDisabled("stock_availability_in")}
                                    value={values.stock_availability_in}
                                    options={[
                                        { value: "1", label: "Yes" },
                                        { value: "0", label: "No" },
                                    ]}
                                    onChange={(e) => setFieldValue("stock_availability_in", e.target.value)}
                                    error={touched.stock_availability_in && errors.stock_availability_in}
                                />
                                {/* <ErrorMessage
                                    name="stock_availability_in"
                                    component="div"
                                    className="text-sm text-red-600 mb-1"
                                /> */}
                            </div>

                            {renderFileInput(
                                "is_machine_in_working_img",
                                "Is Machine In Working",
                                values,
                                setFieldValue,
                                errors,
                                touched,
                                "image/*,.pdf"
                            )}

                            {renderFileInput(
                                "cleanliness_img",
                                "Cleanliness",
                                values,
                                setFieldValue,
                                errors,
                                touched,
                                "image/*,.pdf"
                            )}

                            {renderFileInput(
                                "condensor_coil_cleand_img",
                                "Condensor Coil Cleaned",
                                values,
                                setFieldValue,
                                errors,
                                touched,
                                "image/*,.pdf"
                            )}

                            {renderFileInput(
                                "stock_availability_in_img",
                                "Stock Availability In",
                                values,
                                setFieldValue,
                                errors,
                                touched,
                                "image/*,.pdf"
                            )}

                            {renderFileInput(
                                "cooler_image",
                                "Cooler",
                                values,
                                setFieldValue,
                                errors,
                                touched,
                                "image/*,.pdf"
                            )}

                            {renderFileInput(
                                "cooler_image2",
                                "Cooler 2",
                                values,
                                setFieldValue,
                                errors,
                                touched,
                                "image/*,.pdf"
                            )}


                        </div>
                    </ContainerCard>
                );

            default:
                return null;
        }
    };

     if (isEditMode && loading) {
        return (
          <div className="flex w-full h-full items-center justify-center">
            <Loading />
          </div>
        );
      }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/serviceVisit" back>
                        <Icon icon="lucide:arrow-left" width={24} />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">
                        {isEditMode ? "Update Service Visit" : "Add Service Visit"}
                    </h1>
                </div>
            </div>

            <Formik
                initialValues={existingData || initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize={true}
            >
                {({
                    values,
                    setFieldValue,
                    errors,
                    touched,
                    setErrors,
                    setTouched,
                    isSubmitting: formikSubmitting,
                }) => (
                    <Form>
                        <StepperForm
                            steps={steps.map((step) => ({
                                ...step,
                                isCompleted: isStepCompleted(step.id),
                            }))}
                            currentStep={currentStep}
                            onStepClick={() => { }}
                            onBack={prevStep}
                            onNext={() =>
                                handleNext(values, {
                                    setErrors,
                                    setTouched,
                                } as unknown as FormikHelpers<ServiceVisit>)
                            }
                            onSubmit={() => handleSubmit(values)}
                            showSubmitButton={isLastStep}
                            showNextButton={!isLastStep}
                            nextButtonText="Save & Next"
                            submitButtonText={
                                isSubmitting
                                    ? isEditMode
                                        ? "Updating..."
                                        : "Submitting..."
                                    : isEditMode
                                        ? "Update"
                                        : "Submit"
                            }
                        >
                            {renderStepContent(values, setFieldValue, errors, touched)}
                        </StepperForm>
                    </Form>
                )}
            </Formik>
        </div>
    );
}
