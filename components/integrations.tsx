import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Email, Instagram, XTwitter } from './ui/svgs'

export default function IntegrationsSection() {
    return (
        <section id="integrations" className="scroll-mt-24">
            <div className="bg-background py-24 md:py-32">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="mx-auto max-w-md px-6 mask-[radial-gradient(ellipse_100%_100%_at_50%_0%,#000_70%,transparent_100%)]">
                        <div className="bg-background dark:bg-muted/50 rounded-xl border border-white/10 px-6 pb-12 pt-3 shadow-xl">
                            <Integration
                                icon={<Instagram />}
                                name="Instagram"
                                description="The AI model that powers Google's search engine."
                            />
                            <Integration
                                icon={<XTwitter />}
                                name="X (Twitter)"
                                description="The AI model that powers Google's search engine."
                            />
                            <Integration
                                icon={<Email />}
                                name="Email"
                                description="The AI model that powers Google's search engine."
                            />
                        </div>
                    </div>
                    <div className="mx-auto mt-6 max-w-lg space-y-6 text-center">
                        <h2 className="text-balance text-3xl font-semibold md:text-4xl lg:text-5xl">Integrate with your favorite LLMs</h2>
                        <p className="text-muted-foreground">Connect seamlessly with popular platforms and services to enhance your workflow.</p>

                        <Button
                            variant="outline"
                            size="sm"
                            asChild>
                            <Link href="/create">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}

const Integration = ({ icon, name, description }: { icon: React.ReactNode; name: string; description: string }) => {
    return (
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b  border-white/10 border-dashed py-3 last:border-b-0">
            <div className="bg-muted border-foreground/5 flex size-12 items-center justify-center rounded-lg border">{icon}</div>
            <div className="space-y-0.5">
                <h3 className="text-sm font-medium">{name}</h3>
                <p className="text-muted-foreground line-clamp-1 text-sm">{description}</p>
            </div>
            <Button
                variant="outline"
                size="icon"
                aria-label="Add integration">
                <Plus className="size-4" />
            </Button>
        </div>
    )
}
