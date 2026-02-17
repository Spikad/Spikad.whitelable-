import { signup } from './actions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-white">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                <Link href="/" className="mb-6 inline-flex items-center text-sm text-white/60 hover:text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Link>
                <h1 className="mb-2 text-3xl font-bold">Start Building</h1>
                <p className="mb-8 text-white/60">Create your free account to launch your store.</p>

                <form className="flex flex-col gap-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium" htmlFor="fullName">Full Name</label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            required
                            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            placeholder="Elon Musk"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            placeholder="elon@spacex.com"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium" htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-white/30 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        formAction={signup}
                        className="mt-2 w-full rounded-lg bg-rose-600 px-4 py-3 font-bold text-white hover:bg-rose-700 transition"
                    >
                        Create Account
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-white/40">
                    Already have an account?{' '}
                    <Link href="/login" className="text-rose-400 hover:text-rose-300">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    )
}
