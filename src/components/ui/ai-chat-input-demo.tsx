import { PromptInput } from "@/components/ui/ai-chat-input";

const DemoOne = () => {
  const handleSubmit = (value: string) => {
    console.log("Submitted:", value);
  };

  const handleChange = (value: string) => {
    console.log("Changed:", value);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl space-y-4">
        <PromptInput
          placeholder="Ask a question..."
          onSubmit={handleSubmit}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export { DemoOne };
