import logo from "@/assets/logo.png";

const HEADER_BLUE = "#1D325F"; // Matches the dark navy in image

// For use inside React DOM trees (like AuthorityToSell.tsx)
export function PrintHeader() {
  return (
    <div className="flex items-center justify-start border-b-[3px] border-[#1D325F] pb-4 mb-6">
      <img src={logo} alt="Bee Tee Logo" className="w-[120px] h-[120px] object-contain mr-6" />
      <div className="flex-1 flex flex-col items-center">
        <h1 className="font-sans font-black text-[42px] tracking-tight uppercase m-0 leading-tight text-[#1D325F]" style={{ fontFamily: 'Arial Black, sans-serif' }}>
          BEE TEE AUTOMOBILE
        </h1>
        <div className="w-full text-center space-y-0.5">
          <p className="text-[13px] font-bold text-black m-0 leading-tight">
            Address: <span className="font-normal">Plot 36A &amp; 36B Wole Soyinka way, Cadastral zone B15, Jahi, Abuja.</span>
          </p>
          <p className="text-[13px] font-bold text-black m-0 leading-tight">
            Tel: <span className="font-normal">09077777211, 09162228881</span>
          </p>
          <p className="text-[13px] font-bold text-black m-0 leading-tight">
            Email: <span className="font-normal text-[#3682be] italic underline underline-offset-2">beeteeautomobile@gmail.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// For use inside string-based html window popups
export function getPrintHeaderHTML(base64Logo?: string) {
  const logoUrl = base64Logo || `${window.location.origin}${logo}`;
  return `
    <div style="display: flex; align-items: center; justify-content: flex-start; border-bottom: 3px solid ${HEADER_BLUE}; padding-bottom: 12px; margin-bottom: 24px;">
      <img src="${logoUrl}" style="width: 120px; height: 120px; object-fit: contain; margin-right: 20px;" />
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center; color: ${HEADER_BLUE};">
        <h1 style="font-family: Arial Black, sans-serif; font-weight: 900; font-size: 42px; margin: 0; color: ${HEADER_BLUE}; text-transform: uppercase; letter-spacing: -2px; line-height: 1.1;">
          BEE TEE AUTOMOBILE
        </h1>
        <div style="margin-top: 4px; width: 100%; text-align: center;">
          <p style="font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; margin: 2px 0; color: #000;">
            Address: <span style="font-weight: normal;">Plot 36A &amp; 36B Wole Soyinka way, Cadastral zone B15, Jahi, Abuja.</span>
          </p>
          <p style="font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; margin: 2px 0; color: #000;">
            Tel: <span style="font-weight: normal;">09077777211, 09162228881</span>
          </p>
          <p style="font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; margin: 2px 0; color: #000;">
            Email: <span style="color: #3682be; text-decoration: underline; font-style: italic; font-weight: normal;">beeteeautomobile@gmail.com</span>
          </p>
        </div>
      </div>
    </div>
  `;
}

// React component for watermark
export function PrintWatermark() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.4] select-none">
      <img src={logo} alt="Watermark" className="w-[500px] h-[500px] object-contain opacity-20" />
    </div>
  );
}

// For use inside string-based html window popups
export function getPrintWatermarkHTML(base64Logo?: string) {
  const logoUrl = base64Logo || `${window.location.origin}${logo}`;
  return `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 0;
      opacity: 0.15;
      user-select: none;
    ">
      <img src="${logoUrl}" style="width: 550px; height: 550px; object-fit: contain;" />
    </div>
  `;
}
