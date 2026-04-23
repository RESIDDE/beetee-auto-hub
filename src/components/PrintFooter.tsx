import React from 'react';

// For use inside React DOM trees (like AuthorityToSell.tsx)
export function PrintFooter() {
  return (
    <div className="mt-12 pt-4 border-t border-gray-200 text-center opacity-70">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#1D3557]">
        BEE TEE AUTOMOBILE — Sales • Services • Maintenance • Modification • Logistics
      </p>
      <p className="text-[9px] text-gray-500 mt-1 font-sans">
        Plot 36A & 36B Wole Soyinka way, Cadastral zone B15, Jahi, Abuja.
      </p>
    </div>
  );
}

export function getPrintFooterHTML() {
  return `
    <div style="margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; opacity: 0.8;">
      <p style="font-family: Arial, sans-serif; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #1D3557; margin: 0;">
        BEE TEE AUTOMOBILE — Sales • Services • Maintenance • Modification • Logistics
      </p>
      <p style="font-family: Arial, sans-serif; font-size: 9px; color: #64748b; margin-top: 4px; margin-bottom: 0;">
        Plot 36A & 36B Wole Soyinka way, Cadastral zone B15, Jahi, Abuja.
      </p>
    </div>
  `;
}
