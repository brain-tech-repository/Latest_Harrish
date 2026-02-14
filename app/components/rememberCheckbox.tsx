const RememberCheckbox = () => {
    return (
        <div className="flex justify-between items-center">
            <input
                type="checkbox"
                id="checkbox"
                className="border-gray-300 rounded-md w-[16px] h-[16px] mr-[8px]"
            />
            <label htmlFor="checkbox" className="text-sm text-gray-700">
                Remember for 30 days
            </label>
        </div>
    );
};

export default RememberCheckbox;
