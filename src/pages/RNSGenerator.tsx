import React, { useState, useEffect } from 'react';
import { Wand2, Copy, CheckCircle, Check } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

const RNSGenerator: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [rnsType, setRnsType] = useState<'RNS' | 'RNS Reach'>('RNS');
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchAssistantId = async () => {
      if (!user?.id) return;

      try {
        const companyId = await getUserCompany(user.id);
        if (!companyId) return;

        const { data, error } = await supabase
          .from('company_profiles')
          .select('assistant_id')
          .eq('id', companyId)
          .single();

        if (error) throw error;
        setAssistantId(data?.assistant_id);
      } catch (err) {
        console.error('Error fetching assistant ID:', err);
      }
    };

    fetchAssistantId();
  }, [user]);

  const generateProjectName = () => {
    const adjectives = ['Blue', 'Red', 'Green', 'Silver', 'Gold', 'Crystal', 'Swift', 'Bright', 'Alpha', 'Nova'];
    const nouns = ['Star', 'Moon', 'Sun', 'Sky', 'Ocean', 'Mountain', 'River', 'Forest', 'Peak', 'Valley'];
    const numbers = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

    const randomWord = (array: string[]) => array[Math.floor(Math.random() * array.length)];
    const newProjectName = `${randomWord(adjectives)}.${randomWord(nouns)}.${randomWord(numbers)}`;

    setProjectName(newProjectName);
  };

  const handleGenerate = async () => {
    if (!projectName.trim() || !subject.trim() || !description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContent('');

    try {
      const response = await fetch('https://pri0r1ty.app.n8n.cloud/webhook/25e0d499-6af1-4357-8c23-a1b43d7bedb8', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: projectName,
          subject,
          description,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          assistant_id: assistantId,
          rns_type: rnsType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      let content = data.output || data.content || '';
      
      const endIndex = content.indexOf('---\n\nEND');
      if (endIndex !== -1) {
        content = content.substring(0, endIndex + 9);
      }
      
      setGeneratedContent(content);
      setEditableContent(content);
      setIsApproved(false);
      setActiveTab('output');
    } catch (err) {
      console.error('Error generating RNS:', err);
      setError('Failed to generate RNS content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const contentToCopy = isEditing ? editableContent : generatedContent;
      await navigator.clipboard.writeText(contentToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditableContent(generatedContent);
  };

  const handleSaveEdit = () => {
    setGeneratedContent(editableContent);
    setIsEditing(false);
    setIsApproved(false);
  };

  const handleCancelEdit = () => {
    setEditableContent(generatedContent);
    setIsEditing(false);
  };

  const handleSaveDraft = async () => {
    if (!user?.id || !generatedContent) return;

    setIsSaving(true);
    try {
      const companyId = await getUserCompany(user.id);
      if (!companyId) {
        setError('No company found');
        return;
      }

      // First create the market sounding
      const { data: soundingData, error: soundingError } = await supabase
        .from('market_soundings')
        .insert({
          company_id: companyId,
          subject,
          description,
          project_name: projectName,
          status: 'Live'
        })
        .select()
        .single();

      if (soundingError) throw soundingError;

      // Then create the RNS draft
      const { data: rnsData, error: rnsError } = await supabase
        .from('rns_documents')
        .insert({
          company_id: companyId,
          title: subject,
          content: generatedContent,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (rnsError) throw rnsError;

      setIsApproved(true);
      setTimeout(() => {
        setIsApproved(false);
      }, 2000);

    } catch (err) {
      console.error('Error saving:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderMarkdown = (content: string) => {
    return content
      .replace