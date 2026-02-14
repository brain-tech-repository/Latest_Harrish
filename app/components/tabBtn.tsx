export default function TabBtn({
    label,
    isActive,
    onClick,
}: {
    label: string;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={`${
                isActive ? "bg-[var(--secondary-btn-color)] text-[var(--secondary-btn-text-color)]" : ""
            } w-full text-[16px] font-semibold px-[16px] py-[10px] rounded-[8px] cursor-pointer whitespace-nowrap`}
            style={!isActive ? { color: 'var(--tab-inactive-text, #535862)' } : undefined}
            onClick={onClick}
        >
            {label}
        </button>
    );
}