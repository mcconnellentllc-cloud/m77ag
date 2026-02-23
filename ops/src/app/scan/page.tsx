"use client";

import { useState, useRef } from "react";
import AppShell from "@/components/layout/AppShell";
import { Camera, Upload, CheckCircle } from "lucide-react";
import { ENTITIES } from "@/lib/entities";

type ScanStep = "capture" | "processing" | "review" | "done";

export default function ScanPage() {
  const [step, setStep] = useState<ScanStep>("capture");
  const [selectedType, setSelectedType] = useState<string>("bill");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Record<string, string> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      setPreviewUrl(evt.target?.result as string);
      setStep("processing");
      // Simulate processing — in production this calls /api/scan/upload
      setTimeout(() => {
        setExtractedData({
          vendor: "Extracted Vendor Name",
          amount: "0.00",
          dueDate: "",
          entity: "",
          category: "",
        });
        setStep("review");
      }, 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    // In production: POST to /api/scan/upload with image + confirmed data
    setStep("done");
  };

  const resetScan = () => {
    setStep("capture");
    setPreviewUrl(null);
    setExtractedData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Scan Document</h1>

        {step === "capture" && (
          <div className="space-y-4">
            {/* Document type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "bill", label: "Bill / Invoice" },
                  { key: "receipt", label: "Receipt" },
                  { key: "document", label: "Document" },
                  { key: "other", label: "Other" },
                ].map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setSelectedType(type.key)}
                    className={`p-4 rounded-xl border-2 text-sm font-medium transition-colors ${
                      selectedType === type.key
                        ? "border-gray-900 bg-gray-50 text-gray-900"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Capture area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <Camera size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Take a photo or choose from gallery
              </p>
              <p className="text-xs text-gray-400">
                Supports JPG, PNG, PDF
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <Upload size={18} /> Upload File
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-12">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Scanned document"
                className="max-h-48 mx-auto mb-6 rounded-lg shadow-sm"
              />
            )}
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Processing document with AI...</p>
            <p className="text-xs text-gray-400 mt-1">Extracting text and identifying data</p>
          </div>
        )}

        {step === "review" && extractedData && (
          <div className="space-y-4">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Scanned document"
                className="max-h-48 mx-auto rounded-lg shadow-sm"
              />
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
              <h2 className="font-semibold text-gray-800">Confirm Extracted Data</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity</label>
                <select
                  value={extractedData.entity}
                  onChange={(e) => setExtractedData({ ...extractedData, entity: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                >
                  <option value="">Select entity...</option>
                  {ENTITIES.map((e) => (
                    <option key={e.slug} value={e.slug}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input
                  type="text"
                  value={extractedData.vendor}
                  onChange={(e) => setExtractedData({ ...extractedData, vendor: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={extractedData.amount}
                  onChange={(e) => setExtractedData({ ...extractedData, amount: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={extractedData.dueDate}
                  onChange={(e) => setExtractedData({ ...extractedData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg"
                />
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
              >
                Confirm and Save
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
            <p className="text-lg font-semibold text-gray-800 mb-2">Document Saved</p>
            <p className="text-sm text-gray-500 mb-6">
              The {selectedType} has been processed and saved to the correct entity.
            </p>
            <button
              onClick={resetScan}
              className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
            >
              Scan Another
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
