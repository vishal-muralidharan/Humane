import { useState } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import { humanizeText } from './api/humanize';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleHumanize() {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setOutputText('');
    setError(null);

    try {
      const result = await humanizeText(inputText);
      setOutputText(result);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans antialiased selection:bg-zinc-800">
      <Header />

      <div className="text-center pt-8 pb-6 px-4">
        <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-white">
          Humanize Text
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto font-light tracking-wide">
          AI to human rewrite.
        </p>
      </div>

      <main
        className="flex flex-col md:flex-row flex-1 gap-4 px-4 sm:px-6 lg:px-10 pb-10 max-w-[1600px] mx-auto w-full h-[calc(100vh-200px)]"
        role="main"
      >
        <section className="flex-1 flex flex-col" aria-label="Input section">
          <InputPanel
            inputText={inputText}
            setInput={setInputText}
            onHumanize={handleHumanize}
            isLoading={isLoading}
          />
        </section>

        <div className="hidden md:flex flex-col items-center gap-2 pt-10">
          <div className="w-px flex-1 bg-zinc-800" />
        </div>

        <section className="flex-1 flex flex-col" aria-label="Output section">
          <OutputPanel
            outputText={outputText}
            isLoading={isLoading}
            error={error}
          />
        </section>
      </main>
    </div>
  );
}
