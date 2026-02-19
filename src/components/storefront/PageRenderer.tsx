import { LucideIcon, Sparkles, Mail, Phone } from 'lucide-react'
import * as Icons from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageSection {
    id: string
    section_type: string
    config_json: any
    sort_order: number
}

// Helper to resolve icons dynamically
const SectionIcon = ({ name, className }: { name: string; className?: string }) => {
    // @ts-ignore
    const Icon = Icons[name] as LucideIcon
    return Icon ? <Icon className={className} /> : <Sparkles className={className} />
}

export default function PageRenderer({ sections, primaryColor }: { sections: PageSection[]; primaryColor?: string }) {
    if (!sections || sections.length === 0) {
        return <div className="py-20 text-center text-gray-500">Empty Page</div>
    }

    return (
        <div className="flex flex-col w-full">
            {sections.map((section) => {
                const { config_json } = section
                switch (section.section_type) {
                    case 'Hero':
                        return (
                            <section
                                key={section.id}
                                className="relative py-20 md:py-32 px-4 text-center overflow-hidden"
                                style={{ backgroundColor: primaryColor ? `${primaryColor}10` : '#f3f4f6' }}
                            >
                                {config_json.backgroundImage && (
                                    <div
                                        className="absolute inset-0 z-0 opacity-20"
                                        style={{
                                            backgroundImage: `url(${config_json.backgroundImage})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    />
                                )}
                                <div className="relative z-10 max-w-4xl mx-auto">
                                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
                                        {config_json.title}
                                    </h1>
                                    <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
                                        {config_json.subtitle}
                                    </p>
                                </div>
                            </section>
                        )

                    case 'Features':
                        return (
                            <section key={section.id} className="py-16 px-4 bg-white">
                                <div className="max-w-6xl mx-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {config_json.items?.map((item: any, i: number) => (
                                            <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300">
                                                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 text-2xl">
                                                    {item.icon || '✨'}
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                                <p className="text-gray-600 leading-relaxed">{item.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )

                    case 'Text':
                        return (
                            <section key={section.id} className="py-16 px-4 bg-white">
                                <div className="max-w-3xl mx-auto prose prose-lg prose-blue">
                                    {config_json.heading && <h2>{config_json.heading}</h2>}
                                    <div className="whitespace-pre-wrap text-gray-600">
                                        {config_json.content}
                                    </div>
                                </div>
                            </section>
                        )

                    case 'Contact':
                        return (
                            <section key={section.id} className="py-20 px-4 bg-gray-50">
                                <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm text-center">
                                    <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
                                    <div className="space-y-6">
                                        {config_json.email && (
                                            <a
                                                href={`mailto:${config_json.email}`}
                                                className="flex items-center justify-center gap-3 text-lg font-medium text-gray-700 hover:text-blue-600 transition"
                                            >
                                                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                {config_json.email}
                                            </a>
                                        )}
                                        {config_json.phone && (
                                            <a
                                                href={`tel:${config_json.phone}`}
                                                className="flex items-center justify-center gap-3 text-lg font-medium text-gray-700 hover:text-blue-600 transition"
                                            >
                                                <div className="p-3 bg-green-50 text-green-600 rounded-full">
                                                    <Phone className="h-5 w-5" />
                                                </div>
                                                {config_json.phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )

                    case 'CTA':
                        return (
                            <section key={section.id} className="py-20 px-4">
                                <div
                                    className="max-w-5xl mx-auto rounded-3xl p-12 text-center text-white relative overflow-hidden"
                                    style={{ backgroundColor: primaryColor || '#2563eb' }}
                                >
                                    <div className="relative z-10">
                                        <h2 className="text-3xl md:text-5xl font-bold mb-6">{config_json.title}</h2>
                                        <a href={config_json.buttonLink || '#'}>
                                            <Button
                                                size="lg"
                                                className="bg-white text-gray-900 hover:bg-gray-100 border-none text-lg px-8 py-6 h-auto font-bold shadow-xl"
                                            >
                                                {config_json.buttonText || 'Learn More'}
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </section>
                        )

                    default:
                        return null
                }
            })}
        </div>
    )
}
