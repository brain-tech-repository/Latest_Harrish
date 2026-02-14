import Image from "next/image";

export default function Logo({
    type = "full",
    width = 183,
    height = 50,
    twClass,
}: {
    type?: "half" | "full";
    width?: number;
    height?: number;
    twClass?: string;
}) {
    return (
        <Image
            src={type === "full" ? "/logo.png" : "/shortlogoo.png"}
            alt="Login Illustration"
            width={width}
            height={height}
            className={twClass}
        />
    )
}
