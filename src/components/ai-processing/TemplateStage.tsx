import { useState } from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TemplateStageProps {
  importedData?: any[];
  onComplete: (templates: any) => void;
  className?: string;
}

interface Template {
  id: string;
  name: string;
  systemPrompt: string;
  userTemplate: string;
}

interface Example {
  id: string;
  input: string;
  expectedOutput: string;
}

const TemplateStage: React.FC<TemplateStageProps> = ({ 
  importedData, 
  onComplete, 
  className 
}) => {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Default Template',
      systemPrompt: 'You are a helpful AI assistant.',
      userTemplate: 'Process this data: {{data}}'
    }
  ]);
  
  const [examples, setExamples] = useState<Example[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('1');

  const addTemplate = () => {
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: `Template ${templates.length + 1}`,
      systemPrompt: '',
      userTemplate: ''
    };
    setTemplates([...templates, newTemplate]);
    setSelectedTemplate(newTemplate.id);
  };

  const updateTemplate = (id: string, field: keyof Template, value: string) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const deleteTemplate = (id: string) => {
    if (templates.length > 1) {
      setTemplates(templates.filter(t => t.id !== id));
      if (selectedTemplate === id) {
        setSelectedTemplate(templates.find(t => t.id !== id)?.id || '');
      }
    }
  };

  const addExample = () => {
    const newExample: Example = {
      id: Date.now().toString(),
      input: '',
      expectedOutput: ''
    };
    setExamples([...examples, newExample]);
  };

  const updateExample = (id: string, field: keyof Example, value: string) => {
    setExamples(examples.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const deleteExample = (id: string) => {
    setExamples(examples.filter(e => e.id !== id));
  };

  const handleContinue = () => {
    onComplete({
      templates,
      examples,
      selectedTemplate
    });
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Setup Templates & Prompts
          </CardTitle>
          <CardDescription>
            Create prompts and message templates for processing your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Templates</Label>
              <Button variant="outline" size="sm" onClick={addTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {templates.map(template => (
                <div key={template.id} className="flex items-center gap-1">
                  <Button
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    {template.name}
                  </Button>
                  {templates.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                      className="px-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Template Editor */}
          {currentTemplate && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={currentTemplate.name}
                  onChange={(e) => updateTemplate(currentTemplate.id, 'name', e.target.value)}
                  placeholder="Enter template name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={currentTemplate.systemPrompt}
                  onChange={(e) => updateTemplate(currentTemplate.id, 'systemPrompt', e.target.value)}
                  placeholder="Enter the system prompt that defines the AI's role and behavior"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-template">User Message Template</Label>
                <Textarea
                  id="user-template"
                  value={currentTemplate.userTemplate}
                  onChange={(e) => updateTemplate(currentTemplate.id, 'userTemplate', e.target.value)}
                  placeholder="Enter the user message template. Use {{field_name}} to insert data fields"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Use double curly braces like {'{{data}}'} to insert data from your imported records
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Examples Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Examples</h3>
                <p className="text-sm text-muted-foreground">
                  Provide input/output examples to guide the AI processing
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addExample}>
                <Plus className="w-4 h-4 mr-2" />
                Add Example
              </Button>
            </div>

            {examples.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No examples yet. Add some to improve processing quality.
              </div>
            ) : (
              <div className="space-y-4">
                {examples.map(example => (
                  <div key={example.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Example {examples.indexOf(example) + 1}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExample(example.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Input</Label>
                        <Textarea
                          value={example.input}
                          onChange={(e) => updateExample(example.id, 'input', e.target.value)}
                          placeholder="Example input data"
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Expected Output</Label>
                        <Textarea
                          value={example.expectedOutput}
                          onChange={(e) => updateExample(example.id, 'expectedOutput', e.target.value)}
                          placeholder="Expected AI response"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleContinue}>
          Continue to Processing
        </Button>
      </div>
    </div>
  );
};

export { TemplateStage };