import { useState } from 'react'
import FileUpload from './components/FileUpload'
import AssetList from './components/AssetList'
import OTPFlow from './components/OTPFlow'

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    // Trigger refresh of asset list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            File Upload Manager
          </h1>
          <p className="text-sm text-gray-500">
            Upload and manage your files with ease
          </p>
        </div>
        <FileUpload 
          apiBase={import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"} 
          onUploadSuccess={handleUploadSuccess}
        />
        <AssetList 
          apiBase={import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"}
          refreshTrigger={refreshTrigger}
        />
        <OTPFlow />
      </div>
    </div>
  )
}

export default App

