"use client";

import Table, {
  listReturnType,
  searchReturnType,
  TableDataType,
} from "@/app/components/customTable";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import StatusBtn from "@/app/components/statusBtn2";
import {
  assignWorkFlowsToSubmenu,
  submenuList,
  updateWorkFlowsToSubmenu,
  workFlowAssignList,
  workFlowAssignmentList,
  workFlowAssignmentStatusChange,
  workFlowList,
  workFlowProcessType,
  workFlowRequest,
} from "@/app/services/allApi";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useEffect, useState } from "react";
import InputFields from "@/app/components/inputFields";
import { Icon } from "@iconify-icon/react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/app/services/snackbarContext";
import ToggleButton from "@mui/material/ToggleButton";
import Toggle from "@/app/components/toggle";
import Link from "@/app/components/smartLink";

// ---- Your JSON pasted here ----
// const WORKFLOW_DATA:any = [
//     {
//         workflow_id: 6,
//         name: "tested",
//         description: "sdfdsf",
//         is_active: true,
//         steps: [
//             {
//                 id: 12,
//                 step_order: 1,
//                 title: "Step 1",
//                 approval_type: "AND",
//                 message: "dfsf",
//                 notification: "sfdf",
//                 approvers: [
//                     { type: "ROLE", role_id: 81 },
//                     { type: "ROLE", role_id: 82 },
//                     { type: "ROLE", role_id: 85 },
//                     { type: "ROLE", role_id: 86 },
//                     { type: "ROLE", role_id: 87 },
//                     { type: "ROLE", role_id: 1 },
//                     { type: "ROLE", role_id: 84 },
//                     { type: "ROLE", role_id: 83 },
//                     { type: "ROLE", role_id: 88 },
//                     { type: "ROLE", role_id: 89 }
//                 ]
//             },
//             {
//                 id: 13,
//                 step_order: 2,
//                 title: "Step 2",
//                 approval_type: "OR",
//                 message: "asdasdds",
//                 notification: "asddsa",
//                 approvers: [
//                     { type: "USER", user_id: 43, name: "Role Test Data" }
//                 ]
//             }
//         ]
//     },
//     {
//         workflow_id: 5,
//         name: "Test AND-OR Flow",
//         description: "Flow to test AND/OR/return/skip/reassign",
//         is_active: true,
//         steps: [
//             {
//                 id: 9,
//                 step_order: 1,
//                 title: "Team Review",
//                 approval_type: "OR",
//                 message: "Team can review",
//                 notification: "Review pending",
//                 approvers: [
//                     { type: "USER", user_id: 5, name: "Amit" },
//                     { type: "USER", user_id: 6, name: "Amit" }
//                 ]
//             },
//             {
//                 id: 10,
//                 step_order: 2,
//                 title: "Finance Approval",
//                 approval_type: "AND",
//                 message: "Finance must approve",
//                 notification: "Finance approval required",
//                 approvers: [
//                     { type: "USER", user_id: 38, name: "Sales Person 1" },
//                     { type: "USER", user_id: 33, name: "annodiya" }
//                 ]
//             },
//             {
//                 id: 11,
//                 step_order: 3,
//                 title: "Final Signoff",
//                 approval_type: "OR",
//                 message: "Final signoff",
//                 notification: null,
//                 approvers: [
//                     { type: "USER", user_id: 6, name: "Amit" },
//                     { type: "ROLE", role_id: 1 }
//                 ]
//             }
//         ]
//     }
// ];

// -----------------------------------------------

