import { ExampleTemplate } from "@/types/appData";
import { times } from "lodash";

export const CAPABILITIES_FROM_TAG = {
  vision: "see",
  coding: "code",
  multilingual: "speak multiple languages",
  reasoning: "think",
  "document AI": "read documents",
  math: "do math",
  edge: "run on edge devices",
  moderation: "moderate content",
};

export const LOREM_IPSUM = times(
  10,
  () =>
    `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
).join(" ");

export const EXAMPLES: ExampleTemplate[] = [
  {
    name: "Translation",
    dataType: "prompts",
    prompt: `Translate the following sentence to French:
    
The cat jumped onto the windowsill to watch the birds.`,
    example:
      '{ "translation": "Le chat a sauté sur le rebord de la fenêtre pour regarder les oiseaux." }',
  },
  {
    name: "Summarization",
    dataType: "prompts",
    prompt: `Summarize the following article:

Medical Article Writing Sample – Full Article

For the past 50 years, the National Cancer Institute’s Clinical Trials Cooperative Group Program has played a key role in developing new and improved cancer therapies and preventive strategies.
NCI-sponsored trials have studied distinct cancer subpopulations and those with rare cancers, elucidated the role of therapeutic and chemoprevention agents such as tamoxifen for breast cancer, and evaluated quality-of-life issues for patients with cancer.
But a new report from the Institute of Medicine (IOM) of the National Academies concludes that the Clinical Trials Cooperative Group Program is in a “state of crisis.”
The IOM report recommends 12 sweeping changes in the ways that their clinical trials are reviewed, prioritized, and funded—changes that are likely to affect players as diverse as NCI and the FDA, clinical research investigators, cancer patients, and even health-care insurers and the pharmaceutical industry.
More than 25,000 cancer patients, 3,100 institutions, and 14,000 investigators from cancer centers and community oncology practices participate in Cooperative Group clinical trials each year—and they would all likely be affected by the IOM’s recommended changes.
“Many people involved in the Cooperative Group clinical trials, including NCI and those doing research in the academic community and practice community, shared the same frustrations.
The Cooperative Group trials system had become inefficient and slow, and we were not adequately funding and incentivizing people to participate—including patients and physicians,” said John Mendelsohn, MD, Chair of the IOM committee and President of the University of Texas M. D. Anderson Cancer Center.
“There was too much recycling of efforts, and too much gathering of opinions and counteropinions to design the trials. Everything needed to be streamlined.”
`,
    example: `The article highlights the critical role of the National Cancer Institute’s Clinical Trials Cooperative Group Program over the past 50 years in advancing cancer treatment. However, a recent Institute of Medicine report declares the program is in crisis, calling for major reforms to improve efficiency, funding, and participation. These changes are expected to impact thousands of patients, researchers, and institutions involved in clinical cancer trials.`,
  },
  {
    name: "Image Description",
    dataType: "images",
    prompt: "Describe the content of this image",
    example:
      "The image shows a beautiful sunset over a mountain range with a clear sky.",
  },
  {
    name: "PDF Analysis",
    dataType: "pdfs",
    prompt: `You are an academic summarization assistant. Given the full text of a research paper, extract the key data and structure it under the following headings:
1. **Title**
2. **Authors and Affiliations**
3. **Journal / Conference Name**
4. **Publication Year**
5. **Abstract Summary**
6. **Research Objective**
7. **Methods / Methodology**
8. **Dataset (if applicable)**
9. **Key Findings / Results**
10. **Conclusion**
11. **Limitations**
12. **Future Work**
13. **Key Figures / Tables (with descriptions)**
14. **References to Notable Prior Work**
15. **Keywords / Topics**`,
    example: `{
  "Title": "Hierarchical Text-Conditional Image Generation with CLIP Latents",
  "Authors and Affiliations": [
    { "name": "Aditya Ramesh", "affiliation": "OpenAI" },
    { "name": "Prafulla Dhariwal", "affiliation": "OpenAI" },
    { "name": "Alex Nichol", "affiliation": "OpenAI" },
    { "name": "Casey Chu", "affiliation": "OpenAI" },
    { "name": "Mark Chen", "affiliation": "OpenAI" }
  ],
  "Journal / Conference Name": "arXiv (preprint)",
  "Publication Year": 2022,
  "Abstract Summary": "The paper introduces a two-stage text-to-image generation model, called unCLIP, which uses a contrastive model (CLIP) for robust image-text representation. The model comprises a prior generating CLIP image embeddings from text and a diffusion decoder that translates these embeddings into images. This architecture improves diversity without compromising photorealism, and enables semantic image editing via language guidance.",
  "Research Objective": "To develop a high-quality and diverse text-conditional image generation model by leveraging CLIP's joint embedding space and diffusion-based decoding.",
  "Methods / Methodology": "A hierarchical two-stage approach: (1) A prior that generates CLIP image embeddings from text captions using either autoregressive or diffusion models; (2) A decoder that generates images from these embeddings using diffusion models. The architecture is trained with classifier-free guidance and enhanced with PCA compression and upsampling networks.",
  "Dataset (if applicable)": {
    "Training": "CLIP and DALL-E datasets (approx. 650M images for encoder; 250M images for decoder, upsamplers, and prior)",
    "Evaluation": "MS-COCO validation set"
  },
  "Key Findings / Results": [
    "unCLIP achieves comparable photorealism to GLIDE but with higher sample diversity.",
    "Diffusion priors outperform autoregressive priors in quality and efficiency.",
    "Text-guided image manipulations (e.g., object substitutions, style blending) are possible through CLIP latent operations.",
    "unCLIP achieves a state-of-the-art zero-shot FID score of 10.39 on MS-COCO."
  ],
  "Conclusion": "By inverting CLIP image embeddings via diffusion decoders and using a latent-space prior, unCLIP effectively balances image quality and diversity, enables semantic editing, and outperforms prior models in various benchmarks.",
  "Limitations": [
    "Weaker object-attribute binding compared to models like GLIDE.",
    "Struggles with rendering coherent text and complex scenes.",
    "Potential ethical risks due to increased realism and fewer indicators of synthetic origin."
  ],
  "Future Work": [
    "Training decoders at higher base resolutions to improve detail in complex scenes.",
    "Exploring methods to improve attribute-object binding and text rendering fidelity.",
    "Further safety and bias mitigation studies."
  ],
  "Key Figures / Tables (with descriptions)": [
    { "figure": "Figure 1", "description": "Sample images generated by unCLIP demonstrating high diversity and photorealism." },
    { "figure": "Figure 2", "description": "Diagram of the unCLIP architecture including CLIP, prior, and decoder." },
    { "figure": "Figure 4", "description": "Image interpolations using CLIP latent space." },
    { "figure": "Figure 5", "description": "Language-guided image edits via CLIP text diffs." },
    { "table": "Table 1", "description": "Human evaluation comparing unCLIP (AR and Diffusion priors) to GLIDE on photorealism, caption similarity, and diversity." },
    { "table": "Table 2", "description": "FID scores on MS-COCO for various models including unCLIP and GLIDE." },
    { "figure": "Figure 11", "description": "FID versus guidance scale comparison for unCLIP and GLIDE." }
  ],
  "References to Notable Prior Work": [
    "CLIP: Radford et al. (2021)",
    "GLIDE: Nichol et al. (2021)",
    "DALL-E: Ramesh et al. (2021)",
    "Diffusion models: Ho et al. (2020); Dhariwal and Nichol (2021)",
    "Classifier-free guidance: Ho and Salimans (2021)"
  ],
  "Keywords / Topics": [
    "Text-to-Image Generation",
    "Diffusion Models",
    "CLIP",
    "Latent Representations",
    "Image Editing",
    "Zero-shot Learning",
    "Contrastive Learning",
    "Image Synthesis"
  ]
}`,
  },
];
