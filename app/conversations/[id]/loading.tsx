import AppLayout from "@/components/app-layout"

export default function Loading() {
  return (
    <AppLayout>
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse mr-3"></div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="h-24 bg-gray-100 rounded-md animate-pulse"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-start">
              <div className="max-w-3xl w-full mr-12">
                <div className="p-4 bg-gray-100 rounded-md animate-pulse">
                  <div className="flex justify-between mb-2">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
