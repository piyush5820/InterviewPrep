export type SectionType = "header" | "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "custom";

export interface ResumeSection {
  type: SectionType;
  title: string;
  content: string | string[] | { company: string; role: string; dates: string; description: string[] }[];
  /** For custom sections – stored as bullet lines */
  customBullets?: string[];
}

export const SECTION_TYPES: { type: SectionType; label: string; defaultTitle: string }[] = [
  { type: "summary", label: "Professional Summary", defaultTitle: "Professional Summary" },
  { type: "experience", label: "Experience", defaultTitle: "Experience" },
  { type: "education", label: "Education", defaultTitle: "Education" },
  { type: "skills", label: "Skills", defaultTitle: "Skills" },
  { type: "projects", label: "Projects", defaultTitle: "Projects" },
  { type: "certifications", label: "Certifications", defaultTitle: "Certifications" },
  { type: "custom", label: "Custom Section", defaultTitle: "Custom Section" },
];

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  sections: ResumeSection[];
}

export const SAMPLE_TEMPLATES: ResumeTemplate[] = [
  {
    id: "modern-clean",
    name: "Modern Clean",
    description: "Clean, minimal layout with clear section headers",
    sections: [
      {
        type: "header",
        title: "Header",
        content: [
          "Your Name",
          "City, State | phone@email.com | (123) 456-7890 | linkedin.com/in/yourprofile",
        ],
      },
      {
        type: "summary",
        title: "Professional Summary",
        content:
          "Results-driven professional with X years of experience delivering measurable impact across [industry/domain]. Proven track record in [key skill area] with expertise in [technologies/tools]. Passionate about [relevant passion] and committed to driving [business outcome].",
      },
      {
        type: "experience",
        title: "Experience",
        content: [
          {
            company: "Current Company",
            role: "Your Role",
            dates: "Jan 2023 – Present",
            description: [
              "Led development of [project/system] using [tech stack], resulting in [measurable outcome]",
              "Collaborated with cross-functional teams to deliver [solution], improving [metric] by X%",
              "Implemented [process/tool] that reduced [time/cost/effort] by X%",
            ],
          },
          {
            company: "Previous Company",
            role: "Previous Role",
            dates: "Jun 2020 – Dec 2022",
            description: [
              "Built and maintained [system/platform] serving X users with Y% uptime",
              "Designed [feature/solution] that increased [metric] by Z%",
            ],
          },
        ],
      },
      {
        type: "education",
        title: "Education",
        content: [
          "Degree in Field — University Name, Graduation Year",
          "Relevant Coursework: Course 1, Course 2, Course 3",
        ],
      },
      {
        type: "skills",
        title: "Skills",
        content: [
          "Languages: JavaScript, TypeScript, Python",
          "Frameworks: React, Node.js, Express",
          "Tools: Docker, AWS, Git",
          "Soft Skills: Leadership, Communication, Problem Solving",
        ],
      },
    ],
  },
  {
    id: "compact-pro",
    name: "Compact Pro",
    description: "Compact single-page layout for experienced professionals",
    sections: [
      {
        type: "header",
        title: "Header",
        content: [
          "Your Name",
          "City, State | phone@email.com | (123) 456-7890 | linkedin.com/in/yourprofile | github.com/yourhandle",
        ],
      },
      {
        type: "summary",
        title: "Summary",
        content:
          "Senior [Role] with X+ years of experience in [domain]. Specializing in [core competency 1], [core competency 2], and [core competency 3]. Delivered [key achievement] resulting in [business impact].",
      },
      {
        type: "experience",
        title: "Experience",
        content: [
          {
            company: "Company A",
            role: "Senior Role",
            dates: "2023 – Present",
            description: [
              "Architected and deployed [solution] using [tech], serving X daily active users",
              "Reduced [cost/time] by X% through [optimization technique]",
              "Mentored Y junior developers, improving team velocity by Z%",
            ],
          },
          {
            company: "Company B",
            role: "Mid-Level Role",
            dates: "2020 – 2023",
            description: [
              "Developed [feature/product] that generated $X in revenue",
              "Optimized [system] reducing response time by Y%",
            ],
          },
        ],
      },
      {
        type: "education",
        title: "Education",
        content: [
          "B.S. in Field — University, Year",
        ],
      },
      {
        type: "skills",
        title: "Technical Skills",
        content: [
          "Languages: JavaScript, TypeScript, Python, SQL",
          "Frameworks & Libraries: React, Next.js, Node.js, Express",
          "Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD",
          "Databases: PostgreSQL, MongoDB, Redis",
        ],
      },
    ],
  },
  {
    id: "tech-focused",
    name: "Tech Focused",
    description: "Skills-first layout ideal for technical roles",
    sections: [
      {
        type: "header",
        title: "Header",
        content: [
          "Your Name",
          "email@domain.com | github.com/yourhandle | linkedin.com/in/yourprofile",
        ],
      },
      {
        type: "summary",
        title: "About",
        content:
          "[Role] passionate about building [type of products/solutions]. Experienced in full lifecycle of [domain] development from concept to deployment. Strong advocate for [practice/methodology] and [principle].",
      },
      {
        type: "skills",
        title: "Core Competencies",
        content: [
          "Frontend: React, TypeScript, Next.js, Tailwind CSS",
          "Backend: Node.js, Python, Go, REST APIs, GraphQL",
          "Infrastructure: AWS, Docker, Terraform, CI/CD Pipelines",
          "Other: Agile/Scrum, Technical Writing, Code Review",
        ],
      },
      {
        type: "experience",
        title: "Experience",
        content: [
          {
            company: "Tech Company",
            role: "Software Engineer",
            dates: "2022 – Present",
            description: [
              "Engineered [system] handling X requests/sec with 99.9% uptime",
              "Led migration from [legacy tech] to [modern tech], reducing deployment time by X%",
            ],
          },
        ],
      },
      {
        type: "projects",
        title: "Key Projects",
        content: [
          {
            company: "Project Name",
            role: "Side Project",
            dates: "2024",
            description: [
              "Built [project] using [tech stack] — [users/impact]",
              "Open source with X stars on GitHub",
            ],
          },
        ],
      },
      {
        type: "education",
        title: "Education",
        content: [
          "B.S./M.S. in Computer Science — University, Year",
        ],
      },
    ],
  },
];
