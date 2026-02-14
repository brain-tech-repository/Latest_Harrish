import React from "react";
import { useSnackbar } from "@/app/services/snackbarContext";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Icon } from "@iconify-icon/react";
import SidebarBtn from "@/app/components/dashboardSidebarBtn";
import InputFields from "@/app/components/inputFields";
import { forwardRef } from "react";

interface UploadPopupProps {
  open: boolean;
  onClose: () => void;
  dummyApi: (...args: any[]) => Promise<any>;
  api: (...args: any[]) => Promise<any>;
}


const UploadPopup: React.FC<UploadPopupProps> = ({ open, onClose, dummyApi, api }) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [showFileData, setShowFileData] = React.useState(false);
  const [fileData, setFileData] = React.useState<Array<Array<string>> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const { showSnackbar } = useSnackbar();
  const [infoPopoverOpen, setInfoPopoverOpen] = React.useState(false);
  const infoPopoverRef = React.useRef<HTMLDivElement>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileData(null); // Reset file data when new file is chosen
    }
  };

  // Helper to reset file input and file data
  const resetFileInput = () => {
    setFile(null);
    setFileData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Read file contents (CSV/XLSX)
  const handleShowFileData = async () => {
    if (!file) return;
    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const result = Papa.parse(text, { header: false });
        setFileData(result.data as Array<Array<string>>);
        setShowFileData(true);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setFileData(json as Array<Array<string>>);
        setShowFileData(true);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setFileData([['Preview only supported for CSV/XLSX files.']]);
      setShowFileData(true);
    }
  };
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    try {
      // Prepare FormData as the root payload
      const formData = new FormData();
      formData.append("file", file);
      // Await the API response
      const res = await api(formData);
        const isSuccess = res && (res.status === true || (res.data && res.data.status === true) || res.success === true);
        const successMsg = res?.message || res?.data?.message || "File uploaded successfully";
        const errorMsg = res?.message || res?.data?.message || "Upload failed.";
        if (isSuccess) {
          showSnackbar(successMsg, "success");
          resetFileInput();
          onClose();
        } else {
          showSnackbar(errorMsg, "error");
        }
    } catch (err) {
      showSnackbar("Upload failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Download file helpers
  const handleDownload = async (format: 'csv' | 'xlsx') => {
    setInfoPopoverOpen(false);
    try {
      const res = await dummyApi({ format });
      if (res && res.download_url) {
        // Use a hidden anchor to trigger download
        const a = document.createElement('a');
        a.href = res.download_url;
        a.download = `sample.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      setMessage(`Failed to download ${format.toUpperCase()} file`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[2px] bg-[#f5f6fa]/80">
      <div
        className="bg-white rounded-xl w-full max-w-[98vw] sm:max-w-[430px] max-h-[90vh] overflow-y-auto p-4 sm:p-8 shadow-xl border border-[#e5e7eb]"
      >
        {/* Upload Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-[var(--primary-btn-color)] text-white rounded-full flex items-center justify-center">
            <Icon
              icon="mdi:upload"
              className="text-white"
              width={28}
              height={28}
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center text-2xl font-semibold text-gray-900 mb-3">Upload File</h2>

 <div className="flex justify-center mb-1">
          <button
            type="button"
            className="text-blue-600 underline text-sm focus:outline-none cursor-pointer"
            onClick={() => setInfoPopoverOpen((v) => !v)}
          >
            Need a sample file?
          </button>
        </div>
         {infoPopoverOpen && (
          <div
            ref={infoPopoverRef}
            className="mx-auto mb-4 w-full max-w-lg px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded shadow-lg"
          >
            Download a{' '}
            <span
              className="text-blue-600 underline cursor-pointer"
              onClick={() => handleDownload('csv')}
            >
              sample csv file
            </span>{' '}
            or{' '}
            <span
              className="text-blue-600 underline cursor-pointer"
              onClick={() => handleDownload('xlsx')}
            >
              sample xlsx file
            </span>{' '}
            and compare it to your import file to ensure you have the file perfect for the import.
          </div>
        )}

        <div className="flex flex-col items-center mb-2 w-full">
          <div className="flex items-center w-full">
            <InputFields
            //   ref={fileInputRef as any}
              type="file"
              label="Upload file"
              name="upload-file"
              onChange={handleFileChange}
              className="border h-[44px] w-full rounded-md px-3 py-1 mt-[6px] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold border-gray-300"
              width="w-full"
              accept=".xlsx,.csv"
            />
            {file && (
                <div className="flex flex-col items-center justify-center mt-9">
              <button
                type="button"
                className="ml-2 rounded-full hover:text-[#EA0A2A] cursor-pointer"
                title="View file data"
                onClick={handleShowFileData}
              >
                <Icon icon="mdi:eye-outline" width={22} height={22} className="text-gray-600 hover:text-[#EA0A2A]" />
              </button>
              </div>
            )}
          </div>
          {showFileData && (
            <div className="fixed inset-0 z-60 flex items-center justify-center backdrop-blur-[2px] bg-[#f5f6fa]/80">
              <div className="bg-white rounded-xl w-full max-w-[98vw] sm:max-w-[700px] max-h-[80vh] overflow-y-auto p-2 sm:p-6 shadow-xl border border-[#e5e7eb] relative">
                <button
                  type="button"
                  className="absolute top-3 right-3 p-2 rounded-full hover:text-red-600 cursor-pointer"
                  onClick={() => setShowFileData(false)}
                  title="Close"
                >
                  <Icon icon="mdi:close" width={20} height={20} />
                </button>
                <h3 className="text-lg font-semibold mb-3">File Data Preview</h3>
                <div className="overflow-x-auto text-sm text-gray-800 max-h-[60vh]">
                  {Array.isArray(fileData) && fileData.length > 0 ? (
                    <table className="min-w-full border text-left text-xs sm:text-sm">
                      <thead>
                        <tr>
                          {fileData[0].map((cell, idx) => (
                            <th key={idx} className="border px-2 sm:px-3 py-2 bg-gray-50 font-semibold min-w-[80px] sm:min-w-[120px]">{cell || <span className="text-gray-400"></span>}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fileData.slice(1).map((row, rIdx) => (
                          <tr key={rIdx} className={row.every(cell => !cell) ? "bg-gray-50" : ""}>
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="border px-2 sm:px-3 py-2 min-h-[32px] sm:min-h-[40px] min-w-[80px] sm:min-w-[120px] text-center"
                              >
                                {cell || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-gray-400 text-center py-8">No data to preview</div>
                  )}
                </div>
              </div>
            </div>
          )}
          {!file ? <span className="text-sm text-gray-400">No file chosen</span> : <span className="text-xs text-gray-500">{file.name}</span>}
         
                
        </div>


        {/* Footer Buttons */}
        <div className="flex justify-center gap-3 mt-2">
          <div className="flex justify-center gap-3 mt-2">
            <button
              type="button"
              className="px-6 py-2 h-[40px] min-w-[120px] rounded-md font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
              onClick={() => {
                resetFileInput();
                onClose();
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <SidebarBtn
              isActive={true}
              label={loading ? "Uploading..." : "Upload"}
              onClick={handleUpload}
              labelTw="hidden sm:block min-w-[120px]"
              disabled={loading || !file}
            />
          </div>
        </div>


      </div>
    </div>
  );
};

export default UploadPopup;
