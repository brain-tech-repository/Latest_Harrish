"use client";

import KeyValueData from "@/app/components/keyValueData";
import ContainerCard from "@/app/components/containerCard";
import { useLoading } from "@/app/services/loadingContext";
import { getTierDetails } from "@/app/services/settingsAPI";
import { useSnackbar } from "@/app/services/snackbarContext";
import { Icon } from "@iconify-icon/react";
import Link from "@/app/components/smartLink";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Item {
    id: string;
    uuid: string;
    osa_code: string;
    name: string;
    period: string;
    minpurchase: string;
    maxpurchase:  string;
}

const title = "Tier Details";
const backBtnUrl = "/settings/tier";

export default function ViewPage() {
    const params = useParams();
    let uuid: string = "";
    if (params?.uuid) {
        if (Array.isArray(params?.uuid)) {
            uuid = params?.uuid[0] || "";
        } else {
            uuid = params?.uuid as string;
        }
    }

    const { showSnackbar } = useSnackbar();
    const { setLoading } = useLoading();
    const [item, setItem] = useState<Item | null>(null);

    const periodLabel = (val?: string | null) => {
        const map: Record<string, string> = {
            "1": "Monthly",
            "2": "Quarterly",
            "3": "Half Yearly",
            "4": "Yearly",
        };
        if (val === null || val === undefined || val === "") return "-";
        return map[String(val)] ?? String(val);
    };

    useEffect(() => {
        const fetchPlanogramImageDetails = async () => {
            setLoading(true);
            const res = await getTierDetails(uuid);
            setLoading(false);
            if (res.error) {
                showSnackbar(
                    res.data.message || "Unable to fetch Route Details",
                    "error"
                );
                throw new Error("Unable to fetch Route Details");
            } else {
                setItem(res.data);
            }
        };
        fetchPlanogramImageDetails();
    }, []);

    return (
        <>
            <div className="flex items-center gap-4 mb-6">
                <Link href={backBtnUrl} back>
                    <Icon icon="lucide:arrow-left" width={24} />
                </Link>
                <h1 className="text-xl font-semibold mb-1">{title}</h1>
            </div>
                       
            <div className="flex gap-x-[20px]">
            <div className="w-full">
                
                                                {/* Location Information */}
                                                <ContainerCard className="w-auto  h-fit ">
                                                    <KeyValueData
                                                        // title="Tier Information"
                                                        data={[
                                                            { key: "Code", value: item?.osa_code || "-" },
                                                            {
                                                                key: "Name",
                                                                value: item?.name || "-",
                                                            },
                                                            { key: "Period", value: periodLabel(item?.period) },
                                                            { key: "Min Pirchase", value: item?.minpurchase || "-" },
                                                            { key: "Max Purchase", value: item?.maxpurchase || "-" },
                                                        ]}
                                                    />
                                                </ContainerCard>
                                                    </div>
            </div>
        </>
    );
}
