"use client";

export default function StatusBtn({ isActive }: { isActive: boolean | any }) {
    return isActive ? (
        <span 
            className="text-sm font-[500] p-1 px-4 rounded-xl text-[12px]"
            style={{ 
                backgroundColor: 'var(--status-active-bg, #ECFDF3)', 
                color: 'var(--status-active-text, #027A48)' 
            }}
        >
            Active
        </span>
    ) : (
        <span 
            className="text-sm p-1 px-4 rounded-xl text-[12px]"
            style={{ 
                backgroundColor: 'var(--status-inactive-bg, #FEE2E2)', 
                color: 'var(--status-inactive-text, #B91C1C)' 
            }}
        >
            In active
        </span>
    );
}
