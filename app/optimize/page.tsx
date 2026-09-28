import ResumeOptimizer from "@/components/ResumeOptimizer";

export const metadata = {
  title: "AI Resume Optimizer | PreplystHub-AI",
  description: "Optimize your resume with AI-powered suggestions in real-time",
};

export default function OptimizePage() {
  return (
    <div className="bg-[#e2e8ef]">
      <ResumeOptimizer />
    </div>
  );
}
