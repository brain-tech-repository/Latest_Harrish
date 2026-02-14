import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import Image from "next/image";

export default function CardForLoginPage() {
    return (
        <div className="relative overflow-hidden rounded-[20px] xl:w-full h-[calc(100vh-48px)]">
            <Image
                src="/loginimage2.png"
                alt="Login Illustration"
                width={696}
                height={912}
                className="object-cover object-[30%_center] w-full h-full"
            />

            <div className="absolute flex justify-between items-center bottom-0 p-[30px] text-white w-full z-20">
                <div className="text-3xl w-[380px] font-semibold">
                    Where Every Sip Starts with Precision.
                </div>
                <div className="w-17 h-17 flex justify-center items-center border border-[#FFFFFF33] bg-[#FFFFFF4D] rounded-full backdrop-blur-2xl">
                    <Icon icon="hugeicons:shipping-truck-02" width={30} />
                </div>
            </div>
        </div>
    );
}
