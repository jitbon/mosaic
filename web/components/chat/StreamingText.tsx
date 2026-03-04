"use client";

interface StreamingTextProps {
  text: string;
  streaming?: boolean;
}

export default function StreamingText({ text, streaming = false }: StreamingTextProps) {
  return (
    <span>
      {text}
      {streaming && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            backgroundColor: "currentColor",
            marginLeft: 2,
            verticalAlign: "text-bottom",
            animation: "blink 1s step-end infinite",
          }}
        />
      )}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}
