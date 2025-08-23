'use client';

import React, { useState } from 'react';
import { TemplateLibrary } from '@/components/templates/template-library';
import { TemplateEditor } from '@/components/templates/template-editor';
import { useTemplateStore } from '@/lib/stores/template-store';
import type { Template } from '@/lib/types/templates';

export default function TemplatesPage() {
  const [view, setView] = useState<'library' | 'editor'>('library');
  const { selectedTemplate, selectTemplate } = useTemplateStore();

  const handleEditTemplate = (template: Template | null) => {
    selectTemplate(template);
    setView('editor');
  };

  const handleSaveTemplate = (template: Template) => {
    selectTemplate(null);
    setView('library');
  };

  const handleCancelEdit = () => {
    selectTemplate(null);
    setView('library');
  };

  return (
    <div className="container mx-auto py-6">
      {view === 'library' ? (
        <TemplateLibrary />
      ) : (
        <TemplateEditor
          template={selectedTemplate}
          onSave={handleSaveTemplate}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
}