export default function WorkflowTable() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);
  const { showSnackbar } = useSnackbar();
  const [workFlowListOptions, setWorkflowListOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [modulesList, setModulesList] = useState<any>([]);
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      id: "",
      workflow_id: "",
      process_type: "",
      // process_id: "",
    },

    validationSchema: Yup.object({
      workflow_id: Yup.string().required("Workflow is required"),
      process_type: Yup.string().required("Process Type is required"),
      //   process_id: Yup.string().required("Process ID is required"),
    }),

    onSubmit: async (values) => {
    
      //   const workflowType = modulesList.filter(
      //     (ids: any) => ids.value == values.process_type
      //   )[0]?.label;

      let data;
      if (values.id) {
        data = await updateWorkFlowsToSubmenu({
          ...values,
          process_type: values.process_type,
        });
      } else {
        data = await assignWorkFlowsToSubmenu({
          ...values,
          process_type: values.process_type,
        });
      }

      if (data.error) {
        showSnackbar(data.message || "Something went wrong","error");
        throw new Error(data.message || "Something went wrong");
      }
      showSnackbar(data.message || "Workflow assigned successfully", "success");
      formik.resetForm();
      setOpen(false);
      setRefreshKey((prev) => prev + 1);
    },
  });

  useEffect(() => {
    const fetchWorkflowList = async () => {
      try {
        const res = await workFlowList();
        const workflowListData: { value: string; label: string }[] = [];
        res.data.map((item: { workflow_id: string; name: string }) => {
          workflowListData.push({
            value: item.workflow_id.toString(),
            label: item.name,
          });
        });
        setWorkflowListOptions(workflowListData);
      } catch (err) {}
    };
    fetchWorkflowList();
  }, []);

  useEffect(() => {
    const fetchSubmenuList = async () => {
      try {
        const res = await workFlowProcessType();
        const subMenuListDta: { value: string; label: string }[] = [];
        res.data.map((item: { process_type: string; display_name: string }) => {
          subMenuListDta.push({
            value: item.process_type.toString(),
            label: item.display_name,
          });
        });
        setModulesList(subMenuListDta);
      } catch (err) {}
    };
    fetchSubmenuList();
  }, []);

  // ------------------ COLUMNS --------------------
  const columns = [
    {
      key: "workflow_name",
      label: "Workflow Name",
    },
    {
      key: "display_name",
      label: "Assigned To",
    },
    {
      key: "is_active",
      label: "Status",
      render: (row: TableDataType) => {
        async function handleClick() {
          const res = await workFlowAssignmentStatusChange({
            process_type: row.process_type,
            workflow_id: row.workflow_id,
            is_active: row.is_active === true ? false : true
          });
          if (res.error) {
            showSnackbar(res.message || "Something went wrong","error");
            return;
          }
          showSnackbar(res.message || "Status updated successfully", "success");
          setRefreshKey((prev) => prev + 1);
        }
        return <div className="cursor-pointer select-none">
          <Toggle isChecked={row.is_active === true} onChange={handleClick} />
        </div>
    }}
  ];

  // ------------------ LOCAL LIST FUNCTION -----------------
  const fetchWorkflows = async (
    pageNo: number = 1,
    pageSize: number = 10
  ): Promise<listReturnType> => {
    const start = (pageNo - 1) * pageSize;
    const end = start + pageSize;

    // WORKFLOW_DATA.slice(start, end);
    const pageData: any = await workFlowAssignmentList();

    return {
      data: pageData.data,
      currentPage: 1,
      pageSize: 50,
      total: 1,
    };
  };
  // ------------------ SEARCH FUNCTION ----------------------
  // const searchWorkflow = async (
  //     query: string
  // ): Promise<searchReturnType> => {
  //     const filtered = WORKFLOW_DATA.filter((item) =>
  //         item.name.toLowerCase().includes(query.toLowerCase())
  //     );

  //     return {
  //         data: filtered,
  //         total: 1,
  //         currentPage: 1,
  //         pageSize: filtered.length,
  //     };
  // };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-[20px]">
        <div className="flex items-center gap-[16px]">
          <Link href="/settings/approval" back><Icon
            icon="lucide:arrow-left"
            width={24}
          /></Link>
          <h1 className="text-[20px] font-semibold text-[#181D27] flex items-center leading-[30px]">
            Assign Workflow
          </h1>
        </div>
      </div>
      <Table
        refreshKey={refreshKey}
        config={{
          api: {
            list: fetchWorkflows,
            // search: searchWorkflow,
          },
          header: {
            // title: "Assign Workflow",
            // searchBar: true,
            columnFilter: true,
            actions: [
              <SidebarBtn
                key={0}
                onClick={() => setOpen(true)}
                isActive={true}
                leadingIcon="lucide:plus"
                label="Add"
                labelTw="hidden sm:block"
              />,
            ],
          },
          localStorageKey: "workflow-table",
          footer: {
            nextPrevBtn: true,
            pagination: true,
          },
          columns,
          rowSelection: true,
          rowActions: [
            {
              icon: "lucide:edit-2",
              onClick: (row: TableDataType) => {
                formik.setFieldValue("workflow_id", String(row.workflow_id));
                formik.setFieldValue("process_type", String(row.process_type));
                formik.setFieldValue("id", String(row.id));
                setOpen(true);
              },
            },
          ],
          pageSize: 10,
        }}
      />

      <Drawer
        anchor="right"
        open={open}
        onClose={() => {
          setOpen(false);
          formik.resetForm();
        }}
      >
        <div className="w-[350px] p-2.5 text-lg font-semibold">
          Assign Workflow
        </div>

        <Divider />

        <div className="w-[350px] p-2.5">
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Workflow */}
            <InputFields
              required
              label="Workflow"
              name="workflow_id"
              isSingle={true}
              options={workFlowListOptions}
              value={formik.values.workflow_id}
              onChange={(e: any) => {
                formik.setFieldValue("workflow_id", e.target.value);
              }}
              error={formik.touched.workflow_id && formik.errors.workflow_id}
              width="full"
            />

            {/* Process Type */}
            <InputFields
              required
              label="Process Type"
              name="process_type"
              isSingle={true}
              options={modulesList}
              value={formik.values.process_type}
              onChange={(e: any) => {
                formik.setFieldValue("process_type", e.target.value);
              }}
              error={formik.touched.process_type && formik.errors.process_type}
              width="full"
            />

            {/* Process ID */}
            {/* <InputFields
                required
                label="Process ID"
                name="process_id"
                type="number"
                value={formik.values.process_id}
                onChange={(e: any) =>
                    formik.setFieldValue("process_id", e.target.value)
                }
                error={formik.touched.process_id && formik.errors.process_id}
                width="full"
            /> */}

            <SidebarBtn
              label={formik.isSubmitting ? "Submitting..." : "Submit"}
              isActive={!formik.isSubmitting}
              leadingIcon="mdi:check"
              type="submit"
              disabled={formik.isSubmitting}
            />
          </form>
        </div>
      </Drawer>
    </div>
  );
}
