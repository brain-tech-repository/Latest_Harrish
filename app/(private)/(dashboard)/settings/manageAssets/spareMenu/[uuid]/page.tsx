"use client";

import { useRouter, useParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@iconify-icon/react";

import InputFields from "@/app/components/inputFields";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import ContainerCard from "@/app/components/containerCard";
import Loading from "@/app/components/Loading";

import { useSnackbar } from "@/app/services/snackbarContext";
import { useLoading } from "@/app/services/loadingContext";

import {
  spareCategoryList,
  spareSubCategoryList,
  addSpareName,
  updateSpareName,
  spareNameByID,
} from "@/app/services/assetsApi";

import { genearateCode, saveFinalCode } from "@/app/services/allApi";
import Link from "@/app/components/smartLink";

/* -------------------- VALIDATION -------------------- */
const validationSchema = Yup.object({
  spare_name: Yup.string()
    .trim()
    .required("Spare name is required")
    .max(100),

  spare_categoryid: Yup.string().required("Spare category is required"),

  spare_subcategoryid: Yup.string().required("Spare sub category is required"),

  plant: Yup.string().trim().required("Plant is required").max(100),

  status: Yup.number().oneOf([0, 1]).required(),
});

/* -------------------- COMPONENT -------------------- */
export default function AddEditSub() {
  const router = useRouter();
  const params = useParams();
  const { showSnackbar } = useSnackbar();
  const { setLoading } = useLoading();

  const uuid = typeof params.uuid === "string" ? params.uuid : "";
  const isEditMode = uuid && uuid !== "add";

  const codeGeneratedRef = useRef(false);
   const [prefix, setPrefix] = useState("");

  const [localLoading, setLocalLoading] = useState(false);
  const [spareCategories, setSpareCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [spareSubCategories, setSpareSubCategories] = useState<
    { value: string; label: string }[]
  >([]);
   const [initialValues, setInitialValues] = useState<any>({});

  /* -------------------- FORM -------------------- */
  const formik = useFormik({
    initialValues: {
      osa_code: "",
      spare_name: "",
      spare_categoryid: "",
      spare_subcategoryid: "",
      plant: "",
      status: 1,
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        const payload = {
          ...values,
          status: Number(values.status),
        };

        const res = isEditMode
          ? await updateSpareName(uuid, payload as any)
          : await addSpareName(payload as any);

        if (res?.error) {
          showSnackbar(res?.message || "Failed to save", "error");
          return;
        }

        showSnackbar(
          isEditMode ? "Sub updated successfully" : "Sub added successfully",
          "success"
        );

        if (!isEditMode) {
          await saveFinalCode({
            reserved_code: values.osa_code,
            model_name: "spa_cat",
          });
        }

        resetForm();
        router.push("/settings/manageAssets/spareMenu");
      } catch (err) {
        showSnackbar("Something went wrong", "error");
      } finally {
        setLoading(false);
      }
    },
  });

  /* -------------------- LOAD CATEGORIES -------------------- */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await spareCategoryList({});
        const options =
          res?.data?.map((c: any) => ({
            value: String(c.id),
            label: c.spare_category_name,
          })) || [];
        setSpareCategories(options);
      } catch {
        setSpareCategories([]);
      }
    };
    fetchCategories();
  }, []);

  /* -------------------- LOAD SUB CATEGORIES -------------------- */
  const fetchSubCategories = async (categoryId: string) => {
    try {
      const res = await spareSubCategoryList({ category_id: categoryId});
      const options =
        res?.data?.map((sc: any) => ({
          value: String(sc.id),
          label: sc.spare_subcategory_name,
        })) || [];
      setSpareSubCategories(options);
    } catch {
      setSpareSubCategories([]);
    }
  };

  /* -------------------- EDIT MODE / CODE GEN -------------------- */
  useEffect(() => {
    const loadData = async () => {
      if (isEditMode) {
        setLocalLoading(true);
        try {
          const res = await spareNameByID(uuid);
          const d = res?.data;

          if (d) {
            formik.setValues({
              osa_code: d.osa_code ?? "",
              spare_name: d.spare_menu ?? "",
              spare_categoryid: String(d.spare_category_id),
              spare_subcategoryid: String(d.spare_subcategory_id),
              plant: d.plant ?? "",
              status: d.status ?? 1,
            });

            await fetchSubCategories(String(d.spare_category_id));
          }
        } catch {
          showSnackbar("Failed to load details", "error");
        } finally {
          setLocalLoading(false);
        }
       
      
      } else if (!codeGeneratedRef.current) {
        codeGeneratedRef.current = true;
        try {
          
          const res = await genearateCode({ model_name: "spa_cat" });
          if (res?.code) {  
            formik.setFieldValue("osa_code", res.code);
          }
            // formik.setFieldValue("spa_cat", res.code);
          
        } catch {
          showSnackbar("Failed to generate code", "error");
        }
      }
    };

    loadData();
  }, [uuid]);
  //changes

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      // run only once
      if (!codeGeneratedRef.current) {
        codeGeneratedRef.current = true;

        const res = await genearateCode({ model_name: "spa_cat" });
        if (res?.code) {
          setInitialValues((prev:any) => ({
            ...prev,
            spare_category_code: res.code,
          }));
        }

        if (res?.prefix) {
          setPrefix(res.prefix);
        }
      }
    } catch (err) {
      console.error("Error generating code", err);
      showSnackbar("Failed to generate code", "error");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [showSnackbar]);


