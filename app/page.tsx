import Converter from './components/Converter';

export default function Home() {
  return (
    <main className="min-h-screen py-24 px-4 flex flex-col items-center justify-center relative overflow-hidden">

      <div className="absolute top-4 right-4">
        <a
          href="https://github.com/hardik-xi11/free-image"
          className='text-yellow-500 hover:text-yellow-300 transition-colors'
        >
          ⭐ on GitHub
        </a>
      </div>

      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto space-y-6 text-center mb-16 relative z-10">
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9]">
          <span className="block text-white mb-2">Free-Image</span>
          <span className="arc-gradient-text drop-shadow-2xl">Converter</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light tracking-wide">
          Free. Open Source. <span className="text-yellow-400 font-medium">Secure & Fast.</span>
        </p>
      </div>

      <Converter />
    </main>
  );
}
