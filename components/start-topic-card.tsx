import { Lightbulb, FileText } from 'lucide-react'

export function StartTopicCard() {
  return (
    <div className="flex h-full w-full flex-col bg-[#141414] p-3 font-sans text-white sm:p-4 md:p-5 lg:p-6">
      {/* Tabs */}
      <div className="mb-3 sm:mb-4 lg:mb-6 flex w-full rounded-xl border border-white/10 bg-[#0f0f0f] p-1">
        <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white shadow-sm ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]">
          <Lightbulb className="size-3.5 sm:size-4" />
          Topic
        </button>
        <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]">
          <FileText className="size-3.5 sm:size-4" />
          Article
        </button>
      </div>

      {/* Input Section */}
      <div className="mb-3 sm:mb-4 lg:mb-6 flex flex-col gap-1 sm:gap-1.5">
        <label className="text-[10px] sm:text-xs md:text-sm font-medium text-zinc-200">Enter Topic</label>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-2 sm:p-2.5 md:p-3 shadow-inner">
          <input
            type="text"
            placeholder="e.g., The Future of AI in Content Marketing"
            className="w-full bg-transparent text-[11px] sm:text-xs md:text-sm text-white placeholder-zinc-500 outline-none"
            readOnly
          />
        </div>
        <div className="flex justify-between text-[9px] sm:text-[10px] md:text-xs text-zinc-500">
          <span>Minimum 10 characters</span>
          <span>0 / 10+</span>
        </div>
      </div>

      {/* Example Topics */}
      <div className="mb-auto min-h-0 overflow-hidden">
        <p className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs md:text-sm text-zinc-400">Example Topics:</p>
        <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
          {[
            'The Future of Remote Work in 2024',
            'Sustainable Living: Small Changes, Big Impact',
            'How AI is Transforming Healthcare',
            'The Art of Mindful Productivity',
          ].map((topic) => (
            <span
              key={topic}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-1.5 text-[9px] sm:text-[10px] md:text-xs text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 sm:my-4 lg:my-6 h-px w-full shrink-0 bg-white/10" />

      {/* Generate Button */}
      <button type="button" className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-semibold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414]">
        Generate Content
      </button>
    </div>
  )
}
