export default function AdminSettingsPage() {
    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Platform Settings</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Global Configuration</h3>
                    <p className="text-gray-500 mb-6">
                        Configure global platform settings, feature flags, and maintenance mode.
                    </p>

                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                        ⚠️ careful: These settings affect all tenants.
                        Feature currently disabled for safety in v1.0.
                    </div>
                </div>
            </div>
        </div>
    )
}
