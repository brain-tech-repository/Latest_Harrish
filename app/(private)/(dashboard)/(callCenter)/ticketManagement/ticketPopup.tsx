"use client";

import { useCallback, useEffect, useState } from "react";
import InputFields from "@/app/components/inputFields";
import Loading from "@/app/components/Loading";
import { getTicketByUUID, UpdateTicket } from "@/app/services/callCenterApi";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import ImagePreviewModal from "@/app/components/ImagePreviewModal";
import RichTextEditor from "@/app/components/RichTextEditor";
import { formatDate } from "../../(master)/salesTeam/details/[uuid]/page";

/* ================= TYPES ================= */
type Ticket = {
    id: number;
    uuid: string;
    ticket_code: string;
    title: string;
    description: string;
    attachment_url?: string;
    device_detail: string;
    status: string | number;
    issue_type: string;
    priority: string;
    severity: string;
    created_at: string;
    created_user: {
        id: number;
        name: string;
    };
};

type FormState = {
    status: string;
    comment: string;
    attachment: File | null;

};

export const STATUS_OPTIONS = [
    { value: "1", label: "Open" },
    { value: "2", label: "In Progress" },
    { value: "3", label: "Not Fixed" },
    { value: "4", label: "Ready For Retesting" },
    { value: "5", label: "Need Discussion" },
    { value: "6", label: "Partially Done" },
    { value: "7", label: "Reopen" },
    { value: "8", label: "Cancelled" },
    { value: "9", label: "Closed" },
];

export const Priority = [
    { value: "1", label: "P1" },
    { value: "2", label: "P2" },
    { value: "3", label: "P3" },
    { value: "4", label: "P4" },
]

export const ISSUE_TYPE_OPTIONS = [
    { value: "1", label: "Bug" },
    { value: "2", label: "Observation" },
    { value: "3", label: "Question" },
    { value: "4", label: "Suggestion" },
    { value: "5", label: "Improvement" },
    { value: "6", label: "New Feature" },
]

export const Severity = [
    { value: "1", label: "Low" },
    { value: "2", label: "Medium" },
    { value: "3", label: "High" },
    { value: "4", label: "Critical" },
]

