"use client";

type CodeEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  language?: string;
  placeholder?: string;
  readOnly?: boolean;
};

// Minimal safe CodeEditor placeholder.
// InterviewQuestion imports @uiw/react-codemirror directly, so this
// component intentionally avoids that dependency and stays presentation-only.
export default function CodeEditor({ value = "", onChange, placeholder = "Write code here...", readOnly = false }: CodeEditorProps) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#dde5ec] bg-white shadow-[0_1px_2px_rgba(15,30,46,0.06)]">
      <div className="flex items-center gap-1.5 border-b border-[#dde5ec] bg-[#f0f4f7] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a3d]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#9a5a0a]/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]/50" />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        rows={12}
        spellCheck={false}
        className="w-full resize-y bg-white p-4 font-mono text-sm leading-relaxed text-[#0f1e2e] placeholder:text-[#8ca0b3] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0f766e]"
      />
    </div>
  );
}
