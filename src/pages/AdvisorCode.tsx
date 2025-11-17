import React, { useState, useEffect } from 'react';
import { Copy, Check, Code, FileCode, Palette, Globe, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserCompany } from '../lib/api';
import { supabase } from '../lib/supabase';

type CodeTab = 'live' | 'javascript' | 'css' | 'html';

interface AdvisorCodeData {
  id: string;
  company_id: string;
  live: string | null;
  javascript: string | null;
  css: string | null;
  html: string | null;
}

const AdvisorCode: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<CodeTab>('live');
  const [codeData, setCodeData] = useState<AdvisorCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: 'live' as CodeTab, label: 'Live', icon: Globe },
    { id: 'javascript' as CodeTab, label: 'JavaScript', icon: Code },
    { id: 'css' as CodeTab, label: 'CSS', icon: Palette },
    { id: 'html' as CodeTab, label: 'HTML', icon: FileCode },
  ];

  useEffect(() => {
    fetchAdvisorCode();
  }, [user]);

  const fetchAdvisorCode = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const companyId = await getUserCompany(user.id);

      if (!companyId) {
        console.error('No company ID found for user');
        return;
      }

      const { data, error } = await supabase
        .from('advisor_code')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;

      setCodeData(data);
    } catch (error) {
      console.error('Error fetching advisor code:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentCode = () => {
    if (!codeData) return '';
    return codeData[activeTab] || '';
  };

  const handleCopy = async () => {
    const code = getCurrentCode();
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleDownload = () => {
    const code = getCurrentCode();
    if (!code) return;

    const fileExtension = activeTab === 'live' ? 'html' : activeTab;
    const fileName = `advisor-code.${fileExtension}`;

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderCodeWithLineNumbers = (code: string) => {
    if (!code) return <div className="text-neutral-400 p-4">No code available</div>;

    const lines = code.split('\n');
    const maxLines = 50;
    const displayLines = lines.slice(0, maxLines);
    const hasMore = lines.length > maxLines;

    return (
      <div className="flex font-mono text-sm">
        <div className="select-none text-neutral-400 pr-4 border-r border-neutral-200 text-right">
          {displayLines.map((_, index) => (
            <div key={index} className="leading-6">
              {index + 1}
            </div>
          ))}
          {hasMore && <div className="leading-6 text-neutral-300">...</div>}
        </div>
        <div className="pl-4 flex-1 overflow-x-auto">
          {displayLines.map((line, index) => (
            <div key={index} className="leading-6 whitespace-pre">
              {line || ' '}
            </div>
          ))}
          {hasMore && (
            <div className="leading-6 text-neutral-400 italic">
              ... {lines.length - maxLines} more lines
            </div>
          )}
        </div>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-neutral-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Advisor Code</h1>
        <p className="text-neutral-600">View and copy your advisor agent codebase</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="border-b border-neutral-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-800 hover:border-neutral-300'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors shadow-sm"
              disabled={!getCurrentCode()}
            >
              <Download size={16} />
              <span className="text-sm">Download</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors shadow-sm"
              disabled={!getCurrentCode()}
            >
              {copied ? (
                <>
                  <Check size={16} className="text-green-600" />
                  <span className="text-sm text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span className="text-sm">Copy </span>
                </>
              )}
            </button>
          </div>

          <div className="p-6 bg-neutral-50 min-h-[500px]">
            {renderCodeWithLineNumbers(getCurrentCode())}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorCode;
