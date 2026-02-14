"use client";
import { useRouter, useParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSnackbar } from "@/app/services/snackbarContext";
import InputFields from "@/app/components/inputFields";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import { Icon } from "@iconify-icon/react";
import { spareCategory } from "@/app/services/assetsApi";
import { addSub, updateSub, subByID } from "@/app/services/assetsApi";
import { use, useEffect, useRef, useState } from "react";
import { useLoading } from "@/app/services/loadingContext";
import { genearateCode, saveFinalCode } from "@/app/services/allApi";
import IconButton from "@/app/components/iconButton";
import SettingPopUp from "@/app/components/settingPopUp";
import ContainerCard from "@/app/components/containerCard";
import Loading from "@/app/components/Loading";
import Category from "../../../promotionTypes/page";
import { useAllDropdownListData } from "@/app/components/contexts/allDropdownListData";
import Link from "@/app/components/smartLink";
const validationSchema = Yup.object().shape({
  spare_subcategory_name: Yup.string()
    .trim()
    .required("Sub name is required")
    .max(100, "Name cannot exceed 100 characters"),

  spare_category_id: Yup.string()
    .trim()
    .required("SpareCategoryName number is required")
    .max(100, "SpareCategoryName cannot exceed 100 characters"),

  status: Yup.number()
    .required("Status is required")
    .oneOf([0, 1], "Status must be 0 (Inactive) or 1 (Active)"),
});

export default function AddEditSub() {
  const { showSnackbar } = useSnackbar();
  const { setLoading } = useLoading();
  const router = useRouter();
  const params = useParams();

  // Safely extract uuid
  const uuid =
    typeof params.uuid === "string" ? params.uuid : String(params.uuid);

  const isAddMode = uuid === "add" || !uuid;
  const isEditMode = !isAddMode && Boolean(uuid);

  // Local state
  const [isOpen, setIsOpen] = useState(false);
  const [codeMode, setCodeMode] = useState<"auto" | "manual">("auto");
  const [prefix, setPrefix] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const codeGeneratedRef = useRef(false);

  const { spareCategoryOptions, ensureSpareCategoryLoaded } =
    useAllDropdownListData();

  useEffect(() => {
    ensureSpareCategoryLoaded();
  }, []);

  // ✅ Formik setup
  const formik = useFormik({
    initialValues: {
      osa_code: "",
      spare_subcategory_name: "",
      spare_category_id: "",
      status: 1,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setLoading(true);
      const payload = {
        osa_code: values.osa_code,
        spare_subcategory_name: values.spare_subcategory_name,
        spare_category_id: values.spare_category_id,
        status: Number(values.status),
      };

      if (!isEditMode) {
        payload.osa_code = values.osa_code;
      }

      try {
        let res;
        if (isEditMode) {
          res = await updateSub(uuid, payload as any);
        } else {
          res = await addSub(payload as any);
        }

        if (res?.error) {
          showSnackbar(res?.data?.message || "Failed to save Sub", "error");
        } else {
          showSnackbar(
            res?.message ||
              (isEditMode
                ? "sub updated successfully"
                : "sub added successfully"),
            "success"
          );
          if (!isEditMode) {
            try {
              await saveFinalCode({
                reserved_code: values.osa_code,
                model_name: "sub",
              });
            } catch (e) {
              console.warn("Code finalization failed:", e);
            }
          }

          resetForm();
          router.push("/settings/manageAssets/spareSubCategory");
        }
      } catch (error) {
        showSnackbar("Something went wrong", "error");
      } finally {
        setSubmitting(false);
        setLoading(false);
      }
    },
  });
  // ✅ Load data in edit mode / generate code in add mode
  useEffect(() => {
    const fetchSubOrGenerateCode = async () => {
      if (isEditMode) {
        setLocalLoading(true);
        try {
          const res = await subByID(uuid);
          if (res?.data) {
            formik.setValues({
              osa_code: res.data.osa_code || "",
              spare_subcategory_name: res.data.spare_subcategory_name || "",
              spare_category_id: String(res.data.spare_category_id) || "",
              status: res.data.status ?? 1,
            });
          }
        } catch {
          showSnackbar("Failed to fetch sub details", "error");
        } finally {
          setLocalLoading(false);
        }
      } else if (!codeGeneratedRef.current) {
        codeGeneratedRef.current = true;
        try {
          const res = await genearateCode({ model_name: "sub" });
          if (res?.code) {
            formik.setFieldValue("sub_code", res.code);
          }
          if (res?.prefix) setPrefix(res.prefix);
        } catch {
          showSnackbar("Failed to generate sub code", "error");
        }
      }
    };
    fetchSubOrGenerateCode();
  }, [uuid]);
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings/manageAssets/spareSubCategory" back>
          <Icon icon="lucide:arrow-left" width={24} />
        </Link>
        <h1 className="text-xl font-semibold">
          {isEditMode ? "Update Sub" : "Add Sub"}
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow p-6">
        {localLoading ? (
          <Loading />
        ) : (
          <form onSubmit={formik.handleSubmit}>
            <ContainerCard>
              <h2 className="text-lg font-semibold mb-6">Spare Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* sub Code */}
                <div>
                  <InputFields
                    label="Code"
                    name="osa_code"
                    value={formik.values.osa_code}
                    onChange={formik.handleChange}
                    disabled={isEditMode || codeMode === "auto"}
                    error={formik.touched.osa_code && formik.errors.osa_code}
                  />
                </div>

                {/* Sub Name */}
                <InputFields
                  label="Spare SubCategory Name"
                  type="text"
                  name="spare_subcategory_name"
                  value={formik.values.spare_subcategory_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.spare_subcategory_name &&
                    formik.errors.spare_subcategory_name
                      ? formik.errors.spare_subcategory_name
                      : ""
                  }
                />

                {/* spare subCategory name */}
                <InputFields
                  label="Spare Category"
                  type="select"
                  name="spare_category_id" // ✅ REQUIRED
                  options={spareCategoryOptions}
                  value={formik.values.spare_category_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.spare_category_id &&
                    formik.errors.spare_category_id
                      ? formik.errors.spare_category_id
                      : ""
                  }
                />

                {/* Status */}
                <InputFields
                  label="Status"
                  type="radio"
                  name="status"
                  value={formik.values.status.toString()}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  options={[
                    { value: "1", label: "Active" },
                    { value: "0", label: "Inactive" },
                  ]}
                  error={
                    formik.touched.status && formik.errors.status
                      ? formik.errors.status
                      : ""
                  }
                />
              </div>
            </ContainerCard>

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                className="px-4 py-2 border rounded-lg"
                onClick={() => router.back()}
              >
                Cancel
              </button>
              <SidebarBtn
                type="submit"
                label={isEditMode ? "Update" : "Submit"}
                isActive
                leadingIcon="mdi:check"
                disabled={formik.isSubmitting}
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
