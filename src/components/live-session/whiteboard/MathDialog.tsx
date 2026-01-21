import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (latex: string) => void;
}

const MATH_TEMPLATES = {
  basic: [
    { label: 'Fraction', latex: '\\frac{a}{b}' },
    { label: 'Square Root', latex: '\\sqrt{x}' },
    { label: 'Nth Root', latex: '\\sqrt[n]{x}' },
    { label: 'Power', latex: 'x^{n}' },
    { label: 'Subscript', latex: 'x_{n}' },
    { label: 'Absolute', latex: '|x|' },
  ],
  algebra: [
    { label: 'Quadratic', latex: 'ax^2 + bx + c = 0' },
    { label: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
    { label: 'Binomial', latex: '(a + b)^n' },
    { label: 'Factorial', latex: 'n!' },
    { label: 'Combination', latex: '\\binom{n}{k}' },
    { label: 'Logarithm', latex: '\\log_b(x)' },
  ],
  calculus: [
    { label: 'Limit', latex: '\\lim_{x \\to a} f(x)' },
    { label: 'Derivative', latex: '\\frac{df}{dx}' },
    { label: 'Partial Derivative', latex: '\\frac{\\partial f}{\\partial x}' },
    { label: 'Integral', latex: '\\int f(x) \\, dx' },
    { label: 'Definite Integral', latex: '\\int_{a}^{b} f(x) \\, dx' },
    { label: 'Double Integral', latex: '\\iint f(x,y) \\, dA' },
    { label: 'Sum', latex: '\\sum_{i=1}^{n} x_i' },
    { label: 'Product', latex: '\\prod_{i=1}^{n} x_i' },
    { label: 'Infinity', latex: '\\infty' },
  ],
  greek: [
    { label: 'Alpha', latex: '\\alpha' },
    { label: 'Beta', latex: '\\beta' },
    { label: 'Gamma', latex: '\\gamma' },
    { label: 'Delta', latex: '\\delta' },
    { label: 'Epsilon', latex: '\\epsilon' },
    { label: 'Theta', latex: '\\theta' },
    { label: 'Lambda', latex: '\\lambda' },
    { label: 'Mu', latex: '\\mu' },
    { label: 'Pi', latex: '\\pi' },
    { label: 'Sigma', latex: '\\sigma' },
    { label: 'Omega', latex: '\\omega' },
    { label: 'Phi', latex: '\\phi' },
  ],
  trigonometry: [
    { label: 'Sine', latex: '\\sin(x)' },
    { label: 'Cosine', latex: '\\cos(x)' },
    { label: 'Tangent', latex: '\\tan(x)' },
    { label: 'Arc Sine', latex: '\\arcsin(x)' },
    { label: 'Arc Cosine', latex: '\\arccos(x)' },
    { label: 'Arc Tangent', latex: '\\arctan(x)' },
  ],
  matrices: [
    { label: '2x2 Matrix', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: '3x3 Matrix', latex: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}' },
    { label: 'Determinant', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
    { label: 'Bracket Matrix', latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
  ],
  physics: [
    { label: 'E=mc²', latex: 'E = mc^2' },
    { label: 'Force', latex: 'F = ma' },
    { label: "Newton's Gravitation", latex: 'F = G\\frac{m_1 m_2}{r^2}' },
    { label: 'Kinetic Energy', latex: 'KE = \\frac{1}{2}mv^2' },
    { label: "Schrödinger", latex: 'i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi' },
    { label: 'Wave Equation', latex: 'c = f\\lambda' },
  ],
};

export function MathDialog({ open, onOpenChange, onInsert }: MathDialogProps) {
  const [latex, setLatex] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (latex) {
      try {
        const rendered = katex.renderToString(latex, {
          throwOnError: true,
          displayMode: true,
        });
        setPreview(rendered);
        setError('');
      } catch (err) {
        setError((err as Error).message);
        setPreview('');
      }
    } else {
      setPreview('');
      setError('');
    }
  }, [latex]);

  const handleInsert = () => {
    if (latex && !error) {
      onInsert(latex);
      setLatex('');
      onOpenChange(false);
    }
  };

  const handleTemplateClick = (template: string) => {
    setLatex((prev) => prev + template);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold gradient-text">
            Insert Math Equation
          </DialogTitle>
          <DialogDescription>
            Write LaTeX or use templates below. Preview updates in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="latex-input" className="text-sm font-medium">
              LaTeX Formula
            </Label>
            <Input
              id="latex-input"
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="e.g. \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              className="font-mono text-sm"
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="min-h-[80px] p-6 bg-secondary rounded-xl flex items-center justify-center border border-border">
              {error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : preview ? (
                <div
                  dangerouslySetInnerHTML={{ __html: preview }}
                  className="text-2xl"
                />
              ) : (
                <p className="text-muted-foreground text-sm">
                  Your equation preview will appear here
                </p>
              )}
            </div>
          </div>

          {/* Templates */}
          <div className="flex-1 overflow-hidden">
            <Label className="text-sm font-medium mb-2 block">Templates</Label>
            <Tabs defaultValue="basic" className="h-full">
              <TabsList className="grid grid-cols-7 w-full">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="algebra">Algebra</TabsTrigger>
                <TabsTrigger value="calculus">Calculus</TabsTrigger>
                <TabsTrigger value="trig">Trig</TabsTrigger>
                <TabsTrigger value="greek">Greek</TabsTrigger>
                <TabsTrigger value="matrices">Matrices</TabsTrigger>
                <TabsTrigger value="physics">Physics</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[180px] mt-2">
                <TabsContent value="basic" className="mt-0">
                  <TemplateGrid
                    templates={MATH_TEMPLATES.basic}
                    onClick={handleTemplateClick}
                  />
                </TabsContent>
                <TabsContent value="algebra" className="mt-0">
                  <TemplateGrid
                    templates={MATH_TEMPLATES.algebra}
                    onClick={handleTemplateClick}
                  />
                </TabsContent>
                <TabsContent value="calculus" className="mt-0">
                  <TemplateGrid
                    templates={MATH_TEMPLATES.calculus}
                    onClick={handleTemplateClick}
                  />
                </TabsContent>
                <TabsContent value="trig" className="mt-0">
                  <TemplateGrid
                    templates={MATH_TEMPLATES.trigonometry}
                    onClick={handleTemplateClick}
                  />
                </TabsContent>
                <TabsContent value="greek" className="mt-0">
                  <TemplateGrid
                    templates={MATH_TEMPLATES.greek}
                    onClick={handleTemplateClick}
                  />
                </TabsContent>
                <TabsContent value="matrices" className="mt-0">
                  <TemplateGrid
                    templates={MATH_TEMPLATES.matrices}
                    onClick={handleTemplateClick}
                  />
                </TabsContent>
                <TabsContent value="physics" className="mt-0">
                  <TemplateGrid
                    templates={MATH_TEMPLATES.physics}
                    onClick={handleTemplateClick}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!latex || !!error}>
            Insert Equation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateGridProps {
  templates: { label: string; latex: string }[];
  onClick: (latex: string) => void;
}

function TemplateGrid({ templates, onClick }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {templates.map((t) => (
        <button
          key={t.latex}
          onClick={() => onClick(t.latex)}
          className="p-3 bg-card hover:bg-secondary rounded-lg border border-border transition-colors text-left group"
        >
          <p className="text-xs text-muted-foreground mb-1 group-hover:text-foreground transition-colors">
            {t.label}
          </p>
          <div
            className="text-sm"
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(t.latex, {
                throwOnError: false,
                displayMode: false,
              }),
            }}
          />
        </button>
      ))}
    </div>
  );
}