// ++++++++++++++++++++++++++++++++++++++++++++++++

// useEffect(() => {
//   const loadData = async () => {
//     try {
//       setLocalLoading(true);

//       // 🟡 EDIT MODE
//       if (isEditMode) {
//         const res = await subByID(uuid);
//         const d = res?.data;

//         if (d) {
//           formik.setValues({
//             osa_code: d.osa_code ?? "",
//             spare_name: d.spare_menu ?? "",
//             spare_categoryid: String(d.spare_category_id),
//             spare_subcategoryid: String(d.spare_subcategory_id),
//             plant: d.plant ?? "",
//             status: d.status ?? 1,
//           });

//           await fetchSubCategories(String(d.spare_category_id));

//           // ✅ EDIT MODE me bhi code generate
//           // but ONLY if backend ne code nahi diya
//           if (!d.osa_code) {
//             const codeRes = await genearateCode({ model_name: "spa_cat" });
//             if (codeRes?.code) {
//               formik.setFieldValue("osa_code", codeRes.code);
//             }
//           }
//         }
//       }

//       // 🟢 ADD MODE
//       else {
//         const res = await genearateCode({ model_name: "spa_cat" });
//         if (res?.code) {
//           formik.setFieldValue("osa_code", res.code);
//         }
//         if (res?.prefix) {
//           setPrefix(res.prefix);
//         }
//       }
//     } catch (err) {
//       showSnackbar("Failed to load data / generate code", "error");
//     } finally {
//       setLocalLoading(false);
//     }
//   };

//   loadData();
// }, [uuid]);






  /* -------------------- UI -------------------- */
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="../spareMenu" back>
          <Icon icon="lucide:arrow-left" width={24} />
        </Link>
        <h1 className="text-xl font-semibold">
          {isEditMode ? "Update Spare Menu" : "Add Spare Menu"}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        {localLoading ? (
          <Loading />
        ) : (
          <form onSubmit={formik.handleSubmit}>
            <ContainerCard>
              <h2 className="text-lg font-semibold mb-6">Spare Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputFields
                  label="Code"
                  name="osa_code"
                  value={formik.values.osa_code}
                  onChange={formik.handleChange}
                   disabled={isEditMode?true:false}
                />

                <InputFields
                  label="Spare Name"
                  name="spare_name"
                  value={formik.values.spare_name}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.spare_name &&
                    formik.errors.spare_name
                  }
                />

                <InputFields
                  label="Spare Category"
                  type="select"
                  name="spare_categoryid"
                  options={spareCategories}
                  value={formik.values.spare_categoryid}
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    formik.setFieldValue("spare_categoryid", categoryId);
                    formik.setFieldValue("spare_subcategoryid", "");
                    fetchSubCategories(categoryId);
                  }}
                />

                <InputFields
                  label="Spare Sub Category"
                  type="select"
                  name="spare_subcategoryid"
                  options={spareSubCategories}
                  value={formik.values.spare_subcategoryid}
                  onChange={formik.handleChange}
                />

                <InputFields
                  label="Plant"
                  name="plant"
                  value={formik.values.plant}
                  onChange={formik.handleChange}
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