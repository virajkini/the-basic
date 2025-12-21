import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../utils/apiClient";

interface Asset {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
  urlExpiresAt?: number; // Timestamp when URL expires
}

interface CachedAssets {
  assets: Asset[];
  cachedAt: number;
}

interface AssetListProps {
  apiBase: string;
  refreshTrigger?: number;
}

const CACHE_KEY = "s3_assets_cache";
const URL_VALIDITY_DURATION = 3600 * 1000; // 1 hour in milliseconds
const REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh if URL expires within 5 minutes

export default function AssetList({ apiBase, refreshTrigger }: AssetListProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const getCachedAssets = (): CachedAssets | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      return JSON.parse(cached);
    } catch {
      return null;
    }
  };

  const setCachedAssets = (assets: Asset[]) => {
    try {
      const now = Date.now();
      const assetsWithExpiry = assets.map((asset) => ({
        ...asset,
        urlExpiresAt: now + URL_VALIDITY_DURATION,
      }));
      const cache: CachedAssets = {
        assets: assetsWithExpiry,
        cachedAt: now,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error("Error caching assets:", error);
    }
  };

  const shouldRefreshUrls = (cached: CachedAssets): boolean => {
    if (!cached || !cached.assets.length) return true;
    
    const now = Date.now();
    // Check if any URL is expired or expiring soon
    const needsRefresh = cached.assets.some((asset) => {
      if (!asset.urlExpiresAt) return true;
      const timeUntilExpiry = asset.urlExpiresAt - now;
      return timeUntilExpiry < REFRESH_THRESHOLD;
    });
    
    return needsRefresh;
  };

  const fetchAssets = useCallback(async (forceRefresh: boolean = false) => {
    try {
      const cached = getCachedAssets();
      
      // Use cached data if available and URLs are still valid
      if (!forceRefresh && cached && !shouldRefreshUrls(cached)) {
        setAssets(cached.assets);
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await apiClient('/files');
      if (!res.ok) {
        throw new Error("Failed to fetch assets");
      }
      const data = await res.json();
      const fetchedAssets = data.files || [];
      
      // Cache the new assets with expiration timestamps
      setCachedAssets(fetchedAssets);
      setAssets(fetchedAssets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      
      // Fallback to cached data if available
      const cached = getCachedAssets();
      if (cached && cached.assets.length > 0) {
        setAssets(cached.assets);
        console.log("Using cached assets due to fetch error");
      } else {
        alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    // Force refresh when refreshTrigger changes (e.g., after upload)
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchAssets(true);
    } else {
      fetchAssets(false);
    }
  }, [fetchAssets, refreshTrigger]);

  const handleDelete = async (key: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      setDeleting(key);
      const res = await apiClient(`/files/${encodeURIComponent(key)}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("Failed to delete file");
      }

      // Remove the deleted asset from the list
      const updatedAssets = assets.filter((asset) => asset.key !== key);
      setAssets(updatedAssets);
      
      // Update cache
      setCachedAssets(updatedAssets);
    } catch (error) {
      console.error("Error deleting asset:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 text-center">Loading assets...</p>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Assets</h2>
        <p className="text-gray-600 text-center">No assets uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Assets</h2>
      <div className="space-y-3">
        {assets.map((asset) => (
          <div
            key={asset.key}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium truncate"
                  >
                    {asset.key.split("/").pop()}
                  </a>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 break-all">
                    <span className="font-medium">URL:</span>{" "}
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {asset.url}
                    </a>
                  </p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>
                      <span className="font-medium">Size:</span> {formatFileSize(asset.size)}
                    </span>
                    <span>
                      <span className="font-medium">Uploaded:</span> {formatDate(asset.lastModified)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(asset.key)}
                disabled={deleting === asset.key}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md
                  hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                  transition-colors whitespace-nowrap"
              >
                {deleting === asset.key ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

