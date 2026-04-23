// For use inside React DOM trees (like AuthorityToSell.tsx)
export function PrintHeader() {
  return (
    <div className="flex items-center justify-start border-b-[3px] border-[#1D3557] pb-4 mb-6">
      <div className="text-left text-[#1D3557]">
        <h1 className="font-sans font-black text-3xl mb-1 tracking-wider uppercase m-0" style={{ fontFamily: '"Arial Black", Impact, sans-serif' }}>
          BEE TEE AUTOMOBILE
        </h1>
        <p className="text-sm font-bold mb-1 mt-0 text-black">
          Address: <span className="font-normal">Plot 36A &amp; 36B Wole Soyinka way, Cadastral zone B15, Jahi, Abuja.</span>
        </p>
        <p className="text-sm font-bold mb-1 mt-0 text-black">
          Tel: <span className="font-normal">09077777211, 09162228881</span>
        </p>
        <p className="text-sm font-bold mb-0 mt-0 text-black">
          Email: <span className="font-normal text-[#007BFF] underline italic">beeteeautomobile@gmail.com</span>
        </p>
      </div>
    </div>
  );
}

// For use inside string-based html window popups (like Invoices.tsx, Sales.tsx, exportHelpers.ts)
export function getPrintHeaderHTML(_base64Logo?: string) {
  return `
    <div style="display: flex; align-items: center; justify-content: flex-start; border-bottom: 3px solid #1D3557; padding-bottom: 16px; margin-bottom: 24px;">
      <div style="text-align: left; color: #1D3557;">
        <h1 style="font-family: 'Arial Black', Impact, sans-serif; font-size: 28px; margin: 0 0 4px 0; letter-spacing: 1px; color: #1D3557; text-transform: uppercase;">
          BEE TEE AUTOMOBILE
        </h1>
        <p style="font-size: 13px; font-weight: bold; margin: 4px 0; color: #000;">
          Address: <span style="font-weight: normal;">Plot 36A &amp; 36B Wole Soyinka way, Cadastral zone B15, Jahi, Abuja.</span>
        </p>
        <p style="font-size: 13px; font-weight: bold; margin: 4px 0; color: #000;">
          Tel: <span style="font-weight: normal;">09077777211, 09162228881</span>
        </p>
        <p style="font-size: 13px; font-weight: bold; margin: 4px 0; color: #000;">
          Email: <span style="color: #007BFF; text-decoration: underline; font-style: italic; font-weight: normal;">beeteeautomobile@gmail.com</span>
        </p>
      </div>
    </div>
  `;
}

// React component for watermark — removed logo, renders nothing
export function PrintWatermark() {
  return null;
}

// For use inside string-based html window popups — removed logo watermark
export function getPrintWatermarkHTML(_base64Logo?: string) {
  return ``;
}