export default function TicketManagementView({ id }: { id?: string }) {
    const { showSnackbar } = useSnackbar();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [form, setForm] = useState<FormState>({
        status: "",
        comment: "",
        attachment: null,
    });

    /* ================= FETCH ================= */
    const fetchTicket = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            const res = await getTicketByUUID(id, {});
            const data = res?.data ?? null;
            setTicket(data);
        } catch (e) {
            console.error(e);
            showSnackbar("Failed to load ticket", "error");
        } finally {
            setLoading(false);
        }
    }, [id, showSnackbar]);

    /* ================= INITIAL FETCH ================= */
    useEffect(() => {
        fetchTicket();
    }, [fetchTicket]);

    /* ================= PREFILL ================= */
    useEffect(() => {
        if (!ticket) return;

        setForm({
            status: String(ticket.status ?? ""),
            comment: "",
            attachment: null,
        });
    }, [ticket]);

    /* ================= SUBMIT ================= */
    const handleSubmit = async () => {
        if (!ticket?.uuid || !form.status) {
            showSnackbar("Status is required", "warning");
            return;
        }

        try {
            setSubmitting(true);

            const formData = new FormData();
            formData.append("status", form.status);
            formData.append("comment", form.comment);

            if (form.attachment) {
                formData.append("attachment", form.attachment);
            }

            await UpdateTicket(ticket.uuid, formData);
            showSnackbar("Ticket updated successfully", "success");

            // 🔥 refresh ticket after update
            fetchTicket();
        } catch (e) {
            console.error(e);
            showSnackbar("Update failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    /* ================= STATES ================= */
    if (loading) {
        return (
            <div className="flex h-[500px] items-center justify-center">
                <Loading />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-6 text-center text-red-500">
                Ticket not found
            </div>
        );
    }


    const getLabel = (
        value: string | number,
        options: { value: string; label: string }[]
    ) => {
        return options.find(o => o.value === String(value))?.label ?? "-";
    };

    const isImage = (url: string) => {
        return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
    };


    /* ================= UI ================= */
    return (
        <div className=" w-[1500px] rounded-2xl">
            {/* HEADER */}
            <div className="py-6 px-6 bg-gray-300">
                <div className="flex justify-end py-auto">
                    <div className="flex items-end gap-2 text-sm">
                        <span>
                            {ticket.created_user?.name} On {ticket.device_detail}
                        </span>
                        <span>|</span>
                        <span>
                            {formatDate(ticket.created_at)}
                        </span>
                    </div>
                </div>
                <h1 className="my-2 text-3xl font-semibold">
                    {ticket.title}
                </h1>
                <div className="flex items-center gap-3">
                    <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold">
                        {ticket.ticket_code}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-yellow-500 px-3 py-1 text-xs">
                        <span className="h-2 w-2 rounded-full bg-white" />
                        {getLabel(ticket.status, STATUS_OPTIONS)}
                    </span>
                </div>
            </div>
            {/* <hr className="border-gray-300 my-6" /> */}


            <div className="grid grid-cols-[1fr_340px] gap-6">
                {/* LEFT */}
                <div className="space-y-4">
                    <div className="p-5">
                        <h1 className="mb-2 font-semibold text-gray-700">
                            Description
                        </h1>
                        <p className="text-sm text-gray-600">
                            {ticket.description || "-"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="mb-3 text-sm font-semibold text-gray-700">
                            Issue Type
                        </h3>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                            {getLabel(ticket.issue_type, ISSUE_TYPE_OPTIONS)}
                        </span>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
                        <div className=" max-w-[600px]">
                            <RichTextEditor
                                required
                                label="Comment"
                                value={form.comment}
                                onChange={(value) =>
                                    setForm(prev => ({
                                        ...prev,
                                        comment: value,
                                    }))
                                }
                                placeholder="Enter comment..."
                            />

                        </div>

                        <InputFields
                            label="Add Attachment"
                            type="file"
                            onChange={(e: any) =>
                                setForm(prev => ({
                                    ...prev,
                                    attachment: e.target.files?.[0] ?? null,
                                }))
                            }
                        />
                    </div>
                </div>

                {/* RIGHT */}
                <div className="space-y-4">
                    {ticket.attachment_url && (
                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">
                                Attachment
                            </h3>

                            {isImage(ticket.attachment_url) ? (
                                <img
                                    src={ticket.attachment_url}
                                    alt="Attachment"
                                    className="h-50 w-104 cursor-pointer rounded-lg border object-cover transition hover:scale-105"
                                    onClick={() => {
                                        setImagePreview(ticket.attachment_url!);
                                        setIsImageModalOpen(true);
                                    }}
                                />
                            ) : (
                                <a
                                    href={ticket.attachment_url}
                                    target="_blank"
                                    className="flex items-center gap-2 text-sm text-blue-600 underline"
                                >
                                    <Icon icon="mdi:file-outline" />
                                    View attachment
                                </a>
                            )}
                        </div>
                    )}



                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <InputFields
                            required
                            label="Status"
                            value={form.status}
                            options={STATUS_OPTIONS}
                            onChange={(e: any) =>
                                setForm(prev => ({
                                    ...prev,
                                    status: e.target.value,
                                }))
                            }
                        />
                    </div>

                    {[
                        { label: "Severity", value: getLabel(ticket.severity, Severity) },
                        { label: "Priority", value: getLabel(ticket.priority, Priority) },
                        { label: "Device", value: ticket.device_detail },
                    ].map(item => (
                        <div
                            key={item.label}
                            className="rounded-2xl bg-white p-4 shadow-sm"
                        >
                            <label className="text-xs text-gray-500">
                                {item.label}
                            </label>
                            <div className="mt-1 text-sm font-semibold">
                                {item.value || "-"}
                            </div>
                        </div>
                    ))}

                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <label className="text-xs text-gray-500">
                            Created At
                        </label>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <Icon icon="mdi:calendar-outline" />
                            {ticket.created_at
                                ? new Date(ticket.created_at).toLocaleString()
                                : "-"}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <SidebarBtn
                            label={submitting ? "Submitting..." : "Submit"}
                            isActive={!submitting}
                            leadingIcon="mdi:check"
                            onClick={handleSubmit}
                            disabled={submitting}
                        />
                    </div>
                </div>
            </div>
            <ImagePreviewModal
                images={imagePreview ? [imagePreview] : []}
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
            />
        </div>
    );
}
