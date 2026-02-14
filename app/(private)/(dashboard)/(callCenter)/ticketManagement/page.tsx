"use client";

import { useEffect, useState } from "react";
import ContainerCard from "@/app/components/containerCard";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import { ticketList } from "@/app/services/callCenterApi";
import { Icon } from "@iconify-icon/react";
import Skeleton from "@mui/material/Skeleton";
import Drawer from "@mui/material/Drawer";
import TicketManagementView from "./ticketPopup";
import { formatDate } from "../../(master)/salesTeam/details/[uuid]/page";
import Loading from "@/app/components/Loading";

/* ================= TYPES ================= */

type Ticket = {
    id: number;
    uuid: string;
    ticket_code: string;
    title: string;
    description: string;
    issue_type: number;
    priority: string;
    severity: number;
    status: number;
    created_user: {
        id: number;
        name: string;
    };
    assign_user?: {
        id: number;
        name: string;
    };
    created_at: string;
};

export const IssueType = [
    { value: "1", label: "Bug" },
    { value: "2", label: "Observation" },
    { value: "3", label: "Question" },
    { value: "4", label: "Suggestion" },
    { value: "5", label: "Improvement" },
    { value: "6", label: "New Feature" },
]

const ISSUE_TYPE_LABEL_MAP: Record<number, string> = {
    1: "Bug",
    2: "Observation",
    3: "Question",
    4: "Suggestion",
    5: "Improvement",
    6: "New Feature",
}

export const Severity = [
    { value: "1", label: "Low" },
    { value: "2", label: "Medium" },
    { value: "3", label: "High" },
    { value: "4", label: "Critical" },
]

export const STATUS_OPTIONS = [
    { id: 1, label: "Open" },
    { id: 2, label: "In Progress" },
    { id: 3, label: "Not Fixed" },
    { id: 4, label: "Ready For Retesting" },
    { id: 5, label: "Need Discussion" },
    { id: 6, label: "Partially Done" },
    { id: 7, label: "Reopen" },
    { id: 8, label: "Cancelled" },
    { id: 9, label: "Closed" },
];


/* 🔥 Status → Badge Style Mapping */
const STATUS_BADGE_MAP: Record<number, string> = {
    1: "bg-blue-100 text-blue-700",
    2: "bg-yellow-100 text-yellow-700",
    3: "bg-red-100 text-red-700",
    4: "bg-purple-100 text-purple-700",
    5: "bg-orange-100 text-orange-700",
    6: "bg-indigo-100 text-indigo-700",
    7: "bg-pink-100 text-pink-700",
    8: "bg-gray-100 text-gray-600",
    9: "bg-emerald-100 text-emerald-700",
};


const STATUS_LABEL_MAP: Record<number, string> = {
    1: "Open",
    2: "In Progress",
    3: "Not Fixed",
    4: "Ready For Retesting",
    5: "Need Discussion",
    6: "Partially Done",
    7: "Reopen",
    8: "Cancelled",
    9: "Closed",
};

const SEVERITY_LABEL_MAP: Record<string, string> = {
    "1": "Low",
    "2": "Medium",
    "3": "High",
    "4": "Critical",
};


/* ================= COMPONENT ================= */

