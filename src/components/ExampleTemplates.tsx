import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ExampleTemplate {
  name: string;
  type: "prompts" | "images";
  prompt: string;
  output: string;
}

const examples: ExampleTemplate[] = [
  {
    name: "Translation",
    type: "prompts",
    prompt: `Translate the following sentence to French:
    
The cat jumped onto the windowsill to watch the birds.`,
    output:
      '{ "translation": "Le chat a sauté sur le rebord de la fenêtre pour regarder les oiseaux." }',
  },
  {
    name: "Summarization",
    type: "prompts",
    prompt: `Summarize the following article:

Medical Article Writing Sample – Full Article

For the past 50 years, the National Cancer Institute’s Clinical Trials Cooperative Group Program has played a key role in developing new and improved cancer therapies and preventive strategies. NCI-sponsored trials have studied distinct cancer subpopulations and those with rare cancers, elucidated the role of therapeutic and chemoprevention agents such as tamoxifen for breast cancer, and evaluated quality-of-life issues for patients with cancer. But a new report from the Institute of Medicine (IOM) of the National Academies concludes that the Clinical Trials Cooperative Group Program is in a “state of crisis.”
The IOM report recommends 12 sweeping changes in the ways that their clinical trials are reviewed, prioritized, and funded—changes that are likely to affect players as diverse as NCI and the FDA, clinical research investigators, cancer patients, and even health-care insurers and the pharmaceutical industry. More than 25,000 cancer patients, 3,100 institutions, and 14,000 investigators from cancer centers and community oncology practices participate in Cooperative Group clinical trials each year—and they would all likely be affected by the IOM’s recommended changes.
“Many people involved in the Cooperative Group clinical trials, including NCI and those doing research in the academic community and practice community, shared the same frustrations. The Cooperative Group trials system had become inefficient and slow, and we were not adequately funding and incentivizing people to participate—including patients and physicians,” said John Mendelsohn, MD, Chair of the IOM committee and President of the University of Texas M. D. Anderson Cancer Center. “There was too much recycling of efforts, and too much gathering of opinions and counteropinions to design the trials. Everything needed to be streamlined.”
`,
    output: `The article highlights the critical role of the National Cancer Institute’s Clinical Trials Cooperative Group Program over the past 50 years in advancing cancer treatment. However, a recent Institute of Medicine report declares the program is in crisis, calling for major reforms to improve efficiency, funding, and participation. These changes are expected to impact thousands of patients, researchers, and institutions involved in clinical cancer trials.`,
  },
  {
    name: "Image Description",
    type: "images",
    prompt: "Describe the content of this image",
    output:
      "The image shows a beautiful sunset over a mountain range with a clear sky.",
  },
];

interface ExampleTemplatesProps {
  prompt?: string;
  onSelectExample: (dataType: string, prompt: string, output: string) => void;
  className?: string;
}

const ExampleTemplates = ({
  prompt,
  onSelectExample,
  className = "",
}: ExampleTemplatesProps) => {
  if (examples.length === 0) return null;

  return (
    <div className={cn(className, "space-y-2")}>
      <div className="flex flex-wrap gap-2">
        {/* <p className="text-sm">Examples</p> */}
        {examples.map((example) => (
          <Badge
            key={example.name}
            variant="outline"
            className={cn(
              "cursor-pointer hover:bg-gray-100 transition-colors bg-white",
              {
                "bg-blue-50 text-blue-800": prompt === example.prompt,
              }
            )}
            onClick={() =>
              onSelectExample(example.type, example.prompt, example.output)
            }
          >
            {example.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ExampleTemplates;
