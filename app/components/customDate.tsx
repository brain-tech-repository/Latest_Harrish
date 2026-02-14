export default function CustomDate({label, value, onChange}: {label: string; value: string; placeholder:string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;}) {
    return (
        <div>
            <label htmlFor="Date" className=" text-gray-700  font-medium ">
                {label}
            </label>
            <input
                value={value}
                onChange={onChange}
                type="date"
                id="Date"
                className="border border-gray-300 h-[44px] rounded-md p-2 w-full mt-[12px]"
              
            />
        </div>
    );
}
