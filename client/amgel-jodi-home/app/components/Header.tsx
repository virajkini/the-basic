'use client'

import { useState } from 'react'
import LoginSheet from './LoginSheet'

export default function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-myColor-900">
              Amgel Jodi
            </div>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="px-6 py-2 bg-myColor-600 text-white rounded-lg hover:bg-myColor-700 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              Login
            </button>
          </div>
        </div>
      </header>
      <LoginSheet isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  )
}

