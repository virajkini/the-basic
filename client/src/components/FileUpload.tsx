import React, { useState } from "react";
import { apiClient } from "../utils/apiClient";

interface FileUploadProps {
  apiBase: string;
  onUploadSuccess?: () => void;
}

export default function FileUpload({ apiBase, onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setProgress(0);
      setUploadedKey(null);
    }
  };

  const upload = async () => {
    if (!file) {
      alert("Pick a file");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // 1. ask backend for presigned url & key
      const endpoint = `/presign?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`;
      const res = await apiClient(endpoint);
      
      if (!res.ok) {
        throw new Error("Failed to get presigned URL");
      }

      const { url, key } = await res.json();

      // 2. upload directly to S3
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 200 || xhr.status === 204) {
          setUploadedKey(key);
          setProgress(100);
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        } else {
          alert("Upload failed");
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        alert("Upload error");
      };

      xhr.send(file);
    } catch (error) {
      setUploading(false);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <input
            type="file"
            onChange={handleFile}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer"
          />
        </div>

        <button
          onClick={upload}
          disabled={!file || uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md
            hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
            font-medium transition-colors"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>

        {progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {uploadedKey && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-medium text-green-800">
              Upload successful!
            </p>
            <p className="text-xs text-green-600 mt-1 break-all">
              Key: {uploadedKey}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

