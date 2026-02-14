export default function CustomTextInput({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) {
    return (
        <div>
            <label htmlFor="userId" className="text-sm text-gray-700">
                {label}
            </label>
            <input
                value={value}
                onChange={onChange}
                type="text"
                id="userId"
                className="border border-gray-300 rounded-md p-2 w-full mt-[6px]"
                placeholder={placeholder}
            />
        </div>
    );
}
