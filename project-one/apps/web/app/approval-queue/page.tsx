export default function AdminApprovalQueue() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Dashboard - Approval Queue
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Pending Approvals</h3>
            <p className="text-3xl font-bold text-blue-600">12</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Approved Today</h3>
            <p className="text-3xl font-bold text-green-600">8</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Rejected Today</h3>
            <p className="text-3xl font-bold text-red-600">3</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Approval Queue</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Request #001</h3>
                  <p className="text-gray-600">Submitted by User A</p>
                </div>
                <div className="space-x-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Request #002</h3>
                  <p className="text-gray-600">Submitted by User B</p>
                </div>
                <div className="space-x-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}