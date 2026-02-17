import { createTenant } from './actions'
import { Store, ArrowRight } from 'lucide-react'

export default function OnboardingPage({
    searchParams,
}: {
    searchParams: { error?: string }
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-white">
            <div className="w-full max-w-lg">
                {/* Progress Steps */}
                <div className="mb-8 flex justify-center space-x-4">
                    <div className="h-1 w-16 rounded-full bg-rose-500"></div>
                    <div className="h-1 w-16 rounded-full bg-white/20"></div>
                    <div className="h-1 w-16 rounded-full bg-white/20"></div>
                </div>

                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-xl">
                        <Store className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="mb-2 text-3xl font-bold">Name your store</h1>
                    <p className="text-white/60">This will be your unique address on Spikad.</p>
                </div>

                {searchParams?.error && (
                    <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 text-center">
                        {searchParams.error}
                    </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                    <form className="flex flex-col gap-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="name">Store Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="w-full rounded-lg border border-white/10 bg-white/5 p-4 text-lg text-white placeholder-white/30 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                placeholder="My Awesome Shop"
                            />
                            <p className="mt-2 text-xs text-white/40">
                                http://<span className="text-rose-400">my-awesome-shop</span>.spikad.ai
                            </p>
                        </div>

                        <button
                            formAction={createTenant}
                            className="group flex w-full items-center justify-center rounded-lg bg-white px-4 py-4 text-center font-bold text-black hover:bg-white/90 transition"
                        >
                            Create Store
                            <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
