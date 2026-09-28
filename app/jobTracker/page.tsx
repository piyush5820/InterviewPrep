import JobTracker from "@/components/JobTracker";

export const metadata = {
  title: "Job Application Tracker | PreplystHub-AI",
  description: "Track and manage your job applications with AI-powered matching",
};

export default function JobTrackerPage() {
  return (
    <div className="bg-[#e2e8ef]">
      <JobTracker />
    </div>
  );
}
