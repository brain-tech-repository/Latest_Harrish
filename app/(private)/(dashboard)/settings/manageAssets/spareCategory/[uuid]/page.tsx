"use client";

import { useRouter, useParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSnackbar } from "@/app/services/snackbarContext";
import InputFields from "@/app/components/inputFields";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import { Icon } from "@iconify-icon/react";
import { addSpare, updateSpare, spareByID } from "@/app/services/assetsApi";
import { useEffect, useRef, useState } from "react";
import { useLoading } from "@/app/services/loadingContext";
import { genearateCode, saveFinalCode } from "@/app/services/allApi";
import ContainerCard from "@/app/components/containerCard";
import Loading from "@/app/components/Loading";
import Link from "@/app/components/smartLink";

/* ---------------- VALIDATION ---------------- */
const validationSchema = Yup.object({
  spare_category_name: Yup.string()
    .trim()
    .required("Spare name is required")
    .max(100, "Name cannot exceed 100 characters"),

  status: Yup.number()
    .required("Status is required")
    .oneOf([0, 1]),
});

export default function AddEditSpare() {
  const { showSnackbar } = useSnackbar();
  const { setLoading } = useLoading();
  const router = useRouter();
  const params = useParams();

  /* -------- UUID HANDLING -------- */
  const uuid =
    typeof params.uuid === "string" ? params.uuid : String(params.uuid);

  const isAddMode = uuid === "add";
  const isEditMode = !isAddMode;

  const [localLoading, setLocalLoading] = useState(false);
  const codeGeneratedRef = useRef(false);

  /* ---------------- FORM ---------------- */
  const formik = useFormik({
    initialValues: {
      osa_code: "",
      spare_category_name: "",
      status: 1,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setLoading(true);

      const payload = {
        osa_code: values.osa_code,
        spare_category_name: values.spare_category_name,
        status: Number(values.status),
      };

      try {
        let res;

        if (isEditMode) {
          res = await updateSpare(uuid, payload as any);
        } else {
          res = await addSpare(payload as any);
        }

        if (res?.error) {
          showSnackbar(res?.data?.message || "Failed to save spare", "error");
          return;
        }

        showSnackbar(
          isEditMode ? "Spare Category updated successfully" : "Spare Category added successfully",
          "success"
        );

        if (isAddMode) {
          await saveFinalCode({
            reserved_code: values.osa_code,
            model_name: "spare",
          });
        }

        resetForm();
        router.push("/settings/manageAssets/spareCategory");
      } catch {
        showSnackbar("Something went wrong", "error");
      } finally {
        setSubmitting(false);
        setLoading(false);
      }
    },
  });

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    const loadData = async () => {
      // EDIT MODE → fetch by UUID
      if (isEditMode) {
        setLocalLoading(true);
        try {
          const res = await spareByID(uuid);
          if (res?.data) {
            formik.setValues({
              osa_code: res.data.osa_code ?? "",
              spare_category_name: res.data.spare_category_name ?? "",
              status: res.data.status ?? 1,
            });
          }
        } catch {
          showSnackbar("Failed to fetch spare details", "error");
        } finally {
          setLocalLoading(false);
        }
      }

      // ADD MODE → generate code
      if (isAddMode && !codeGeneratedRef.current) {
        codeGeneratedRef.current = true;
        try {
          const res = await genearateCode({ model_name: "spare" });
          if (res?.code) {
            formik.setFieldValue("osa_code", res.code);
          }
        } catch {
          showSnackbar("Failed to generate spare code", "error");
        }
      }
    };

    loadData();
  }, [uuid]);

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings/manageAssets/spareCategory" back>
          <Icon icon="lucide:arrow-left" width={24} />
        </Link>
        <h1 className="text-xl font-semibold">
          {isEditMode ? "Update Spare Category" : "Add Spare Category"}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        {localLoading ? (
          <Loading />
        ) : (
          <form onSubmit={formik.handleSubmit}>
            <ContainerCard>
              <h2 className="text-lg font-semibold mb-6">Spare Category Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputFields
                  label="Code"
                  name="osa_code"
                  value={formik.values.osa_code}
                  onChange={formik.handleChange}
                  disabled
                  error={formik.touched.osa_code && formik.errors.osa_code}
                />

                <InputFields
                  label="Spare Category Name"
                  name="spare_category_name"
                  value={formik.values.spare_category_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.spare_category_name &&
                    formik.errors.spare_category_name
                  }
                />

                <InputFields
                  label="Status"
                  type="radio"
                  name="status"
                  value={formik.values.status.toString()}
                  onChange={formik.handleChange}
                  options={[
                    { value: "1", label: "Active" },
                    { value: "0", label: "Inactive" },
                  ]}
                  error={formik.touched.status && formik.errors.status}
                />
              </div>
            </ContainerCard>

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
