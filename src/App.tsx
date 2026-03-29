import { SpeedInsights } from '@vercel/speed-insights/react'

function App() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              CourseFlow - AI-Powered Course Management
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Welcome to CourseFlow! The application is running successfully.
            </p>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                About CourseFlow
              </h2>
              <p className="text-gray-600">
                Mastery CourseFlow helps professionals, students, and future global workers 
                develop a neutral international English voice through science-based voice and 
                accent training.
              </p>
            </div>
          </div>
        </div>
      </div>
      <SpeedInsights />
    </>
  )
}

export default App
