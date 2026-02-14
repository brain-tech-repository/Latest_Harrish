
export default function Main({ horizontalSidebar, isOpen, children }: { horizontalSidebar: boolean, isOpen: boolean, children: React.ReactNode }) {
    return (
        <div className={`flex ${isOpen ? "ml-[250px] opacity-0 sm:opacity-100 transition-all duration-300 ease-in-out" : "ml-0 sm:ml-[80px]"} peer-hover:ml-[250px] ${horizontalSidebar ? "mt-[104px] ml-0 w-full h-[calc(100%-60px-44px)]" : "mt-[60px] sm:w-[calc(100%-80px)] h-[calc(100%-60px)]"} transition-all duration-300 ease-in-out overflow-hidden`}>
            <div className="p-[20px] pb-[22px] w-full h-full overflow-auto">
                {children}
            </div>
        </div>
    );
}