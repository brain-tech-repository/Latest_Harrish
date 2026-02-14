"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify-icon/react";

import ContainerCard from "@/app/components/containerCard";
import InputFields from "@/app/components/inputFields";
import RichTextEditor from "@/app/components/RichTextEditor";
import Link from "@/app/components/smartLink";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import { authUserList } from "@/app/services/allApi";
import { createTicket } from "@/app/services/callCenterApi";
import { useSnackbar } from "@/app/services/snackbarContext";

type OptionType = { value: string; label: string };

interface User {
    id: string | number;
    name: string;
}

interface TicketForm {
    title: string;
    description: string;
    deviceDetail: string;
    userId: string;
    attachment: File | null;
    issueType: string;
    severity: string;
    priority: string;
    status: string;
}

export default function AddTicket() {
    const router = useRouter();
    const { showSnackbar } = useSnackbar();

    const [userOptions, setUserOptions] = useState<OptionType[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState<TicketForm>({
        title: "",
        description: "",
        deviceDetail: "",
        userId: "",
        attachment: null,
        issueType: "",
        severity: "",
        priority: "",
        status: "",
    });

    /* =========================
        Detect Device Detail
    ========================= */
    useEffect(() => {
        const getDeviceDetail = () => {
            const ua = navigator.userAgent;
            const platform = navigator.platform;

            let os = "Unknown OS";
            if (platform.includes("Win")) os = "Windows";
            else if (platform.includes("Mac")) os = "macOS";
            else if (platform.includes("Linux")) os = "Linux";

            let browser = "Unknown Browser";
            if (ua.includes("Chrome")) browser = "Chrome";
            else if (ua.includes("Firefox")) browser = "Firefox";
            else if (ua.includes("Safari") && !ua.includes("Chrome"))
                browser = "Safari";
            else if (ua.includes("Edg")) browser = "Edge";

            return `${os}, ${browser}`;
        };

        setForm((prev) => ({
            ...prev,
            deviceDetail: getDeviceDetail(),
        }));
    }, []);

    /* =========================
        Fetch Users
    ========================= */
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await authUserList({});
                const users: OptionType[] = (res?.data ?? []).map((user: User) => ({
                    value: String(user.id),
                    label: user.name,
                }));
                setUserOptions(users);
            } catch (error) {
                console.error("User fetch failed", error);
            }
        };

        fetchUsers();
    }, []);

    /* =========================
        Handlers
    ========================= */
    const handleChange = (name: keyof TicketForm, value: any) => {
        setForm((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("description", form.description);
            formData.append("device_detail", form.deviceDetail);
            formData.append("issue_type", form.issueType);
            formData.append("priority", form.priority);
            formData.append("severity", form.severity);
            formData.append("user_id", form.userId);
            formData.append("status", form.status);
            if (form.attachment) {
                formData.append("attachment", form.attachment);
            } else {
                formData.append("attachment", "");
            }


            // 🔌 API call
            await createTicket(formData);
            router.push("/ticketManagement");
            showSnackbar("Ticket added successfully", "success");
        } catch (error) {
            console.error("Submit failed", error);
            showSnackbar("Submit failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    /* =========================
        UI
    ========================= */
    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/ticketManagement" back>
                        <Icon icon="lucide:arrow-left" width={22} />
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Add Issue
                    </h1>
                </div>
            </div>

            <ContainerCard>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputFields
                        required
                        label="Title"
                        value={form.title}
                        onChange={(e: any) =>
                            handleChange("title", e.target.value)
                        }
                    />

                    <InputFields
                        type="file"
                        label="Attachment"
                        onChange={(e: any) =>
                            handleChange("attachment", e.target.files?.[0] ?? null)
                        }
                    />

                    <InputFields
                        required
                        searchable
                        label="Issue Type"
                        type="select"
                        value={form.issueType}
                        onChange={(e: any) =>
                            handleChange("issueType", e.target.value)
                        }
                        options={[
                            { value: "1", label: "Bug" },
                            { value: "2", label: "Observation" },
                            { value: "3", label: "Question" },
                            { value: "4", label: "Suggestion" },
                            { value: "5", label: "Improvement" },
                            { value: "6", label: "New Feature" },
                        ]}
                    />

                    <div className=" max-w-[500px]">
                        <RichTextEditor
                            required
                            label="Description"
                            value={form.description}
                            onChange={(value) =>
                                handleChange("description", value)
                            }
                            placeholder="Enter description..."
                        />
                    </div>

                    <InputFields
                        required
                        searchable
                        label="Assigned To"
                        value={form.userId}
                        options={userOptions}
                        onChange={(e: any) =>
                            handleChange("userId", e.target.value)
                        }
                    />

                    {/* <InputFields
                        label="Device Detail"
                        value={form.deviceDetail}
                        disabled
                    /> */}


                    <InputFields
                        required
                        searchable
                        label="Severity"
                        type="select"
                        value={form.severity}
                        onChange={(e: any) =>
                            handleChange("severity", e.target.value)
                        }
                        options={[
                            { value: "1", label: "Low" },
                            { value: "2", label: "Medium" },
                            { value: "3", label: "High" },
                            { value: "4", label: "Critical" },
                        ]}
                    />

                    <InputFields
                        required
                        searchable
                        label="Priority"
                        type="select"
                        value={form.priority}
                        onChange={(e: any) =>
                            handleChange("priority", e.target.value)
                        }
                        options={[
                            { value: "1", label: "P1" },
                            { value: "2", label: "P2" },
                            { value: "3", label: "P3" },
                            { value: "4", label: "P4" },
                        ]}
                    />

                    <InputFields
                        searchable
                        label="Status"
                        type="select"
                        value={form.status}
                        onChange={(e: any) =>
                            handleChange("status", e.target.value)
                        }
                        options={[
                            { value: "1", label: "Open" },
                            { value: "2", label: "In Progress" },
                            { value: "3", label: "Not Fixed" },
                            { value: "4", label: "Ready For Retesting" },
                            { value: "5", label: "Need Discussion" },
                            { value: "6", label: "Partially Done" },
                            { value: "7", label: "Reopen" },
                            { value: "8", label: "Cancelled" },
                            { value: "9", label: "Closed" },
                        ]}
                    />
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-4 mt-8">
                    <button
                        type="button"
                        className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                        onClick={() => router.push("/ticketManagement")}
                        disabled={submitting}
                    >
                        Cancel
                    </button>

                    <SidebarBtn
                        label={submitting ? "Submitting..." : "Submit"}
                        isActive={!submitting}
                        leadingIcon="mdi:check"
                        onClick={handleSubmit}
                        disabled={submitting}
                    />
                </div>
            </ContainerCard>
        </>
    );
}
