export default function DebaScreen() {
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans flex flex-col">
      <div className="flex-grow flex flex-col justify-center max-w-5xl mx-auto w-full px-6 py-12">
        <h1 className="text-4xl md:text-5xl text-gray-800 font-light mb-2">
          Error <span className="font-semibold">404</span>
        </h1>
        <h2 className="text-2xl text-gray-500 font-light mb-8">Not found</h2>
        
        <div className="w-full h-px bg-gray-200 mb-8"></div>
        
        {/* Empty space where the write-up would normally be, kept empty as requested */}
        <div className="py-12"></div>
      </div>
      
      <div className="bg-gray-100 border-t border-gray-200 py-6 px-6 text-sm text-gray-500">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>Ray ID: {Math.random().toString(36).substring(2, 15).toUpperCase()} • {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</p>
          <p>Performance &amp; security by Cloudflare</p>
        </div>
      </div>
    </div>
  );
}
