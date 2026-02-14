import Image from "next/image";

export default function ImageButton(props: React.ComponentProps<typeof Image>) {
    return (
        <>
            <span className="w-[32px] h-[32px] bg-[#F5F5F5] rounded-[8px] text-[#252B37] flex justify-center items-center cursor-pointer overflow-hidden">
                <Image
                    {...props}
                    alt=""
                    className={`object-cover ${props.className}`}
                />
            </span>
        </>
    );
}