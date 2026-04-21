import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Upload, RefreshCw, Download } from 'lucide-react';

export default function DesignPreviewEditor({ mockupUrl, onSave }) {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [activeObject, setActiveObject] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initCanvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      preserveObjectStacking: true
    });

    if (mockupUrl) {
      fabric.Image.fromURL(mockupUrl, (img) => {
        // Scale image to fit canvas
        const scale = Math.min(500 / img.width, 500 / img.height);
        img.set({
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          left: 250,
          top: 250,
          selectable: false,
          evented: false
        });
        initCanvas.setBackgroundImage(img, initCanvas.renderAll.bind(initCanvas));
      }, { crossOrigin: 'anonymous' });
    }

    initCanvas.on('selection:created', (e) => setActiveObject(e.selected[0]));
    initCanvas.on('selection:updated', (e) => setActiveObject(e.selected[0]));
    initCanvas.on('selection:cleared', () => setActiveObject(null));

    setCanvas(initCanvas);

    return () => {
      initCanvas.dispose();
    };
  }, [mockupUrl]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target.result;
      fabric.Image.fromURL(data, (img) => {
        img.scaleToWidth(200);
        img.set({
          left: 250,
          top: 250,
          originX: 'center',
          originY: 'center',
          cornerColor: '#2563eb',
          cornerStrokeColor: '#2563eb',
          borderColor: '#2563eb',
          transparentCorners: false,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const handleScale = (value) => {
    if (!activeObject || !canvas) return;
    activeObject.scale(value[0] / 100);
    canvas.renderAll();
  };

  const handleDelete = () => {
    if (!activeObject || !canvas) return;
    canvas.remove(activeObject);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const handleSave = () => {
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.renderAll();
    const dataUrl = canvas.toDataURL({ format: 'png', quality: 1 });
    if (onSave) onSave(dataUrl);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-xl overflow-hidden bg-muted/30 flex justify-center items-center p-4">
        <canvas ref={canvasRef} className="border shadow-sm bg-white rounded-lg" />
      </div>
      
      <div className="flex flex-wrap gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
          <Label htmlFor="design-upload" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <Upload className="mr-2 h-4 w-4" /> Add Design
          </Label>
          <input id="design-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        {activeObject && (
          <div className="flex items-center gap-4 flex-1 max-w-xs">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Scale</Label>
            <Slider 
              defaultValue={[100]} 
              max={300} 
              min={10} 
              step={1} 
              onValueChange={handleScale} 
            />
            <Button variant="destructive" size="sm" onClick={handleDelete}>Remove</Button>
          </div>
        )}

        <Button variant="outline" onClick={handleSave}>
          <Download className="mr-2 h-4 w-4" /> Save Preview
        </Button>
      </div>
    </div>
  );
}
