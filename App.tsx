
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Download, Upload, X, GripVertical, Trash2, Edit2, Check, FileText } from 'lucide-react';
import { MapData, JourneyItem, ItemType } from './types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Components ---

interface StepPillProps {
  item: JourneyItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
}

const StepPill: React.FC<StepPillProps> = ({ item, onDelete, onUpdate, onDragStart, onDragOver, onDrop }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(item.content);

  const handleSubmit = () => {
    onUpdate(item.id, value);
    setIsEditing(false);
  };

  const isSystem = item.type === 'system';
  const isSection = item.type === 'section';

  if (isSection) {
    return (
      <div 
        draggable
        onDragStart={(e) => onDragStart(e, item.id)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, item.id)}
        className="group relative mb-6 mt-8 first:mt-2"
      >
        <div className="flex items-center gap-2 mb-2">
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full text-xl font-semibold border-b-2 border-accent outline-none bg-transparent py-1"
              />
              <button onClick={handleSubmit} className="text-accent hover:opacity-80"><Check size={20} /></button>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-primary/80 uppercase tracking-wider flex-1">
                {item.content || "Unnamed Section"}
              </h3>
              <div className="hidden group-hover:flex items-center gap-2">
                <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-primary"><Edit2 size={16} /></button>
                <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </>
          )}
        </div>
        <div className="h-0.5 bg-slate-200 w-full rounded-full"></div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, item.id)}
      className={`group relative mb-3 flex items-center gap-3 p-4 rounded-full border shadow-sm transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${
        isSystem 
          ? 'bg-accent text-white border-accent' 
          : 'bg-white text-primary border-slate-100'
      }`}
    >
      <GripVertical size={18} className={isSystem ? 'text-white/50' : 'text-slate-300'} />
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className={`w-full bg-transparent outline-none ${isSystem ? 'text-white' : 'text-primary'}`}
          />
        ) : (
          <p 
            className="truncate font-medium select-none"
            onDoubleClick={() => setIsEditing(true)}
          >
            {item.content || (isSystem ? "New system step..." : "New journey step...")}
          </p>
        )}
      </div>
      <div className="hidden group-hover:flex items-center gap-1">
        <button 
          onClick={() => setIsEditing(true)}
          className={`p-1 rounded-full transition-colors ${isSystem ? 'hover:bg-white/20' : 'hover:bg-slate-100'}`}
        >
          <Edit2 size={14} />
        </button>
        <button 
          onClick={() => onDelete(item.id)}
          className={`p-1 rounded-full transition-colors ${isSystem ? 'hover:bg-white/20' : 'hover:bg-red-50'}`}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [mapData, setMapData] = useState<MapData>(() => {
    const saved = localStorage.getItem('innovate_system_map');
    return saved ? JSON.parse(saved) : {
      title: 'New Customer Journey',
      current: { id: 'current', title: 'Current State', items: [] },
      future: { id: 'future', title: 'Future State', items: [] }
    };
  });

  const [draggedItemId, setDraggedItemId] = useState<{ id: string, colId: 'current' | 'future' } | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('innovate_system_map', JSON.stringify(mapData));
  }, [mapData]);

  const handleUpdateTitle = (newTitle: string) => {
    setMapData(prev => ({ ...prev, title: newTitle }));
  };

  const addItem = (colId: 'current' | 'future', type: ItemType) => {
    const newItem: JourneyItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: type === 'section' ? 'New Section' : ''
    };
    setMapData(prev => ({
      ...prev,
      [colId]: {
        ...prev[colId],
        items: [...prev[colId].items, newItem]
      }
    }));
  };

  const deleteItem = (colId: 'current' | 'future', itemId: string) => {
    setMapData(prev => ({
      ...prev,
      [colId]: {
        ...prev[colId],
        items: prev[colId].items.filter(i => i.id !== itemId)
      }
    }));
  };

  const updateItem = (colId: 'current' | 'future', itemId: string, content: string) => {
    setMapData(prev => ({
      ...prev,
      [colId]: {
        ...prev[colId],
        items: prev[colId].items.map(i => i.id === itemId ? { ...i, content } : i)
      }
    }));
  };

  // Drag & Drop
  const onDragStart = (e: React.DragEvent, id: string, colId: 'current' | 'future') => {
    setDraggedItemId({ id, colId });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, targetId: string, targetColId: 'current' | 'future') => {
    e.preventDefault();
    if (!draggedItemId) return;

    const sourceColId = draggedItemId.colId;
    const sourceItemId = draggedItemId.id;

    if (sourceColId !== targetColId) return; // Only reorder within same column for simplicity

    const items = [...mapData[targetColId].items];
    const fromIndex = items.findIndex(i => i.id === sourceItemId);
    const toIndex = items.findIndex(i => i.id === targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      items.splice(toIndex, 0, items.splice(fromIndex, 1)[0]);
      setMapData(prev => ({
        ...prev,
        [targetColId]: { ...prev[targetColId], items }
      }));
    }
    setDraggedItemId(null);
  };

  // PDF Export
  const exportPDF = async () => {
    if (!mapRef.current) return;
    
    const canvas = await html2canvas(mapRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#F8F9FA'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${mapData.title.replace(/\s+/g, '_')}_Journey_Map.pdf`);
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setUploadFiles(prev => [...prev, ...Array.from(e.dataTransfer.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    alert(`Uploading ${uploadFiles.length} files...`);
    setUploadFiles([]);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-accent/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white font-bold">I2</div>
            <input 
              value={mapData.title}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              className="text-2xl font-bold text-primary bg-transparent border-none focus:outline-none focus:ring-0 w-[400px]"
            />
          </div>
          <div className="flex items-center gap-4">
             <button 
              onClick={exportPDF}
              className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-full font-semibold hover:opacity-90 transition-all shadow-lg shadow-accent/20"
            >
              <Download size={18} />
              Export PDF
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-8 py-12">
        {/* Mapping Canvas */}
        <div ref={mapRef} className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-canvas rounded-3xl p-8 min-h-[600px]">
          
          {/* Column Component Render */}
          {(['current', 'future'] as const).map((colId) => (
            <div key={colId} className="flex flex-col">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                <h2 className="text-3xl font-bold text-primary">{mapData[colId].title}</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => addItem(colId, 'section')}
                    className="p-2 bg-white text-slate-500 rounded-full border border-slate-100 shadow-sm hover:text-accent hover:border-accent/20 transition-all"
                    title="Add Section"
                  >
                    <FileText size={18} />
                  </button>
                  <button 
                    onClick={() => addItem(colId, 'step')}
                    className="p-2 bg-white text-slate-500 rounded-full border border-slate-100 shadow-sm hover:text-accent hover:border-accent/20 transition-all"
                    title="Add Journey Step"
                  >
                    <Plus size={18} />
                  </button>
                  <button 
                    onClick={() => addItem(colId, 'system')}
                    className="p-2 bg-accent text-white rounded-full shadow-lg shadow-accent/10 hover:opacity-90 transition-all"
                    title="Add System Step"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-1">
                {mapData[colId].items.length === 0 ? (
                  <div className="h-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-items justify-center py-20 text-slate-400">
                    <p>Start by adding a section or a step</p>
                  </div>
                ) : (
                  mapData[colId].items.map((item) => (
                    <StepPill 
                      key={item.id} 
                      item={item} 
                      onDelete={(id) => deleteItem(colId, id)}
                      onUpdate={(id, content) => updateItem(colId, id, content)}
                      onDragStart={(e, id) => onDragStart(e, id, colId)}
                      onDragOver={onDragOver}
                      onDrop={(e, id) => onDrop(e, id, colId)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Upload Section */}
        <section className="mt-20">
          <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-xl shadow-slate-200/40">
            <h2 className="text-2xl font-bold mb-2">Supporting Documents</h2>
            <p className="text-slate-500 mb-8">Upload research, personas or technical specifications relevant to this map.</p>

            <div 
              onDragOver={onDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-accent/30 hover:bg-accent/5 transition-all group"
            >
              <input 
                type="file" 
                multiple 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
              />
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 group-hover:bg-accent/10 group-hover:text-accent transition-all">
                <Upload size={32} />
              </div>
              <p className="text-lg font-medium text-slate-700">Click or drag and drop files here</p>
              <p className="text-sm text-slate-400 mt-1">PDF, JPG, PNG or DOCX up to 50MB</p>
            </div>

            {uploadFiles.length > 0 && (
              <div className="mt-8">
                <div className="space-y-3">
                  {uploadFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <FileText className="text-accent" size={20} />
                        <div>
                          <p className="font-medium text-sm truncate max-w-[400px]">{file.name}</p>
                          <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(idx)}
                        className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleUpload}
                  className="mt-6 w-full py-4 bg-accent text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-accent/20"
                >
                  Upload files
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="max-w-[1440px] mx-auto px-8 py-12 mt-12 border-t border-slate-100 flex justify-between items-center text-slate-400 text-sm">
        <p>&copy; 2024 Innovate System 2. All rights reserved.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-accent">Terms of service</a>
          <a href="#" className="hover:text-accent">Privacy policy</a>
        </div>
      </footer>
    </div>
  );
}
