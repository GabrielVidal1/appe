# APPE: AI Processing Price Estimator

A comprehensive web application that helps you estimate and compare costs across
**~4,900 models from ~144 providers** for different types of data processing
tasks. Pricing is sourced from the [models.dev](https://models.dev) database and
refreshed daily.

**Live:** https://appe.dev.gabvdl.xyz

![screenshot](./doc/screen.png)

## 🚀 Features

### Multi-Provider Cost Comparison

- Compare pricing across every major provider — OpenAI, Anthropic, Google,
  Mistral, xAI, DeepSeek, Meta, Groq, Cohere, Together, Amazon Bedrock and many
  more (the same model is often listed under several providers at different
  prices, so you can compare where to buy it)
- Filter by provider, model tier (small/medium/large), and capability tags
- Real-time cost calculations based on token usage

### Data Type Support

- **Text Prompts**: Standard text processing and generation
- **Images**: Image analysis with size-based token calculation
- **PDFs**: Document processing with page-based token estimation
- **Audio**: Duration-based token estimation (default ~32 tokens/sec, editable),
  priced with the model's dedicated audio rate when available

### Advanced Token Estimation

- Accurate token counting for input and output
- Provider-specific image token calculations
- Batch processing cost estimates

### Interactive Features

- **Live Results**: Real-time pricing updates as you modify inputs
- **Export Options**: Download results as images or copy as text
- **Example Templates**: Pre-built templates for common use cases
- **Model Filtering**: Filter by provider, model size, and capabilities

### Visual Analytics

- Price range visualization with cost comparisons
- Token breakdown (input vs output)
- Best value recommendations
- Interactive charts and summaries

## 📋 Use Cases

- **Content Creation**: Estimate costs for generating articles, summaries, or translations
- **Image Analysis**: Calculate expenses for image description and analysis tasks
- **Document Processing**: Budget for PDF analysis and extraction workflows
- **API Planning**: Compare providers before implementing AI features
- **Cost Optimization**: Find the most cost-effective models for your specific needs

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite
- **Form Management**: React Hook Form
- **State Management**: React Context API
- **Icons**: Lucide React

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js (recommended: install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm

### Installation

1. **Clone the repository**

   ```bash
   git clone <YOUR_GIT_URL>
   cd prompt-price-predictor
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📖 How to Use

### Basic Workflow

1. **Select Data Type**: Choose between prompts, images, PDFs, or audio
2. **Enter Your Prompt**: Describe the task you want the AI to perform
3. **Provide Example Output**: Show what kind of response you expect
4. **Set Data Count**: Specify how many items you want to process
5. **Configure Options**: Select model size and capabilities if needed
6. **View Results**: Compare costs across all providers and models

### Example Scenarios

#### Text Summarization

```
Data Type: Prompts
Prompt: "Summarize the following article: [article text]"
Example: "Brief summary highlighting key points..."
Data Count: 100 articles
```

#### Image Description

```
Data Type: Images
Prompt: "Describe the content of this image"
Example: "The image shows a sunset over mountains..."
Data Count: 500 images
Image Size: 1024x1024
```

#### PDF Analysis

```
Data Type: PDFs
Prompt: "Extract key information from this research paper"
Example: "Title: ..., Authors: ..., Key Findings: ..."
Data Count: 50 documents
```

## 📊 Model data (models.dev)

The model catalogue is **generated**, not hand-maintained. `scripts/sync-models.mjs`
pulls it from the [models.dev](https://models.dev) API (`/api.json`) plus the
per-provider logos, and writes the local database under `src/data/`:

- `models.json` — every estimable model across all providers
- `provider_data.json` — provider display names, batch discounts, PDF pricing
- `models.meta.json` — source, generation timestamp and counts
- `public/logos/*.svg` — provider logos (inlined so they adapt to dark mode)

```bash
node scripts/sync-models.mjs   # refresh the local model + logo data
```

A daily cron (`scripts/sync-and-deploy.sh`) runs the sync, rebuilds and
redeploys, so the live site stays current. Each model includes input/output
(and, where available, cached and audio) token costs, context-window size,
capability tags (vision, audio, video, reasoning, tools, opensource) and a
tier classification.

## 🎨 Features in Detail

### Token Estimation

- **Text**: tokenizer-based counting (OpenAI o200k) with a ~4-chars/token fallback
- **Images**: Provider-specific calculations (Anthropic: width×height/750, OpenAI: tile-based, others: default)
- **PDFs**: Page-based token multiplication (or per-page pricing where the provider bills that way)
- **Audio**: Duration × tokens/second (default ~32 tok/s), priced with the model's dedicated audio rate when models.dev provides one

### Export Options

- **Image Export**: Generate shareable cost estimation graphics
- **Text Export**: Copy formatted results to clipboard
- **Summary Cards**: Visual cost breakdowns

### Filtering & Search

- Filter by provider, model tier, or capabilities
- Search models by name
- Sort results by cost or performance

## 🚢 Deployment

The app is a static build deployed to zipgo on raspy2 at
`appe.dev.gabvdl.xyz` (Let's Encrypt HTTPS):

```bash
npm run deploy   # build + rsync dist/ to zipgo (scripts/deploy.sh)
```

A daily cron runs `scripts/sync-and-deploy.sh` to refresh the models.dev data
and redeploy automatically.

---

Built with ❤️ using React, TypeScript, and Tailwind CSS · model data from
[models.dev](https://models.dev)
