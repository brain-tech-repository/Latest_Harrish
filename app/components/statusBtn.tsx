import { Icon } from "@iconify-icon/react/dist/iconify.mjs";

export default function StatusBtn({ status }: { status: string }) {
    return status === "active" ? (
        <>
            <span 
                className="font-[500] rounded-[16px] flex items-center px-[10px] gap-[6px] w-fit"
                style={{
                    backgroundColor: 'var(--status-active-bg, #ECFDF3)',
                    color: 'var(--status-active-text, #027A48)',
                    borderWidth: '1px',
                    borderColor: 'var(--status-active-bg, #A6F4C5)'
                }}
            >
                <Icon
                    icon={"icon-park-outline:dot"}
                    width={12}
                    style={{ color: 'var(--status-active-text, #12B76A)' }}
                />
                <span className="text-[14px]">Active</span>
            </span>
        </>
    ) : (
        <>
            <span 
                className="font-[500] rounded-[16px] flex items-center px-[10px] gap-[6px] w-fit"
                style={{
                    backgroundColor: 'var(--status-inactive-bg, #fdefec)',
                    color: 'var(--status-inactive-text, #7a4a02)',
                    borderWidth: '1px',
                    borderColor: 'var(--status-inactive-bg, #f4d1a6)'
                }}
            >
                <Icon
                    icon={"icon-park-outline:dot"}
                    width={8}
                    style={{ color: 'var(--status-inactive-text, #b77212)' }}
                />
                <span className="text-[14px]">Inactive</span>
            </span>
        </>
    );
}