export default function TicketManagement() {
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [open, setOpen] = useState(false);

    const [cards, setCards] = useState([
        { title: "Total Tickets", value: "0", icon: "ion:bug-outline", color: "#88add6ff" },
        { title: "New Tickets", value: "0", icon: "mdi-light:file", color: "#dee054ff" },
        { title: "Progress Tickets", value: "0", icon: "tabler:progress", color: "#fad8e5ff" },
        { title: "Completed Tickets", value: "0", icon: "octicon:issue-closed-24", color: "#2dcf71ff" },
    ]);

    /* ================= API ================= */

    const fetchTickets = async () => {
        try {
            setLoading(true);

            const res = await ticketList({
                page: "1",
                per_page: "50",
            });

            const list: Ticket[] = res?.data ?? [];
            setTickets(list);

            const total = list.length;  // Total count of all tickets
            const newTickets = list.filter(t => t.status === 1).length;      // Open
            const completed = list.filter(t => t.status === 9).length;      // Closed
            const progress = list.filter(
                t => t.status !== 1 && t.status !== 9
            ).length;

            setCards([
                { ...cards[0], value: String(total) },
                { ...cards[1], value: String(newTickets) },
                { ...cards[2], value: String(progress) },
                { ...cards[3], value: String(completed) },
            ]);
        } catch (error) {
            console.error("Ticket fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return "--";
        return name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase();
    };


    useEffect(() => {
        fetchTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ================= UI ================= */

    return (
        <>
            <div className="">
                <h1 className="text-[18px] font-semibold text-[#181D27]">
                    Ticket Management
                </h1>

                {/* Header */}
                <div className="flex items-center justify-end me-4">
                    <SidebarBtn
                        href="/ticketManagement/add"
                        leadingIcon="lucide:plus"
                        label="Add Issue"
                        labelTw="hidden lg:block"
                        isActive
                    />
                </div>

                {/* Cards */}
                <div className="mt-6 grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-6">
                    {cards.map((card, index) => (
                        <div
                            key={index}
                            className="flex items-center rounded-xl bg-white p-5 border border-gray-100 shadow-sm"
                        >
                            <div
                                style={{ backgroundColor: card.color }}
                                className="flex items-center justify-center rounded-lg min-w-[48px] h-[48px]"
                            >
                                <Icon icon={card.icon} width={24} />
                            </div>

                            <div className="ml-4 w-full">
                                {loading ? (
                                    <>
                                        <Skeleton width="70%" height={16} />
                                        <Skeleton width="40%" height={32} />
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs font-medium text-gray-500">
                                            {card.title}
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-[#101828]">
                                            {card.value}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Ticket List */}
                <div className="mt-8">
                    <ContainerCard>
                        {loading && <div><Loading /></div>}
                        <div className="">
                            {tickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => {
                                        setSelectedId(ticket.uuid);
                                        setOpen(true);
                                    }}
                                    className="my-4 cursor-pointer rounded-xl bg-white p-5
             border border-gray-200 shadow-sm
             hover:shadow-md transition"
                                >
                                    <div className="flex items-start justify-between gap-6">
                                        {/* LEFT */}
                                        {/* LEFT */}
                                        <div className="flex items-center gap-20 flex-1">
                                            {/* Code + Severity + Arrow */}
                                            <div className="flex items-center gap-20 min-w-[220px] py-auto">
                                                <span className="text-lg font-semibold text-[#101828]">
                                                    {ticket.ticket_code}
                                                </span>

                                                <span className="text-sm font-semibold text-teal-500 uppercase">
                                                    {SEVERITY_LABEL_MAP[String(ticket.severity)]}
                                                </span>

                                                <Icon
                                                    icon="mdi:arrow-up"
                                                    width={20}
                                                    className="text-orange-500"
                                                />
                                            </div>

                                            {/* Title + Meta + Description */}
                                            <div className="flex flex-col gap-4">
                                                <h3 className="text-lg font-semibold text-[#101828]">
                                                    {ticket.title}
                                                </h3>

                                                <p className="text-xs text-gray-400 mt-1">
                                                    <span className="font-medium text-red-500">
                                                        {ISSUE_TYPE_LABEL_MAP[ticket.issue_type]}
                                                    </span>
                                                    <span className="mx-1">|</span>
                                                    Added on {formatDate(ticket.created_at)} by {ticket.created_user.name}
                                                </p>

                                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                                    {ticket.description}
                                                </p>
                                            </div>
                                        </div>


                                        {/* RIGHT */}
                                        <div className="flex items-center gap-10 px-10  me-5 my-auto">
                                            {/* Status */}
                                            <span
                                                className={`rounded-full min-w-[180px] text-center px-4 py-1 text-sm font-medium whitespace-nowrap
        ${STATUS_BADGE_MAP[ticket.status]}`}
                                            >
                                                {STATUS_LABEL_MAP[ticket.status]}
                                            </span>

                                            {/* Avatar */}
                                            <div className="flex items-center gap-3">
                                                <div
                                                    title={ticket.assign_user?.name ?? "Unassigned"}
                                                    className="flex h-9 w-9 items-center justify-center
        rounded-full border border-blue-500
        text-sm font-semibold text-blue-600 bg-blue-50"
                                                >
                                                    {getInitials(ticket.assign_user?.name)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            ))}
                        </div>
                    </ContainerCard>
                </div>
            </div>

            {/* Drawer */}
            <Drawer
                anchor="right"
                open={open}
                onClose={() => setOpen(false)}
            >
                <TicketManagementView id={selectedId} />
            </Drawer>
        </>
    );
}
