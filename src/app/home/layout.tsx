export default function HomeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="bg-black text-white min-h-screen">
            {children}
        </div>
    )
}
