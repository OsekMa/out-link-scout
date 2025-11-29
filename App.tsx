import React, { useState, useCallback } from 'react';
import { extractLinks, isValidUrl } from './utils/urlHelper';
import { CrawlResult, CrawlStatus, LinkData, AnalysisStatus } from './types';
import { Icons } from './components/Icons';
import { LinkTable } from './components/LinkTable';
import { categorizeLinks } from './services/geminiService';

const PROXY_URL = 'https://corsproxy.io/?';

const App: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [status, setStatus] = useState<CrawlStatus>(CrawlStatus.IDLE);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCrawl = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl(targetUrl)) {
      setErrorMsg('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setStatus(CrawlStatus.LOADING);
    setResult(null);
    setErrorMsg('');
    setAnalysisStatus(AnalysisStatus.IDLE);

    try {
      // Encode the URL to ensure special characters are handled correctly by the proxy
      const encodedUrl = encodeURIComponent(targetUrl);
      const fetchUrl = `${PROXY_URL}${encodedUrl}`;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`Failed to fetch page data (Status: ${response.status}).`);
      
      // corsproxy.io returns the raw HTML text, not JSON
      const htmlContent = await response.text();
      
      if (!htmlContent) throw new Error('No content received from proxy.');

      const links = extractLinks(htmlContent, targetUrl);
      
      setResult({
        url: targetUrl,
        totalFound: links.length, // This represents external links kept
        externalCount: links.length,
        internalCount: 0, 
        links: links,
        timestamp: Date.now(),
      });
      setStatus(CrawlStatus.SUCCESS);

    } catch (err: any) {
      console.error(err);
      setStatus(CrawlStatus.ERROR);
      setErrorMsg(err.message || 'An error occurred while crawling.');
    }
  }, [targetUrl]);

  const handleAnalyze = async () => {
    if (!result || result.links.length === 0) return;
    
    setAnalysisStatus(AnalysisStatus.ANALYZING);
    try {
      const categoryMap = await categorizeLinks(result.links);
      
      const updatedLinks = result.links.map(link => ({
        ...link,
        category: categoryMap.get(link.hostname) || 'Uncategorized'
      }));

      setResult({
        ...result,
        links: updatedLinks
      });
      setAnalysisStatus(AnalysisStatus.DONE);
    } catch (err) {
      console.error(err);
      // We don't block the UI, just show error in console or toast ideally
      setAnalysisStatus(AnalysisStatus.ERROR);
    }
  };

  const handleExport = () => {
    if (!result) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "URL,Anchor Text,Hostname,Category\n"
      + result.links.map(l => `"${l.href}","${l.text.replace(/"/g, '""')}","${l.hostname}","${l.category || ''}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `outbound-links-${new URL(result.url).hostname}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Icons.Globe className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">LinkOut Scout</h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Outbound Link Extractor
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        {/* Search Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <form onSubmit={handleCrawl} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icons.Link className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="url"
                required
                placeholder="Enter website URL (e.g., https://techcrunch.com)"
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={status === CrawlStatus.LOADING}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              {status === CrawlStatus.LOADING ? (
                <>
                  <Icons.Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Scanning...
                </>
              ) : (
                <>
                  Scan Page
                  <Icons.ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>
          {errorMsg && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
              <Icons.Alert className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Target Page</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 truncate" title={result.url}>
                  {new URL(result.url).hostname}
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">External Links</p>
                  <p className="mt-1 text-3xl font-bold text-blue-600">{result.externalCount}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-full">
                  <Icons.ExternalLink className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center gap-3">
                 <button
                    onClick={handleAnalyze}
                    disabled={analysisStatus === AnalysisStatus.ANALYZING || analysisStatus === AnalysisStatus.DONE || result.links.length === 0}
                    className={`w-full inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-lg focus:outline-none transition-all ${
                      analysisStatus === AnalysisStatus.DONE
                      ? 'bg-green-50 text-green-700 border-green-200 cursor-default'
                      : 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                    }`}
                  >
                    {analysisStatus === AnalysisStatus.ANALYZING ? (
                      <Icons.Loader className="animate-spin w-4 h-4 mr-2" />
                    ) : analysisStatus === AnalysisStatus.DONE ? (
                      <Icons.Sparkles className="w-4 h-4 mr-2" />
                    ) : (
                      <Icons.Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {analysisStatus === AnalysisStatus.ANALYZING ? 'Categorizing...' : analysisStatus === AnalysisStatus.DONE ? 'AI Analysis Complete' : 'Analyze with Gemini'}
                  </button>

                  <button
                    onClick={handleExport}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
                  >
                    <Icons.Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </button>
              </div>
            </div>

            {/* Main Table */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-800">Outbound Links Detected</h2>
              <LinkTable links={result.links} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;