import { Icon } from "@iconify-icon/react/dist/iconify.mjs";

export default function KeyValueData({ title, data }: { title?: string; data: {  icon?: string; key: string | React.ReactNode; value: string | React.ReactNode, component?: React.ReactNode; onClick?: () => void }[] }) {
    return <>
        {title && <div className="text-[18px] font-semibold mb-[25px]" style={{ color: 'var(--kv-value-color, #181D27)' }}>{title}</div>}
        <div className="space-y-[20px] text-[14px]">
            {data?.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row justify-between gap-x-[20px]">
                    <div className="whitespace-nowrap flex items-center gap-[8px]" style={{ color: 'var(--kv-key-color, #535862)' }}>
                        { item?.icon && <Icon icon={item?.icon || ""} width={18} />}
                        <span>{ item.key }</span>
                    </div>
                    <div className="mb-[3px]" style={{ color: 'var(--kv-value-color, #181D27)' }} onClick={item.onClick}>{item.value}{item?.component || ""}</div>
                </div>
            ))}
        </div>        
    </>;
}