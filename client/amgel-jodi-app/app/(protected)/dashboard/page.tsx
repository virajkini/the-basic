export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold text-myColor-900 mb-6 md:mb-8">
          Dashboard
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-myColor-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 md:w-12 md:h-12 text-myColor-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-myColor-900 mb-2">
              Welcome to Amgel Jodi
            </h2>
            <p className="text-myColor-600 text-sm md:text-base">
              Create your profile to start finding your perfect match
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <a
              href="/profile"
              className="flex-1 px-6 py-3 bg-myColor-600 text-white rounded-lg hover:bg-myColor-700 transition-colors text-center font-medium text-sm md:text-base"
            >
              Create Profile
            </a>
            <form action="/api/logout" method="post" className="flex-1">
              <button
                type="submit"
                className="w-full px-6 py-3 border-2 border-myColor-300 text-myColor-700 rounded-lg hover:border-myColor-400 hover:text-myColor-900 transition-colors font-medium text-sm md:text-base"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

