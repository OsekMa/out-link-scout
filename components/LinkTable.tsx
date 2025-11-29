import React from 'react';
import { LinkData } from '../types';
import { Icons } from './Icons';

interface LinkTableProps {
  links: LinkData[];
}

export const LinkTable: React.FC<LinkTableProps> = ({ links }) => {
  if (links.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200 shadow-sm">
        <Icons.Link className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>No external links found on this page.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th scope="col" className="px-6 py-3">Domain / Category</th>
              <th scope="col" className="px-6 py-3">Link Details</th>
              <th scope="col" className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link, index) => (
              <tr key={`${link.href}-${index}`} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap align-top">
                  <div className="flex items-center gap-2">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${link.hostname}&sz=32`} 
                      alt="favicon" 
                      className="w-4 h-4 opacity-70"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                    />
                    <div className="flex flex-col">
                      <span>{link.hostname}</span>
                      {link.category && (
                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 w-fit">
                          <Icons.Sparkles className="w-3 h-3 mr-1" />
                          {link.category}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 max-w-md">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-800 truncate" title={link.text}>
                      {link.text || "No Anchor Text"}
                    </span>
                    <span className="text-xs text-slate-400 truncate font-mono" title={link.href}>
                      {link.href}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right align-middle">
                  <a 
                    href={link.href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                    title="Open Link"
                  >
                    <Icons.ExternalLink className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
